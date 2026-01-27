import React, { useMemo, useState } from 'react';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import {
    FaChartBar,
    FaTags,
    FaCalendarWeek,
    FaTasks,
    FaCheckCircle,
    FaClock,
    FaTrophy,
    FaFire,
    FaChartLine
} from 'react-icons/fa';

const Analytics = ({ tasks }) => {
    const [timePeriod, setTimePeriod] = useState('week'); // week, month, all

    // Filter tasks based on time period
    const filteredTasks = useMemo(() => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        if (timePeriod === 'all') return tasks;

        if (timePeriod === 'week') {
            const dayOfWeek = now.getDay();
            const startOfWeek = new Date(now);
            const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startOfWeek.setDate(now.getDate() - daysSinceMonday);
            const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

            return tasks.filter(task => task.date >= startOfWeekStr && task.date <= endOfWeekStr);
        }

        if (timePeriod === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const startStr = startOfMonth.toISOString().split('T')[0];
            const endStr = endOfMonth.toISOString().split('T')[0];

            return tasks.filter(task => task.date >= startStr && task.date <= endStr);
        }

        return tasks;
    }, [tasks, timePeriod]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalTasks = filteredTasks.length;
        const completedTasks = filteredTasks.filter(t => t.completed).length;
        const upcomingTasks = filteredTasks.filter(t => !t.completed).length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

        let totalHours = 0;
        let completedHours = 0;
        const categoryHours = {};
        const dailyHours = {};

        filteredTasks.forEach(task => {
            const startTime = new Date(`${task.date}T${task.startTime}`);
            const endTime = new Date(`${task.date}T${task.endTime}`);
            const duration = (endTime - startTime) / (60 * 60 * 1000);

            totalHours += duration;
            if (task.completed) completedHours += duration;

            // Track by category
            task.tags.forEach(tag => {
                categoryHours[tag] = (categoryHours[tag] || 0) + duration;
            });

            // Track by day
            dailyHours[task.date] = (dailyHours[task.date] || 0) + duration;
        });

        // Find most productive day
        let mostProductiveDay = null;
        let maxHours = 0;
        Object.entries(dailyHours).forEach(([date, hours]) => {
            if (hours > maxHours) {
                maxHours = hours;
                mostProductiveDay = date;
            }
        });

        // Find top category
        let topCategory = 'None';
        let topCategoryHours = 0;
        Object.entries(categoryHours).forEach(([category, hours]) => {
            if (hours > topCategoryHours) {
                topCategoryHours = hours;
                topCategory = category;
            }
        });

        const avgDailyHours = Object.keys(dailyHours).length > 0
            ? (totalHours / Object.keys(dailyHours).length).toFixed(1)
            : 0;

        return {
            totalTasks,
            completedTasks,
            upcomingTasks,
            completionRate,
            totalHours: totalHours.toFixed(1),
            completedHours: completedHours.toFixed(1),
            mostProductiveDay,
            mostProductiveDayHours: maxHours.toFixed(1),
            topCategory,
            topCategoryHours: topCategoryHours.toFixed(1),
            avgDailyHours
        };
    }, [filteredTasks]);

    // Completion Chart Data
    const completionChartData = useMemo(() => {
        return {
            labels: ['Completed', 'Upcoming'],
            datasets: [{
                data: [stats.completedTasks, stats.upcomingTasks],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.7)',
                    'rgba(74, 107, 223, 0.7)'
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(74, 107, 223, 1)'
                ],
                borderWidth: 2
            }]
        };
    }, [stats]);

    // Task Duration Chart Data
    const taskChartData = useMemo(() => {
        const taskData = {};
        filteredTasks.forEach(task => {
            const startTime = new Date(`${task.date}T${task.startTime}`);
            const endTime = new Date(`${task.date}T${task.endTime}`);
            const duration = (endTime - startTime) / (60 * 60 * 1000);

            if (taskData[task.title]) {
                taskData[task.title] += duration;
            } else {
                taskData[task.title] = duration;
            }
        });

        // Sort by duration and take top 10
        const sorted = Object.entries(taskData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        return {
            labels: sorted.map(([title]) => title),
            datasets: [{
                label: 'Hours',
                data: sorted.map(([, hours]) => hours),
                backgroundColor: 'rgba(74, 107, 223, 0.7)',
                borderColor: 'rgba(74, 107, 223, 1)',
                borderWidth: 2,
                borderRadius: 6
            }]
        };
    }, [filteredTasks]);

    // Category Chart Data
    const categoryChartData = useMemo(() => {
        const categoryData = {};
        filteredTasks.forEach(task => {
            const startTime = new Date(`${task.date}T${task.startTime}`);
            const endTime = new Date(`${task.date}T${task.endTime}`);
            const duration = (endTime - startTime) / (60 * 60 * 1000);

            task.tags.forEach(tag => {
                if (categoryData[tag]) {
                    categoryData[tag] += duration;
                } else {
                    categoryData[tag] = duration;
                }
            });
        });

        const colors = [
            { bg: 'rgba(74, 107, 223, 0.7)', border: 'rgba(74, 107, 223, 1)' },
            { bg: 'rgba(40, 167, 69, 0.7)', border: 'rgba(40, 167, 69, 1)' },
            { bg: 'rgba(255, 193, 7, 0.7)', border: 'rgba(255, 193, 7, 1)' },
            { bg: 'rgba(220, 53, 69, 0.7)', border: 'rgba(220, 53, 69, 1)' },
            { bg: 'rgba(111, 66, 193, 0.7)', border: 'rgba(111, 66, 193, 1)' },
            { bg: 'rgba(23, 162, 184, 0.7)', border: 'rgba(23, 162, 184, 1)' },
            { bg: 'rgba(253, 126, 20, 0.7)', border: 'rgba(253, 126, 20, 1)' },
            { bg: 'rgba(232, 62, 140, 0.7)', border: 'rgba(232, 62, 140, 1)' }
        ];

        return {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: Object.keys(categoryData).map((_, i) => colors[i % colors.length].bg),
                borderColor: Object.keys(categoryData).map((_, i) => colors[i % colors.length].border),
                borderWidth: 2
            }]
        };
    }, [filteredTasks]);

    // Weekly Overview Chart Data
    const weeklyChartData = useMemo(() => {
        const now = new Date();
        const dayOfWeek = now.getDay();

        const startOfWeek = new Date(now);
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(now.getDate() - daysSinceMonday);

        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weekDates = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            weekDates.push(date.toISOString().split('T')[0]);
        }

        const scheduledData = weekDates.map(date => {
            let totalDuration = 0;
            tasks.forEach(task => {
                if (task.date === date) {
                    const startTime = new Date(`${task.date}T${task.startTime}`);
                    const endTime = new Date(`${task.date}T${task.endTime}`);
                    totalDuration += (endTime - startTime) / (60 * 60 * 1000);
                }
            });
            return totalDuration;
        });

        const completedData = weekDates.map(date => {
            let totalDuration = 0;
            tasks.forEach(task => {
                if (task.date === date && task.completed) {
                    const startTime = new Date(`${task.date}T${task.startTime}`);
                    const endTime = new Date(`${task.date}T${task.endTime}`);
                    totalDuration += (endTime - startTime) / (60 * 60 * 1000);
                }
            });
            return totalDuration;
        });

        return {
            labels: weekDays,
            datasets: [
                {
                    label: 'Scheduled Hours',
                    data: scheduledData,
                    backgroundColor: 'rgba(74, 107, 223, 0.3)',
                    borderColor: 'rgba(74, 107, 223, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Completed Hours',
                    data: completedData,
                    backgroundColor: 'rgba(40, 167, 69, 0.3)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }
            ]
        };
    }, [tasks]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    font: {
                        size: 12,
                        family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                    size: 14
                },
                bodyFont: {
                    size: 13
                },
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y.toFixed(1) + ' hrs';
                        } else if (context.parsed !== null) {
                            label += context.parsed.toFixed(1) + ' hrs';
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return value + ' hrs';
                    }
                }
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(`${dateString}T00:00:00`);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <section className="content-section active">
            {/* Time Period Filter */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <h2 className="card-title">Analytics Dashboard</h2>
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

            {/* Insights Cards */}
            <div className="analytics-insights">
                <div className="insight-card">
                    <div className="insight-icon">
                        <FaTrophy />
                    </div>
                    <div className="insight-content">
                        <div className="insight-title">Most Productive Day</div>
                        <div className="insight-value">
                            {stats.mostProductiveDay ? formatDate(stats.mostProductiveDay) : 'N/A'}
                        </div>
                        <div className="insight-subtitle">{stats.mostProductiveDayHours} hours scheduled</div>
                    </div>
                </div>

                <div className="insight-card">
                    <div className="insight-icon">
                        <FaTags />
                    </div>
                    <div className="insight-content">
                        <div className="insight-title">Top Category</div>
                        <div className="insight-value">{stats.topCategory}</div>
                        <div className="insight-subtitle">{stats.topCategoryHours} hours total</div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="analytics-grid">
                {/* Completion Status */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Task Completion</h2>
                        <FaCheckCircle />
                    </div>
                    <div className="chart-container">
                        <Doughnut
                            data={completionChartData}
                            options={{
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    legend: { position: 'bottom' }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Time by Category</h2>
                        <FaTags />
                    </div>
                    <div className="chart-container">
                        <Pie
                            data={categoryChartData}
                            options={{
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    legend: { position: 'bottom' }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Weekly Overview */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h2 className="card-title">Weekly Overview</h2>
                    <FaCalendarWeek />
                </div>
                <div className="chart-container" style={{ height: '350px' }}>
                    <Line data={weeklyChartData} options={chartOptions} />
                </div>
            </div>

            {/* Top Tasks */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h2 className="card-title">Top 10 Tasks by Duration</h2>
                    <FaChartBar />
                </div>
                <div className="chart-container" style={{ height: '400px' }}>
                    <Bar
                        data={taskChartData}
                        options={{
                            ...chartOptions,
                            indexAxis: 'y',
                            plugins: {
                                ...chartOptions.plugins,
                                legend: { display: false }
                            }
                        }}
                    />
                </div>
            </div>
        </section>
    );
};

export default Analytics;
