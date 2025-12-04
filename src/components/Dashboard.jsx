import React, { useMemo } from 'react';
import { FaCalendarDay, FaCalendarWeek, FaChartLine, FaCopy, FaCalendarTimes, FaCalendarPlus, FaCheckCircle, FaCircle, FaEdit, FaTrash, FaClock } from 'react-icons/fa';

const Dashboard = ({ tasks, onEditTask, onDeleteTask, onToggleTaskComplete, onOpenCopyModal }) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const dailyRemaining = useMemo(() => {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const timePassed = now - startOfDay;

        let totalTaskDuration = 0;
        tasks.forEach(task => {
            if (task.date === today && !task.completed) {
                const startTime = new Date(`${task.date}T${task.startTime}`);
                const endTime = new Date(`${task.date}T${task.endTime}`);
                totalTaskDuration += endTime - startTime;
            }
        });

        const totalDayMs = 24 * 60 * 60 * 1000;
        const remainingTimeMs = totalDayMs - timePassed - totalTaskDuration;

        const hours = Math.floor(remainingTimeMs / (60 * 60 * 1000));
        const minutes = Math.floor((remainingTimeMs % (60 * 60 * 1000)) / (60 * 1000));

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }, [tasks, now, today]);

    const weeklyRemaining = useMemo(() => {
        const dayOfWeek = now.getDay();

        if (dayOfWeek === 0) {
            return dailyRemaining;
        }

        const startOfWeek = new Date(now);
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(now.getDate() - daysSinceMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const totalWeekMs = 7 * 24 * 60 * 60 * 1000;
        const timePassedSinceStartOfWeek = now - startOfWeek;

        let totalTaskDuration = 0;
        tasks.forEach(task => {
            const taskDate = new Date(task.date);
            if (taskDate >= startOfWeek && taskDate <= endOfWeek) {
                const startTime = new Date(`${task.date}T${task.startTime}`);
                const endTime = new Date(`${task.date}T${task.endTime}`);
                totalTaskDuration += endTime - startTime;
            }
        });

        const remainingFreeTimeMs = totalWeekMs - timePassedSinceStartOfWeek - totalTaskDuration;

        const hours = Math.floor(remainingFreeTimeMs / (60 * 60 * 1000));
        const minutes = Math.floor((remainingFreeTimeMs % (60 * 60 * 1000)) / (60 * 1000));

        const displayHours = Math.max(0, hours);
        const displayMinutes = Math.max(0, minutes);

        return `${displayHours.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}`;
    }, [tasks, now, dailyRemaining]);

    const todayProgress = useMemo(() => {
        let totalTaskDuration = 0;
        tasks.forEach(task => {
            if (task.date === today) {
                const startTime = new Date(`${task.date}T${task.startTime}`);
                const endTime = new Date(`${task.date}T${task.endTime}`);
                totalTaskDuration += endTime - startTime;
            }
        });

        const totalDayMs = 24 * 60 * 60 * 1000;
        const progress = Math.min(100, Math.round((totalTaskDuration / totalDayMs) * 100));
        return `${progress}%`;
    }, [tasks, today]);

    const todayTasks = useMemo(() => {
        return tasks
            .filter(task => task.date === today)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [tasks, today]);

    const upcomingTasks = useMemo(() => {
        return tasks
            .filter(task => {
                const taskDate = new Date(task.date);
                // Simple comparison for "upcoming" (today or future, not completed)
                // Note: Original logic used `taskDate >= now` which is tricky with just date string. 
                // Original: `taskDate >= now` where taskDate is from `new Date(task.date)` (midnight) and `now` is current time.
                // If task.date is today, `new Date(today)` is midnight today. `now` is current time.
                // So `new Date(today) >= now` is false if it's past midnight.
                // The original logic `taskDate >= now` might have excluded today's tasks if `now` > midnight?
                // Wait, `new Date('2023-10-27')` is UTC or local midnight? `valueAsDate` sets it.
                // Let's stick to: date >= todayStr.
                return task.date >= today && !task.completed;
            })
            .sort((a, b) => {
                const dateCompare = a.date.localeCompare(b.date);
                if (dateCompare !== 0) return dateCompare;
                return a.startTime.localeCompare(b.startTime);
            })
            .slice(0, 5);
    }, [tasks, today]);

    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    };

    return (
        <section className="content-section active">
            <div className="dashboard">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Daily Remaining Time</h2>
                        <FaCalendarDay />
                    </div>
                    <div className="time-display">{dailyRemaining}</div>
                    <div className="time-label">Hours:Minutes remaining today</div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Weekly Remaining Time</h2>
                        <FaCalendarWeek />
                    </div>
                    <div className="time-display">{weeklyRemaining}</div>
                    <div className="time-label">Hours:Minutes remaining this week</div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Today's Progress</h2>
                        <FaChartLine />
                    </div>
                    <div className="time-display">{todayProgress}</div>
                    <div className="time-label">Of today's time scheduled</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Today's Schedule</h2>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <FaCalendarDay />
                        <button className="btn btn-info" onClick={() => onOpenCopyModal('today')}>
                            <FaCopy /> Copy Schedule
                        </button>
                    </div>
                </div>
                <div className="task-list">
                    {todayTasks.length === 0 ? (
                        <div className="empty-state">
                            <FaCalendarTimes />
                            <p>No tasks scheduled for today</p>
                        </div>
                    ) : (
                        todayTasks.map(task => (
                            <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                                <div className="task-info">
                                    <div className="task-title">{task.title}</div>
                                    <div className="task-time">{formatTime(task.startTime)} - {formatTime(task.endTime)}</div>
                                    <div className="task-tags">
                                        {task.tags.map((tag, index) => (
                                            <span key={index} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="task-actions">
                                    <button
                                        className={`btn ${task.completed ? 'btn-success' : 'btn-primary'}`}
                                        onClick={() => onToggleTaskComplete(task.id)}
                                    >
                                        {task.completed ? <FaCheckCircle /> : <FaCircle />}
                                    </button>
                                    <button className="btn btn-warning" onClick={() => onEditTask(task)}>
                                        <FaEdit />
                                    </button>
                                    <button className="btn btn-danger" onClick={() => onDeleteTask(task.id)}>
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h2 className="card-title">Upcoming Tasks</h2>
                    <FaClock />
                </div>
                <div className="task-list">
                    {upcomingTasks.length === 0 ? (
                        <div className="empty-state">
                            <FaCalendarPlus />
                            <p>No upcoming tasks</p>
                        </div>
                    ) : (
                        upcomingTasks.map(task => {
                            const isToday = task.date === today;
                            const dateStr = isToday ? 'Today' : formatDate(task.date);
                            return (
                                <div key={task.id} className="task-item">
                                    <div className="task-info">
                                        <div className="task-title">{task.title}</div>
                                        <div className="task-time">{dateStr}, {formatTime(task.startTime)} - {formatTime(task.endTime)}</div>
                                        <div className="task-tags">
                                            {task.tags.map((tag, index) => (
                                                <span key={index} className="tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="task-actions">
                                        <button className="btn btn-primary" onClick={() => onToggleTaskComplete(task.id)}>
                                            <FaCircle />
                                        </button>
                                        <button className="btn btn-warning" onClick={() => onEditTask(task)}>
                                            <FaEdit />
                                        </button>
                                        <button className="btn btn-danger" onClick={() => onDeleteTask(task.id)}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
};

export default Dashboard;
