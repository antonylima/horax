import React, { useMemo } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { FaChartBar, FaTags, FaCalendarWeek } from 'react-icons/fa';

const Analytics = ({ tasks }) => {
    // Task Duration Chart Data
    const taskChartData = useMemo(() => {
        const taskData = {};
        tasks.forEach(task => {
            if (!task.completed) {
                const startTime = new Date(`${task.date}T${task.startTime}`);
                const endTime = new Date(`${task.date}T${task.endTime}`);
                const duration = (endTime - startTime) / (60 * 60 * 1000); // in hours

                if (taskData[task.title]) {
                    taskData[task.title] += duration;
                } else {
                    taskData[task.title] = duration;
                }
            }
        });

        return {
            labels: Object.keys(taskData),
            datasets: [{
                label: 'Hours',
                data: Object.values(taskData),
                backgroundColor: 'rgba(74, 107, 223, 0.6)',
                borderColor: 'rgba(74, 107, 223, 1)',
                borderWidth: 1
            }]
        };
    }, [tasks]);

    // Category Chart Data
    const categoryChartData = useMemo(() => {
        const categoryData = {};
        tasks.forEach(task => {
            if (!task.completed) {
                const startTime = new Date(`${task.date}T${task.startTime}`);
                const endTime = new Date(`${task.date}T${task.endTime}`);
                const duration = (endTime - startTime) / (60 * 60 * 1000); // in hours

                task.tags.forEach(tag => {
                    if (categoryData[tag]) {
                        categoryData[tag] += duration;
                    } else {
                        categoryData[tag] = duration;
                    }
                });
            }
        });

        return {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: [
                    'rgba(74, 107, 223, 0.6)',
                    'rgba(40, 167, 69, 0.6)',
                    'rgba(255, 193, 7, 0.6)',
                    'rgba(220, 53, 69, 0.6)',
                    'rgba(111, 66, 193, 0.6)',
                    'rgba(23, 162, 184, 0.6)'
                ],
                borderColor: [
                    'rgba(74, 107, 223, 1)',
                    'rgba(40, 167, 69, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(220, 53, 69, 1)',
                    'rgba(111, 66, 193, 1)',
                    'rgba(23, 162, 184, 1)'
                ],
                borderWidth: 1
            }]
        };
    }, [tasks]);

    // Weekly Overview Chart Data
    const weeklyChartData = useMemo(() => {
        const now = new Date();
        const dayOfWeek = now.getDay();

        const startOfWeek = new Date(now);
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(now.getDate() - daysSinceMonday);

        const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const weekDates = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            weekDates.push(date.toISOString().split('T')[0]);
        }

        const dailyData = weekDates.map(date => {
            let totalDuration = 0;
            tasks.forEach(task => {
                if (task.date === date && !task.completed) {
                    const startTime = new Date(`${task.date}T${task.startTime}`);
                    const endTime = new Date(`${task.date}T${task.endTime}`);
                    totalDuration += (endTime - startTime) / (60 * 60 * 1000); // in hours
                }
            });
            return totalDuration;
        });

        return {
            labels: weekDays,
            datasets: [{
                label: 'Hours Scheduled',
                data: dailyData,
                backgroundColor: 'rgba(74, 107, 223, 0.2)',
                borderColor: 'rgba(74, 107, 223, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        };
    }, [tasks]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
    };

    return (
        <section className="content-section active">
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Time Usage by Task</h2>
                    <FaChartBar />
                </div>
                <div className="chart-container">
                    <Bar data={taskChartData} options={options} />
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h2 className="card-title">Time Usage by Category</h2>
                    <FaTags />
                </div>
                <div className="chart-container">
                    <Pie data={categoryChartData} options={{ ...options, plugins: { legend: { position: 'right' } } }} />
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h2 className="card-title">Weekly Overview</h2>
                    <FaCalendarWeek />
                </div>
                <div className="chart-container">
                    <Line data={weeklyChartData} options={options} />
                </div>
            </div>
        </section>
    );
};

export default Analytics;
