import React, { useMemo } from 'react';
import { FaCalendarDay, FaCalendarWeek, FaChartLine, FaCopy, FaCalendarTimes, FaCalendarPlus, FaCheckCircle, FaCircle, FaEdit, FaTrash, FaClock, FaCalendarAlt } from 'react-icons/fa';

const Dashboard = ({ tasks, onEditTask, onDeleteTask, onToggleTaskComplete, onOpenCopyModal }) => {
    const now = new Date();
    // Use local date string YYYY-MM-DD
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    const today = localDate.toISOString().split('T')[0];

    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatDate = (dateString) => {
        // Parse YYYY-MM-DD as local date by appending time
        const date = new Date(`${dateString}T00:00:00`);
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    };

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

    const weeklySchedules = useMemo(() => {
        const weeks = [];
        const dayOfWeek = now.getDay();
        const startOfCurrentWeek = new Date(now);
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startOfCurrentWeek.setDate(now.getDate() - daysSinceMonday);
        startOfCurrentWeek.setHours(0, 0, 0, 0);

        // Generate 8 weeks (covering ~2 months)
        for (let i = 0; i < 8; i++) {
            const start = new Date(startOfCurrentWeek);
            start.setDate(startOfCurrentWeek.getDate() + (i * 7));

            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);

            // Determine the effective start time for calculating remaining capacity
            // For current week, it's 'now'. For future weeks, it's the start of the week.
            // If 'now' is past the end of this week (shouldn't happen in loop starting at current week), capacity is 0.
            let effectiveStart = start;
            if (i === 0) {
                effectiveStart = now > start ? now : start;
            }

            // Filter tasks for this week to display
            const weekTasks = tasks
                .filter(task => {
                    const tDate = new Date(`${task.date}T00:00:00`);
                    return tDate >= start && tDate <= end && !task.completed;
                })
                .sort((a, b) => {
                    const dateCompare = a.date.localeCompare(b.date);
                    if (dateCompare !== 0) return dateCompare;
                    return a.startTime.localeCompare(b.startTime);
                });

            // Calculate remaining capacity
            let capacityMs = end - effectiveStart;
            if (capacityMs < 0) capacityMs = 0;

            // Calculate duration of tasks that consume this capacity
            // i.e., tasks that end after effectiveStart
            let scheduledDuration = 0;
            tasks.forEach(task => {
                const tDate = new Date(`${task.date}T00:00:00`);
                if (tDate >= start && tDate <= end) {
                    const s = new Date(`${task.date}T${task.startTime}`);
                    const e = new Date(`${task.date}T${task.endTime}`);

                    // Only count the portion of the task that is in the future (after effectiveStart)
                    if (e > effectiveStart) {
                        const effectiveTaskStart = s > effectiveStart ? s : effectiveStart;
                        scheduledDuration += (e - effectiveTaskStart);
                    }
                }
            });

            const remainingMs = Math.max(0, capacityMs - scheduledDuration);

            const hours = Math.floor(remainingMs / (60 * 60 * 1000));
            const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
            const displayHours = Math.max(0, hours);
            const displayMinutes = Math.max(0, minutes);
            const remainingStr = `${displayHours.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}`;

            // Add to list if it's current/next week OR has tasks
            weeks.push({
                id: i,
                label: i === 0 ? "This Week" : i === 1 ? "Next Week" : `Week of ${formatDate(start.toISOString().split('T')[0])}`,
                tasks: weekTasks,
                remaining: remainingStr,
                remainingMs: remainingMs
            });
        }
        return weeks;
    }, [tasks, now]);

    const totalRemaining = useMemo(() => {
        // Sum up remainingMs from all weeks (we need to recalculate for hidden weeks if we want TRUE total, 
        // but weeklySchedules only returns visible ones? 
        // Actually, weeklySchedules logic filters what to PUSH, but we want total for ALL 8 weeks.
        // Let's duplicate the loop or adjust weeklySchedules to return all, and filter in render?
        // Better: Adjust weeklySchedules to return ALL 8 weeks, and we filter in the render.
        const totalMs = weeklySchedules.reduce((sum, week) => sum + week.remainingMs, 0);
        const hours = Math.floor(totalMs / (60 * 60 * 1000));
        const minutes = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }, [weeklySchedules]);

    // Actually, let's refactor weeklySchedules to return ALL 8 weeks, and filter in the View.
    // This allows totalRemaining to just reduce the array.


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



    return (
        <section className="content-section active">
            <div className="dashboard">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Daily Remaining</h2>
                        <FaCalendarDay />
                    </div>
                    <div className="time-display">{dailyRemaining}</div>
                    <div className="time-label">Hours:Minutes today</div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Weekly Remaining Time</h2>
                        <FaCalendarWeek />
                    </div>
                    <div className="time-display">{weeklySchedules[0]?.remaining || "00:00"}</div>
                    <div className="time-label">Hours:Minutes remaining this week</div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Total Future Remaining</h2>
                        <FaClock />
                    </div>
                    <div className="time-display">{totalRemaining}</div>
                    <div className="time-label">Hours:Minutes remaining next 8 weeks</div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Today's Progress</h2>
                        <FaChartLine />
                    </div>
                    <div className="time-display">{todayProgress}</div>
                    <div className="time-label">Of today's schedule</div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
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

            {weeklySchedules
                .filter(week => week.id < 2 || week.tasks.length > 0) // Only show current/next week or weeks with tasks
                .map(week => (
                    <div key={week.id} className="card" style={{ marginTop: '20px' }}>
                        <div className="card-header">
                            <h2 className="card-title">{week.label} <span style={{ fontSize: '0.8em', opacity: 0.8, marginLeft: '10px' }}>({week.remaining} remaining)</span></h2>
                            <FaCalendarWeek />
                        </div>
                        <div className="task-list">
                            {week.tasks.length === 0 ? (
                                <div className="empty-state">
                                    <FaCalendarTimes />
                                    <p>No tasks scheduled</p>
                                </div>
                            ) : (
                                week.tasks.map(task => {
                                    const dateStr = formatDate(task.date);
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
                ))}

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
