import React, { useMemo, useState } from 'react';
import {
    FaTasks,
    FaCheckCircle,
    FaClock,
    FaFire,
    FaChartLine,
    FaList
} from 'react-icons/fa';

const Analytics = ({ tasks }) => {
    const [timePeriod, setTimePeriod] = useState('week'); // week, month, all

    // Filter tasks based on time period
    const filteredTasks = useMemo(() => {
        if (timePeriod === 'all') return tasks;

        // 1. Get current date in User's Local Time (as UTC components)
        // This 'shifted' date represents user's wall-clock time placed in UTC
        const now = new Date();
        const offsetMinutes = now.getTimezoneOffset();
        const shiftedDate = new Date(now.getTime() - (offsetMinutes * 60 * 1000));

        // Helper to format shifted UTC date as YYYY-MM-DD
        const getShiftedDateString = (date) => {
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if (timePeriod === 'week') {
            // Use UTC methods on the shifted date because it aligns with user's wall clock
            const dayOfWeek = shiftedDate.getUTCDay(); // 0=Sun, 1=Mon...

            // Calculate start of week (Monday)
            const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const startOfWeek = new Date(shiftedDate);
            startOfWeek.setUTCDate(shiftedDate.getUTCDate() - daysSinceMonday);

            // Calculate end of week (Sunday)
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);

            const startOfWeekStr = getShiftedDateString(startOfWeek);
            const endOfWeekStr = getShiftedDateString(endOfWeek);

            const filtered = tasks.filter(task => task.date >= startOfWeekStr && task.date <= endOfWeekStr);
            return filtered;
        }

        if (timePeriod === 'month') {
            // Start of month: 1st day of current user-month
            const startOfMonth = new Date(shiftedDate);
            startOfMonth.setUTCDate(1);

            // End of month: 0th day of next month
            const endOfMonth = new Date(shiftedDate);
            endOfMonth.setUTCMonth(endOfMonth.getUTCMonth() + 1);
            endOfMonth.setUTCDate(0);

            const startStr = getShiftedDateString(startOfMonth);
            const endStr = getShiftedDateString(endOfMonth);

            const filtered = tasks.filter(task => task.date >= startStr && task.date <= endStr);
            return filtered;
        }

        return tasks;
    }, [tasks, timePeriod]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalTasks = filteredTasks.length;
        const completedTasks = filteredTasks.filter(t => t.completed).length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

        let totalHours = 0;
        const dailyHours = {};

        filteredTasks.forEach(task => {
            const startTime = new Date(`${task.date}T${task.startTime}`);
            const endTime = new Date(`${task.date}T${task.endTime}`);
            const duration = (endTime - startTime) / (60 * 60 * 1000);

            totalHours += duration;

            // Track by day
            dailyHours[task.date] = (dailyHours[task.date] || 0) + duration;
        });

        const avgDailyHours = Object.keys(dailyHours).length > 0
            ? (totalHours / Object.keys(dailyHours).length).toFixed(1)
            : 0;

        return {
            totalTasks,
            completionRate,
            totalHours: totalHours.toFixed(1),
            avgDailyHours
        };
    }, [filteredTasks]);




    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(`${dateString}T00:00:00`);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Get date range for display
    const dateRangeDisplay = useMemo(() => {
        const taskCount = filteredTasks.length;
        const taskText = taskCount === 1 ? 'task' : 'tasks';

        if (timePeriod === 'all') return `All Time (${taskCount} ${taskText})`;

        // Use same robust logic as filter
        const now = new Date();
        const offsetMinutes = now.getTimezoneOffset();
        const shiftedDate = new Date(now.getTime() - (offsetMinutes * 60 * 1000));

        const getShiftedDateString = (date) => {
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if (timePeriod === 'week') {
            const dayOfWeek = shiftedDate.getUTCDay();
            const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

            const startOfWeek = new Date(shiftedDate);
            startOfWeek.setUTCDate(shiftedDate.getUTCDate() - daysSinceMonday);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);

            return `${formatDate(getShiftedDateString(startOfWeek))} - ${formatDate(getShiftedDateString(endOfWeek))} (${taskCount} ${taskText})`;
        }

        if (timePeriod === 'month') {
            // Use UTC methods on shifted date for consistent month display
            const monthName = shiftedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
            return `${monthName} (${taskCount} ${taskText})`;
        }

        return '';
    }, [timePeriod, filteredTasks.length]);

    return (
        <section className="content-section active">
            {/* Time Period Filter */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <div>
                        <h2 className="card-title">Analytics Dashboard</h2>
                        <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>
                            {dateRangeDisplay}
                        </div>
                    </div>
                    <FaChartLine />
                </div>
                <div className="filter-container" style={{ marginBottom: 0 }}>
                    <div className="filter-group">
                        <label className="form-label">Time Period</label>
                        <select
                            className="form-control"
                            value={timePeriod}
                            onChange={(e) => setTimePeriod(e.target.value)}
                        >
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="analytics-stats">
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(74, 107, 223, 0.1)', color: '#4a6bdf' }}>
                        <FaTasks />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.totalTasks}</div>
                        <div className="stat-label">Total Tasks</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(40, 167, 69, 0.1)', color: '#28a745' }}>
                        <FaCheckCircle />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.completionRate}%</div>
                        <div className="stat-label">Completion Rate</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', color: '#ffc107' }}>
                        <FaClock />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.totalHours}h</div>
                        <div className="stat-label">Total Hours</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(111, 66, 193, 0.1)', color: '#6f42c1' }}>
                        <FaFire />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.avgDailyHours}h</div>
                        <div className="stat-label">Avg Daily Hours</div>
                    </div>
                </div>
            </div>





            {/* Detailed Task List */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h2 className="card-title">Task Duration Breakdown</h2>
                    <FaList />
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                                <th style={{ padding: '12px', color: '#6c757d' }}>Task Name</th>
                                <th style={{ padding: '12px', color: '#6c757d', textAlign: 'center' }}>Count</th>
                                <th style={{ padding: '12px', color: '#6c757d', textAlign: 'right' }}>Avg. Duration</th>
                                <th style={{ padding: '12px', color: '#6c757d', textAlign: 'right' }}>Total Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const stats = {};
                                filteredTasks.forEach(task => {
                                    const startTime = new Date(`${task.date}T${task.startTime}`);
                                    const endTime = new Date(`${task.date}T${task.endTime}`);
                                    const duration = (endTime - startTime) / (60 * 60 * 1000);

                                    if (!stats[task.title]) {
                                        stats[task.title] = { duration: 0, count: 0 };
                                    }
                                    stats[task.title].duration += duration;
                                    stats[task.title].count += 1;
                                });

                                const sortedStats = Object.entries(stats)
                                    .sort((a, b) => b[1].duration - a[1].duration);

                                const formatDuration = (hours) => {
                                    const h = Math.floor(hours);
                                    const m = Math.round((hours - h) * 60);
                                    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                };

                                if (sortedStats.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                                                No tasks found for this period
                                            </td>
                                        </tr>
                                    );
                                }

                                return sortedStats.map(([title, data], index) => (
                                    <tr key={title} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                        <td style={{ padding: '12px', fontWeight: '500' }}>{title}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>{data.count}</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>{formatDuration(data.duration / data.count)}</td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#4a6bdf' }}>{formatDuration(data.duration)}</td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default Analytics;
