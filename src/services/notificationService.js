/**
 * Notification Service
 * Manages real-time notifications for the secretary dashboard
 * Emits events through Socket.IO to all connected clients
 */

class NotificationService {
    constructor() {
        this.notifications = [];
        this.notificationId = 0;
    }

    /**
     * Create a notification payload
     * @param {string} type - Type of notification (appointment:created, appointment:updated, etc)
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {object} data - Additional data related to the notification
     * @param {string} severity - 'success', 'warning', 'error', 'info'
     * @returns {object} Notification object
     */
    createNotification(type, title, message, data = {}, severity = 'info') {
        const notification = {
            id: ++this.notificationId,
            type,
            title,
            message,
            severity,
            data,
            timestamp: new Date().toISOString(),
            read: false,
            action: null
        };

        // Store in memory (consider database for persistence)
        this.notifications.push(notification);

        // Keep only last 100 notifications
        if (this.notifications.length > 100) {
            this.notifications.shift();
        }

        return notification;
    }

    /**
     * Notify appointment creation
     * @param {object} appointment - The appointment object
     * @param {object} io - Socket.IO instance
     */
    notifyAppointmentCreated(appointment, io) {
        const patientName = appointment.patient?.name || appointment.patientName || 'Paciente';
        const therapistName = appointment.therapist?.name || appointment.therapistName || 'Terapeuta';
        const appointmentDate = new Date(appointment.date).toLocaleDateString('es-ES');

        const notification = this.createNotification(
            'appointment:created',
            '📅 Nueva Cita Registrada',
            `${patientName} con ${therapistName} el ${appointmentDate}`,
            {
                appointmentId: appointment.id,
                patientName,
                therapistName,
                date: appointment.date,
                time: appointment.time
            },
            'success'
        );

        console.log('[NOTIFICATION] Created notification:', { type: notification.type, title: notification.title });

        // Emit to all secretaries in the room
        if (io) {
            console.log('[NOTIFICATION] Emitting to secretaries room and all clients');
            io.to('secretaries').emit('notify:appointment:created', notification);
            console.log('[NOTIFICATION] Emitted to secretaries room');
            io.emit('notify:appointment:created', notification);
            console.log('[NOTIFICATION] Emitted to all clients');
        } else {
            console.log('[NOTIFICATION] ERROR: io is undefined!');
        }
    }

    /**
     * Notify appointment update
     * @param {object} appointment - The updated appointment object
     * @param {object} changes - The fields that were changed
     * @param {object} io - Socket.IO instance
     */
    notifyAppointmentUpdated(appointment, changes = {}, io) {
        const patientName = appointment.patient?.name || appointment.patientName || 'Paciente';
        let changeDescription = '';

        if (changes.status) {
            changeDescription = `Estado actualizado a "${changes.status}"`;
        } else if (changes.date || changes.time) {
            changeDescription = 'Fecha/Hora modificada';
        } else {
            changeDescription = 'Cita actualizada';
        }

        const notification = this.createNotification(
            'appointment:updated',
            '🔄 Cita Actualizada',
            `${patientName}: ${changeDescription}`,
            {
                appointmentId: appointment.id,
                patientName,
                changes,
                date: appointment.date,
                time: appointment.time,
                status: appointment.status
            },
            'info'
        );

        if (io) {
            io.emit('notify:appointment:updated', notification);
            io.to('secretaries').emit('notify:appointment:updated', notification);
        }
    }

    /**
     * Notify appointment cancellation
     * @param {object} appointment - The cancelled appointment object
     * @param {string} reason - Reason for cancellation
     * @param {object} io - Socket.IO instance
     */
    notifyAppointmentCancelled(appointment, reason = '', io) {
        const patientName = appointment.patient?.name || appointment.patientName || 'Paciente';

        const notification = this.createNotification(
            'appointment:cancelled',
            '🗑️ Cita Cancelada',
            `${patientName}${reason ? ': ' + reason : ''}`,
            {
                appointmentId: appointment.id,
                patientName,
                reason,
                date: appointment.date
            },
            'warning'
        );

        if (io) {
            io.emit('notify:appointment:cancelled', notification);
            io.to('secretaries').emit('notify:appointment:cancelled', notification);
        }
    }

    /**
     * Notify appointment series creation
     * @param {number} count - Number of appointments created
     * @param {string} patientName - Patient name
     * @param {object} io - Socket.IO instance
     */
    notifySeriesCreated(count, patientName, io) {
        const notification = this.createNotification(
            'appointment:series:created',
            '📊 Series de Citas Creada',
            `${count} citas registradas para ${patientName}`,
            {
                count,
                patientName
            },
            'success'
        );

        if (io) {
            io.emit('notify:series:created', notification);
            io.to('secretaries').emit('notify:series:created', notification);
        }
    }

    /**
     * Notify patient check-in
     * @param {string} patientName - Patient name
     * @param {string} appointmentTime - Appointment time
     * @param {object} io - Socket.IO instance
     */
    notifyPatientCheckIn(patientName, appointmentTime, io) {
        const notification = this.createNotification(
            'patient:checkin',
            '✅ Paciente Registrado',
            `${patientName} ha llegado - Cita a las ${appointmentTime}`,
            {
                patientName,
                appointmentTime,
                checkinTime: new Date().toISOString()
            },
            'success'
        );

        if (io) {
            io.emit('notify:patient:checkin', notification);
            io.to('secretaries').emit('notify:patient:checkin', notification);
        }
    }

    /**
     * Notify system error or warning
     * @param {string} title - Error title
     * @param {string} message - Error message
     * @param {object} data - Additional error data
     * @param {object} io - Socket.IO instance
     */
    notifyError(title, message, data = {}, io) {
        const notification = this.createNotification(
            'system:error',
            `⚠️ ${title}`,
            message,
            data,
            'error'
        );

        if (io) {
            io.emit('notify:error', notification);
            io.to('secretaries').emit('notify:error', notification);
        }

        return notification;
    }

    /**
     * Get notification history
     * @param {number} limit - Number of recent notifications to return
     * @param {string} type - Filter by notification type (optional)
     * @returns {array} Array of notifications
     */
    getHistory(limit = 50, type = null) {
        let results = [...this.notifications].reverse();

        if (type) {
            results = results.filter(n => n.type === type);
        }

        return results.slice(0, limit);
    }

    /**
     * Clear notification history
     */
    clearHistory() {
        this.notifications = [];
    }

    /**
     * Get unread notification count
     * @returns {number} Count of unread notifications
     */
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }
}

// Export singleton instance
module.exports = new NotificationService();
