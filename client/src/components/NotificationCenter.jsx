import { useState, useEffect } from 'react';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import './NotificationCenter.css';

const NotificationCenter = ({ role = 'secretary' }) => {
    const [notifications, setNotifications] = useState([]);
    const [showPanel, setShowPanel] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState('all'); // all, unread, success, warning, error

    // Map severity to color
    const severityColors = {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
    };

    useEffect(() => {
        const socket = socketService.connect();

        // Listen for all notification events
        const notificationEvents = [
            'notify:appointment:created',
            'notify:appointment:updated',
            'notify:appointment:cancelled',
            'notify:series:created',
            'notify:patient:checkin',
            'notify:error'
        ];

        const handleNotification = (notification) => {
            console.log('[NotificationCenter] Received notification:', notification);
            
            // Add to notifications list
            setNotifications(prev => {
                const updated = [notification, ...prev];
                // Keep only last 50 notifications
                return updated.slice(0, 50);
            });

            // Update unread count
            setUnreadCount(prev => prev + 1);

            // Auto-dismiss panel after 5 seconds if new notification is critical
            if (notification.severity === 'error' || notification.severity === 'success') {
                setTimeout(() => setShowPanel(false), 5000);
            }
        };

        notificationEvents.forEach(event => {
            console.log(`[NotificationCenter] Listening for: ${event}`);
            socket.on(event, handleNotification);
        });

        return () => {
            notificationEvents.forEach(event => {
                socket.off(event);
            });
        };
    }, []);

    const handleMarkAsRead = (index) => {
        setNotifications(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], read: true };
            return updated;
        });
        setUnreadCount(Math.max(0, unreadCount - 1));
    };

    const handleClearNotification = (index) => {
        setNotifications(prev => prev.filter((_, i) => i !== index));
    };

    const handleClearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    const filteredNotifications = notifications.filter(notif => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !notif.read;
        return notif.severity === filter;
    });

    const displayCount = unreadCount > 0 ? unreadCount : '';

    return (
        <div className="notification-center">
            {/* Notification Bell Icon */}
            <div className="notification-bell">
                <button
                    className="bell-button"
                    onClick={() => setShowPanel(!showPanel)}
                    title="Notifications"
                >
                    🔔
                    {displayCount && <span className="bell-badge">{displayCount}</span>}
                </button>
            </div>

            {/* Notification Panel */}
            {showPanel && (
                <div className="notification-panel">
                    {/* Panel Header */}
                    <div className="notification-header">
                        <h3>Centro de Notificaciones</h3>
                        <button
                            className="close-btn"
                            onClick={() => setShowPanel(false)}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="notification-filters">
                        {['all', 'unread', 'success', 'warning', 'error'].map(f => (
                            <button
                                key={f}
                                className={`filter-btn ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                {f === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
                            </button>
                        ))}
                    </div>

                    {/* Notifications List */}
                    <div className="notifications-list">
                        {filteredNotifications.length === 0 ? (
                            <div className="empty-state">
                                <p>No hay notificaciones</p>
                            </div>
                        ) : (
                            filteredNotifications.map((notif, index) => (
                                <div
                                    key={notif.id}
                                    className={`notification-item ${notif.severity} ${!notif.read ? 'unread' : ''}`}
                                    style={{
                                        borderLeft: `4px solid ${severityColors[notif.severity] || severityColors.info}`
                                    }}
                                >
                                    <div className="notification-content">
                                        <div className="notification-title">{notif.title}</div>
                                        <div className="notification-message">{notif.message}</div>
                                        <div className="notification-time">
                                            {new Date(notif.timestamp).toLocaleTimeString('es-ES')}
                                        </div>
                                    </div>

                                    <div className="notification-actions">
                                        {!notif.read && (
                                            <button
                                                className="action-btn mark-read"
                                                onClick={() => handleMarkAsRead(
                                                    notifications.findIndex(n => n.id === notif.id)
                                                )}
                                                title="Mark as read"
                                            >
                                                ✓
                                            </button>
                                        )}
                                        <button
                                            className="action-btn delete"
                                            onClick={() => handleClearNotification(
                                                notifications.findIndex(n => n.id === notif.id)
                                            )}
                                            title="Delete"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Panel Footer */}
                    {notifications.length > 0 && (
                        <div className="notification-footer">
                            <button
                                className="clear-all-btn"
                                onClick={handleClearAll}
                            >
                                Limpiar Todo
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Toast Notifications (for real-time feedback) */}
            <ToastNotifications />
        </div>
    );
};

/**
 * Separate component for toast notifications
 * Shows a subtle toast when new notifications arrive
 */
const ToastNotifications = () => {
    useEffect(() => {
        const socket = socketService.connect();

        const toastConfig = {
            duration: 4000,
            position: 'bottom-right',
        };

        socket.on('notify:appointment:created', (notif) => {
            toast.success(notif.title + ': ' + notif.message, toastConfig);
        });

        socket.on('notify:series:created', (notif) => {
            toast.success(notif.message, {
                ...toastConfig,
                icon: '📊'
            });
        });

        socket.on('notify:patient:checkin', (notif) => {
            toast.success(notif.message, {
                ...toastConfig,
                icon: '✅'
            });
        });

        socket.on('notify:appointment:updated', (notif) => {
            toast('Cita Actualizada', {
                ...toastConfig,
                icon: '🔄'
            });
        });

        socket.on('notify:appointment:cancelled', (notif) => {
            toast.error(notif.message, {
                ...toastConfig,
                icon: '⚠️'
            });
        });

        socket.on('notify:error', (notif) => {
            toast.error(notif.message, toastConfig);
        });

        return () => {
            socket.off('notify:appointment:created');
            socket.off('notify:series:created');
            socket.off('notify:patient:checkin');
            socket.off('notify:appointment:updated');
            socket.off('notify:appointment:cancelled');
            socket.off('notify:error');
        };
    }, []);

    return null;
};

export default NotificationCenter;
