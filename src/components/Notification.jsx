import React, { useEffect } from 'react';
import { FaInfoCircle, FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

const NotificationItem = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(notification.id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [notification.id, onClose]);

    let icon = <FaInfoCircle />;
    let color = '#4a6bdf';

    if (notification.type === 'success') {
        icon = <FaCheckCircle />;
        color = '#28a745';
    } else if (notification.type === 'error') {
        icon = <FaExclamationCircle />;
        color = '#dc3545';
    }

    return (
        <div className="notification">
            <div className="notification-header">
                <div className="notification-title" style={{ color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {icon} {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                </div>
                <button className="notification-close" onClick={() => onClose(notification.id)}>
                    <FaTimes />
                </button>
            </div>
            <div className="notification-body">
                {notification.message}
            </div>
        </div>
    );
};

const NotificationContainer = ({ notifications, removeNotification }) => {
    return (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map(notification => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={removeNotification}
                />
            ))}
        </div>
    );
};

export default NotificationContainer;
