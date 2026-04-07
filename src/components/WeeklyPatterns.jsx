import React, { useState, useEffect, useMemo } from 'react';
import { FaPlusCircle, FaSave, FaTimes, FaTrash, FaEdit, FaCalendarWeek, FaCopy, FaSync } from 'react-icons/fa';
import { query } from '../lib/db';

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo', short: 'Dom' },
    { value: 1, label: 'Segunda-feira', short: 'Seg' },
    { value: 2, label: 'Terça-feira', short: 'Ter' },
    { value: 3, label: 'Quarta-feira', short: 'Qua' },
    { value: 4, label: 'Quinta-feira', short: 'Qui' },
    { value: 5, label: 'Sexta-feira', short: 'Sex' },
    { value: 6, label: 'Sábado', short: 'Sáb' }
];

const WeeklyPatterns = ({ onPatternsChange, onSyncTasks }) => {
    const [patterns, setPatterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPattern, setEditingPattern] = useState(null);
    const [selectedWeekday, setSelectedWeekday] = useState(1); // Default to Monday
    const [syncing, setSyncing] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        title: '',
        weekday: 1,
        startTime: '',
        endTime: '',
        tags: ''
    });

    const fetchPatterns = async () => {
        try {
            setLoading(true);
            const res = await query('SELECT * FROM weekly_patterns ORDER BY weekday, start_time');
            setPatterns(res.rows.map(p => ({
                id: p.id,
                title: p.title,
                weekday: p.weekday,
                startTime: p.start_time.slice(0, 5),
                endTime: p.end_time.slice(0, 5),
                tags: p.tags || []
            })));
        } catch (error) {
            console.error('Error fetching patterns:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatterns();
    }, []);

    useEffect(() => {
        if (editingPattern) {
            setFormData({
                id: editingPattern.id,
                title: editingPattern.title,
                weekday: editingPattern.weekday,
                startTime: editingPattern.startTime,
                endTime: editingPattern.endTime,
                tags: editingPattern.tags.join(', ')
            });
        } else {
            setFormData({
                id: '',
                title: '',
                weekday: selectedWeekday,
                startTime: '',
                endTime: '',
                tags: ''
            });
        }
    }, [editingPattern, selectedWeekday]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        let stateKey = '';
        if (id === 'patternTitle') stateKey = 'title';
        else if (id === 'patternWeekday') stateKey = 'weekday';
        else if (id === 'patternStartTime') stateKey = 'startTime';
        else if (id === 'patternEndTime') stateKey = 'endTime';
        else if (id === 'patternTags') stateKey = 'tags';

        setFormData(prev => ({ ...prev, [stateKey]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.title.trim()) {
            alert('Title is required');
            return;
        }
        if (!formData.startTime || !formData.endTime) {
            alert('Start and end time are required');
            return;
        }

        const startTime = new Date(`2000-01-01T${formData.startTime}`);
        const endTime = new Date(`2000-01-01T${formData.endTime}`);
        if (endTime <= startTime) {
            alert('End time must be after start time');
            return;
        }

        // Check for overlaps
        const weekdayPatterns = patterns.filter(p => 
            p.weekday === parseInt(formData.weekday) && p.id !== formData.id
        );
        
        for (const pattern of weekdayPatterns) {
            const pStart = new Date(`2000-01-01T${pattern.startTime}`);
            const pEnd = new Date(`2000-01-01T${pattern.endTime}`);
            
            if (startTime < pEnd && endTime > pStart) {
                alert(`Overlaps with "${pattern.title}"`);
                return;
            }
        }

        try {
            const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t !== '');

            if (formData.id) {
                // Update
                await query(
                    'UPDATE weekly_patterns SET title = $1, weekday = $2, start_time = $3, end_time = $4, tags = $5 WHERE id = $6',
                    [formData.title, parseInt(formData.weekday), formData.startTime, formData.endTime, tags, formData.id]
                );
            } else {
                // Create
                const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
                await query(
                    'INSERT INTO weekly_patterns (id, title, weekday, start_time, end_time, tags) VALUES ($1, $2, $3, $4, $5, $6)',
                    [id, formData.title, parseInt(formData.weekday), formData.startTime, formData.endTime, tags]
                );
            }

            await fetchPatterns();
            setEditingPattern(null);
            if (onPatternsChange) onPatternsChange();
        } catch (error) {
            console.error('Error saving pattern:', error);
            alert('Error saving pattern');
        }
    };

    const handleDelete = async (patternId) => {
        if (window.confirm('Are you sure you want to delete this pattern?')) {
            try {
                await query('DELETE FROM weekly_patterns WHERE id = $1', [patternId]);
                await fetchPatterns();
                if (onPatternsChange) onPatternsChange();
            } catch (error) {
                console.error('Error deleting pattern:', error);
                alert('Error deleting pattern');
            }
        }
    };

    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const patternsByWeekday = useMemo(() => {
        const groups = {};
        DAYS_OF_WEEK.forEach(day => {
            groups[day.value] = patterns
                .filter(p => p.weekday === day.value)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
        });
        return groups;
    }, [patterns]);

    const calculateDayHours = (dayPatterns) => {
        let totalMinutes = 0;
        dayPatterns.forEach(p => {
            const [sh, sm] = p.startTime.split(':').map(Number);
            const [eh, em] = p.endTime.split(':').map(Number);
            totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
        });
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    };

    if (loading) {
        return <div className="card"><div className="card-header"><h2>Loading patterns...</h2></div></div>;
    }

    return (
        <section className="content-section active">
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Weekly Patterns</h2>
                    <FaCalendarWeek />
                </div>
                <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '20px' }}>
                    Define tasks that repeat every week. These patterns will automatically generate tasks for the next 90 days.
                </p>

                {/* Pattern Form */}
                <div className={`card ${editingPattern ? 'edit-mode' : ''}`} style={{ marginBottom: '20px', border: '1px solid #e0e0e0' }}>
                    <div className="card-header" style={{ padding: '10px 15px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px' }}>{editingPattern ? 'Edit Pattern' : 'New Pattern'}</h3>
                    </div>
                    <form onSubmit={handleSubmit} style={{ padding: '15px' }}>
                        <input type="hidden" value={formData.id} />
                        
                        <div className="form-group">
                            <label className="form-label" htmlFor="patternTitle">Task Title</label>
                            <input
                                type="text"
                                className="form-control"
                                id="patternTitle"
                                placeholder="Enter task title"
                                required
                                value={formData.title}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="patternWeekday">Day of Week</label>
                            <select
                                className="form-control"
                                id="patternWeekday"
                                value={formData.weekday}
                                onChange={handleInputChange}
                            >
                                {DAYS_OF_WEEK.map(day => (
                                    <option key={day.value} value={day.value}>{day.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label" htmlFor="patternStartTime">Start Time</label>
                                <input
                                    type="time"
                                    className="form-control"
                                    id="patternStartTime"
                                    required
                                    value={formData.startTime}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label" htmlFor="patternEndTime">End Time</label>
                                <input
                                    type="time"
                                    className="form-control"
                                    id="patternEndTime"
                                    required
                                    value={formData.endTime}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="patternTags">Tags (comma separated)</label>
                            <input
                                type="text"
                                className="form-control"
                                id="patternTags"
                                placeholder="e.g., work, personal, urgent"
                                value={formData.tags}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="btn-group">
                            <button type="submit" className="btn btn-primary">
                                <FaSave /> {editingPattern ? 'Update Pattern' : 'Create Pattern'}
                            </button>
                            {editingPattern && (
                                <button type="button" className="btn btn-warning" onClick={() => setEditingPattern(null)}>
                                    <FaTimes /> Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Patterns by Weekday */}
                {DAYS_OF_WEEK.map(day => {
                    const dayPatterns = patternsByWeekday[day.value];
                    return (
                        <div key={day.value} className="card" style={{ marginTop: '15px' }}>
                            <div className="card-header" style={{ padding: '10px 15px' }}>
                                <h3 style={{ margin: 0, fontSize: '16px' }}>
                                    {day.label}
                                    {dayPatterns.length > 0 && (
                                        <span style={{ fontSize: '12px', color: '#6c757d', marginLeft: '10px' }}>
                                            ({calculateDayHours(dayPatterns)})
                                        </span>
                                    )}
                                </h3>
                            </div>
                            {dayPatterns.length === 0 ? (
                                <div style={{ padding: '15px', color: '#6c757d', textAlign: 'center' }}>
                                    No patterns defined
                                </div>
                            ) : (
                                <div className="task-list">
                                    {dayPatterns.map(pattern => (
                                        <div key={pattern.id} className="task-item" style={{ padding: '10px 15px' }}>
                                            <div className="task-info">
                                                <div className="task-title">{pattern.title}</div>
                                                <div className="task-time">
                                                    {formatTime(pattern.startTime)} - {formatTime(pattern.endTime)}
                                                </div>
                                                {pattern.tags.length > 0 && (
                                                    <div className="task-tags">
                                                        {pattern.tags.map((tag, idx) => (
                                                            <span key={idx} className="tag">{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="task-actions">
                                                <button 
                                                    className="btn btn-warning" 
                                                    onClick={() => setEditingPattern(pattern)}
                                                    title="Edit pattern"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button 
                                                    className="btn btn-danger" 
                                                    onClick={() => handleDelete(pattern.id)}
                                                    title="Delete pattern"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {/* Sync Button */}
                <div className="card" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <h3 style={{ margin: 0, fontSize: '16px' }}>Generate Tasks from Patterns</h3>
                    </div>
                    <div style={{ padding: '15px' }}>
                        <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '15px' }}>
                            Click the button below to generate tasks for the next 90 days based on your weekly patterns. 
                            Tasks that already exist won't be duplicated.
                        </p>
                        <button 
                            className="btn btn-primary" 
                            onClick={onSyncTasks}
                            disabled={syncing}
                            style={{ width: '100%' }}
                        >
                            <FaSync /> {syncing ? 'Syncing...' : 'Sync Tasks from Patterns'}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WeeklyPatterns;