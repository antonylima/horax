import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Analytics from './components/Analytics';
import Modal from './components/Modal';
import NotificationContainer from './components/Notification';
import { FaCopy, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';
import { query } from './lib/db';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

function App() {
  // State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [editingTask, setEditingTask] = useState(null);

  // Modal State
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [copySourceDate, setCopySourceDate] = useState(null);
  const [selectedTargetDates, setSelectedTargetDates] = useState([]);
  const [selectedClearDates, setSelectedClearDates] = useState([]);
  const [dayOptions, setDayOptions] = useState([]);

  // Helper to map DB task to App task
  const mapTaskFromDb = (dbTask) => {
    // Handle date which might be a Date object or string
    let dateStr = dbTask.date;
    if (dbTask.date instanceof Date) {
      dateStr = dbTask.date.toISOString().split('T')[0];
    } else if (typeof dbTask.date === 'string' && dbTask.date.includes('T')) {
      dateStr = dbTask.date.split('T')[0];
    }

    return {
      id: dbTask.id,
      title: dbTask.title,
      date: dateStr,
      startTime: dbTask.start_time.slice(0, 5),
      endTime: dbTask.end_time.slice(0, 5),
      tags: dbTask.tags || [],
      completed: dbTask.completed,
      notified: dbTask.notified,
      createdAt: dbTask.created_at
    };
  };

  // Fetch tasks from DB
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await query('SELECT * FROM tasks ORDER BY date, start_time');
      const mappedTasks = res.rows.map(mapTaskFromDb);
      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      addNotification('Error fetching tasks from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, []);

  // Notifications
  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now().toString() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Check notifications interval
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      setTasks(prevTasks => {
        let updated = false;
        const newTasks = prevTasks.map(task => {
          if (task.date === today && !task.completed && !task.notified) {
            const taskStartTime = new Date(`${task.date}T${task.startTime}`);
            const timeDiff = taskStartTime - now;

            // If task starts within 10 minutes
            if (timeDiff > 0 && timeDiff <= 10 * 60 * 1000) {
              addNotification(`Task "${task.title}" starts at ${formatTime(task.startTime)}`, 'info');
              // Update notified status in DB
              query('UPDATE tasks SET notified = TRUE WHERE id = $1', [task.id])
                .catch(err => console.error('Error updating notification status:', err));

              updated = true;
              return { ...task, notified: true };
            }
          }
          return task;
        });
        return updated ? newTasks : prevTasks;
      });
    };

    const interval = setInterval(checkNotifications, 60000);
    // Only check if tasks are loaded
    if (!loading && tasks.length > 0) {
      checkNotifications();
    }
    return () => clearInterval(interval);
  }, [addNotification, loading, tasks.length]); // Added dependencies

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Task Handlers
  const handleSaveTask = async (taskData) => {
    // Validate
    const validation = validateTask(taskData, taskData.id);
    if (!validation.valid) {
      addNotification(validation.message, 'error');
      return;
    }

    try {
      if (taskData.id) {
        // Update
        await query(
          'UPDATE tasks SET title = $1, date = $2, start_time = $3, end_time = $4, tags = $5 WHERE id = $6',
          [
            taskData.title,
            taskData.date,
            taskData.startTime,
            taskData.endTime,
            taskData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
            taskData.id
          ]
        );

        // Optimistic update or refetch
        // Let's refetch to be safe with types
        await fetchTasks();

        addNotification('Task updated successfully!', 'success');
        setEditingTask(null);
      } else {
        // Create
        const id = Date.now().toString(); // Use UUID in real app, but text ID is fine
        const tags = taskData.tags.split(',').map(t => t.trim()).filter(t => t !== '');

        await query(
          'INSERT INTO tasks (id, title, date, start_time, end_time, tags) VALUES ($1, $2, $3, $4, $5, $6)',
          [id, taskData.title, taskData.date, taskData.startTime, taskData.endTime, tags]
        );

        await fetchTasks();
        addNotification('Task created successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      addNotification('Error saving task to database', 'error');
    }
  };

  const validateTask = (task, excludeTaskId = null) => {
    const now = new Date();
    const taskDate = new Date(`${task.date}T${task.startTime}`);

    if (taskDate < now) {
      return { valid: false, message: 'Cannot create tasks in the past' };
    }

    const taskStart = new Date(`${task.date}T${task.startTime}`);
    const taskEnd = new Date(`${task.date}T${task.endTime}`);

    if (taskEnd <= taskStart) {
      return { valid: false, message: 'End time must be after start time' };
    }

    for (const existingTask of tasks) {
      if (existingTask.id === excludeTaskId) continue;

      if (existingTask.date === task.date) {
        const existingStart = new Date(`${existingTask.date}T${existingTask.startTime}`);
        const existingEnd = new Date(`${existingTask.date}T${existingTask.endTime}`);

        if (
          (taskStart >= existingStart && taskStart < existingEnd) ||
          (taskEnd > existingStart && taskEnd <= existingEnd) ||
          (taskStart <= existingStart && taskEnd >= existingEnd)
        ) {
          return { valid: false, message: `Task overlaps with "${existingTask.title}"` };
        }
      }
    }

    return { valid: true };
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await query('DELETE FROM tasks WHERE id = $1', [taskId]);
        setTasks(prev => prev.filter(t => t.id !== taskId));
        addNotification('Task deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting task:', error);
        addNotification('Error deleting task', 'error');
      }
    }
  };

  const handleToggleTaskComplete = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newCompleted = !task.completed;

      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: newCompleted } : t));

      await query('UPDATE tasks SET completed = $1 WHERE id = $2', [newCompleted, taskId]);
    } catch (error) {
      console.error('Error toggling task:', error);
      addNotification('Error updating task status', 'error');
      // Revert on error
      fetchTasks();
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setActiveTab('tasks');
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  // Modal Handlers
  const generateDayOptions = (startDate, count = 14) => {
    const options = [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    for (let i = 1; i <= count; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      options.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        disabled: false // Can add logic here
      });
    }
    return options;
  };

  const openCopyModal = (sourceType) => {
    if (sourceType === 'today') {
      const today = new Date().toISOString().split('T')[0];
      openCopyModalForDate(today);
    }
  };

  const openCopyModalForDate = (date) => {
    setCopySourceDate(date);
    setSelectedTargetDates([]);
    setDayOptions(generateDayOptions(new Date())); // Generate next 14 days from today
    setCopyModalOpen(true);
  };

  const handleDaySelect = (date) => {
    setSelectedTargetDates(prev => {
      if (prev.includes(date)) return prev.filter(d => d !== date);
      return [...prev, date];
    });
  };

  const handleCopySchedule = async () => {
    if (!copySourceDate || selectedTargetDates.length === 0) {
      addNotification('Please select at least one target day', 'error');
      return;
    }

    const sourceTasks = tasks.filter(task => task.date === copySourceDate);
    if (sourceTasks.length === 0) {
      addNotification('No tasks found on the source day', 'error');
      return;
    }

    let copiedCount = 0;
    let conflictCount = 0;

    // We need to process sequentially or Promise.all
    // But we need to check overlaps. 
    // Since we have client-side state, we can check overlaps locally first, then bulk insert?
    // Or just insert one by one.

    try {
      const tasksToInsert = [];

      selectedTargetDates.forEach(targetDate => {
        sourceTasks.forEach(sourceTask => {
          const newTask = {
            ...sourceTask,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            date: targetDate,
            completed: false,
            notified: false
          };

          // Check overlap against current tasks AND tasksToInsert
          const isOverlap = (t, taskList) => {
            const tStart = new Date(`${t.date}T${t.startTime}`);
            const tEnd = new Date(`${t.date}T${t.endTime}`);

            for (const existing of taskList) {
              if (existing.date === t.date && existing.id !== t.id) {
                const eStart = new Date(`${existing.date}T${existing.startTime}`);
                const eEnd = new Date(`${existing.date}T${existing.endTime}`);
                if (
                  (tStart >= eStart && tStart < eEnd) ||
                  (tEnd > eStart && tEnd <= eEnd) ||
                  (tStart <= eStart && tEnd >= eEnd)
                ) return true;
              }
            }
            return false;
          };

          if (!isOverlap(newTask, [...tasks, ...tasksToInsert])) {
            tasksToInsert.push(newTask);
            copiedCount++;
          } else {
            conflictCount++;
          }
        });
      });

      if (tasksToInsert.length > 0) {
        // Bulk insert or loop
        for (const task of tasksToInsert) {
          await query(
            'INSERT INTO tasks (id, title, date, start_time, end_time, tags) VALUES ($1, $2, $3, $4, $5, $6)',
            [task.id, task.title, task.date, task.startTime, task.endTime, task.tags]
          );
        }
        await fetchTasks();
      }

      setCopyModalOpen(false);

      let message = `Successfully copied ${copiedCount} task(s)`;
      if (conflictCount > 0) {
        message += `. ${conflictCount} task(s) skipped due to conflicts (overlap with existing tasks).`;
        addNotification(message, 'warning'); // Use warning for partial success
      } else {
        addNotification(message, 'success');
      }
    } catch (error) {
      console.error('Error copying schedule:', error);
      addNotification('Error copying schedule', 'error');
    }
  };

  const openClearModal = () => {
    setSelectedClearDates([]);
    // Generate next 14 days including today for clearing
    const options = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      options.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    setDayOptions(options);
    setClearModalOpen(true);
  };

  const handleClearDaySelect = (date) => {
    setSelectedClearDates(prev => {
      if (prev.includes(date)) return prev.filter(d => d !== date);
      return [...prev, date];
    });
  };

  const handleClearSelectedDays = async () => {
    if (selectedClearDates.length === 0) {
      addNotification('Please select at least one day to clear', 'error');
      return;
    }

    let tasksToDelete = 0;
    selectedClearDates.forEach(date => {
      tasksToDelete += tasks.filter(task => task.date === date).length;
    });

    if (tasksToDelete === 0) {
      addNotification('No tasks found on the selected days', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete all ${tasksToDelete} task(s)?`)) {
      try {
        // We need to delete where date IN (...)
        // Parameterized query for IN clause is tricky, let's loop or build query
        // Safe way with loop for now
        for (const date of selectedClearDates) {
          await query('DELETE FROM tasks WHERE date = $1', [date]);
        }

        await fetchTasks();
        setClearModalOpen(false);
        addNotification(`Successfully cleared tasks from ${selectedClearDates.length} day(s)`, 'success');
      } catch (error) {
        console.error('Error clearing days:', error);
        addNotification('Error clearing days', 'error');
      }
    }
  };

  const handleClearSingleDay = async (date) => {
    const tasksToDelete = tasks.filter(task => task.date === date).length;
    if (tasksToDelete === 0) {
      addNotification('No tasks found on this day', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete all ${tasksToDelete} task(s) on this day?`)) {
      try {
        await query('DELETE FROM tasks WHERE date = $1', [date]);
        await fetchTasks();
        addNotification(`Successfully cleared tasks from ${date}`, 'success');
      } catch (error) {
        console.error('Error clearing day:', error);
        addNotification('Error clearing day', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div className="logo" style={{ fontSize: '48px', marginBottom: '20px', color: '#4a6bdf' }}>
          Horax
        </div>
        <div>Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="container">
        <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
          <Dashboard
            tasks={tasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onToggleTaskComplete={handleToggleTaskComplete}
            onOpenCopyModal={openCopyModal}
          />
        </div>

        <div style={{ display: activeTab === 'tasks' ? 'block' : 'none' }}>
          <Tasks
            tasks={tasks}
            editingTask={editingTask}
            onSaveTask={handleSaveTask}
            onCancelEdit={handleCancelEdit}
            onDeleteTask={handleDeleteTask}
            onToggleTaskComplete={handleToggleTaskComplete}
            onOpenClearModal={openClearModal}
            onOpenCopyModalForDate={openCopyModalForDate}
            onClearSingleDay={handleClearSingleDay}
            onEditTask={handleEditTask}
          />
        </div>

        <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
          {activeTab === 'analytics' && <Analytics tasks={tasks} />}
        </div>
      </main>

      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />

      {/* Copy Modal */}
      <Modal isOpen={copyModalOpen} onClose={() => setCopyModalOpen(false)} title="Copy Schedule">
        <div className="form-group">
          <label className="form-label">Select target day(s) to copy the schedule to:</label>
          <div className="day-selector">
            {dayOptions.map(option => (
              <div
                key={option.date}
                className={`day-option ${selectedTargetDates.includes(option.date) ? 'selected' : ''} ${option.date === copySourceDate ? 'disabled' : ''}`}
                onClick={() => option.date !== copySourceDate && handleDaySelect(option.date)}
              >
                <div className="day-name">{option.dayName}</div>
                <div className="day-date">{option.dayDate}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary btn-block" onClick={handleCopySchedule}>
            <FaCopy /> Copy Schedule
          </button>
          <button className="btn btn-secondary btn-block" onClick={() => setCopyModalOpen(false)}>
            <FaTrashAlt /> Cancel
          </button>
        </div>
      </Modal>

      {/* Clear Modal */}
      <Modal isOpen={clearModalOpen} onClose={() => setClearModalOpen(false)} title="Clear Multiple Days">
        <div className="confirmation-message">
          <h4><FaExclamationTriangle /> Warning</h4>
          <p>This will permanently delete all tasks on the selected days. This action cannot be undone.</p>
        </div>
        <div className="form-group">
          <label className="form-label">Select day(s) to clear:</label>
          <div className="day-selector">
            {dayOptions.map(option => (
              <div
                key={option.date}
                className={`day-option ${selectedClearDates.includes(option.date) ? 'clear-selected' : ''}`}
                onClick={() => handleClearDaySelect(option.date)}
              >
                <div className="day-name">{option.dayName}</div>
                <div className="day-date">{option.dayDate}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-danger btn-block" onClick={handleClearSelectedDays}>
            <FaTrashAlt /> Clear Selected Days
          </button>
          <button className="btn btn-secondary btn-block" onClick={() => setClearModalOpen(false)}>
            <FaTrashAlt /> Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default App;
