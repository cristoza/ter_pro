const appointmentService = require('../services/appointmentService2');
const notificationService = require('../services/notificationService');

module.exports = {
    async createAppointment(req, res) {
        try {
            console.log('[APPOINTMENT] CREATE - Request received:', { body: req.body });
            const appointmentData = req.body;
            const result = await appointmentService.createAppointment(appointmentData);
            
            // Notify clients about the new appointment (Extract the core appointment object)
            // The service returns { created: Appointment, ... }
            const newAppointment = result.created || result;

            console.log('[APPOINTMENT] CREATE - Appointment created:', { id: newAppointment.id, date: newAppointment.date });

            if (req.io) {
                console.log('[APPOINTMENT] CREATE - Emitting notifications via Socket.IO');
                // Send enhanced notification to all users
                notificationService.notifyAppointmentCreated(newAppointment, req.io);
                console.log('[APPOINTMENT] CREATE - Notification emitted successfully');
                // Also emit raw data for appointments update
                req.io.emit('appointment:created', newAppointment);
                console.log('[APPOINTMENT] CREATE - Raw event emitted');
            } else {
                console.log('[APPOINTMENT] CREATE - WARNING: req.io is undefined!');
            }

            res.status(201).json(result);
        } catch (error) {
            console.error('[APPOINTMENT] CREATE - Error:', error);
            if (error.code === 'PATIENT_NOT_FOUND') return res.status(404).json({ message: error.message });
            if (error.code === 'NO_SLOT') return res.status(409).json({ message: error.message });
            res.status(500).json({ message: 'Error creating appointment', error: error.message });
        }
    },

    async listAppointments(req, res) {
        try {
            const appointments = await appointmentService.getAppointments();
            res.status(200).json(appointments);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving appointments', error: error.message });
        }
    },

    async getAppointment(req, res) {
        try {
            const appt = await appointmentService.getAppointmentById(req.params.id);
            if (!appt) return res.status(404).json({ message: 'Appointment not found' });
            res.status(200).json(appt);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving appointment', error: error.message });
        }
    },

    async updateAppointment(req, res) {
        try {
            // Debug: log incoming update payload for troubleshooting secretary edits
            console.log('[APPOINTMENTS] Update request', { id: req.params.id, body: req.body });
            const updated = await appointmentService.updateAppointment(req.params.id, req.body);
            if (!updated) return res.status(404).json({ message: 'Appointment not found' });
            
            // Notify clients about the update
            if (req.io) {
                req.io.emit('appointment:updated', updated);
                // Send enhanced notification with change details
                notificationService.notifyAppointmentUpdated(updated, req.body, req.io);
            }

            res.status(200).json(updated);
        } catch (error) {
            console.error('[APPOINTMENTS] Update error:', error);
            res.status(500).json({ message: 'Error updating appointment', error: error.message });
        }
    },

    async deleteAppointment(req, res) {
        try {
            // Get appointment details before deletion for notification
            const appointmentToDelete = await appointmentService.getAppointmentById(req.params.id);
            
            const ok = await appointmentService.deleteAppointment(req.params.id);
            if (!ok) return res.status(404).json({ message: 'Appointment not found' });
            
            // Notify clients
            if (req.io) {
                req.io.emit('appointment:deleted', { id: req.params.id });
                // Send enhanced notification with appointment details
                if (appointmentToDelete) {
                    notificationService.notifyAppointmentCancelled(appointmentToDelete, '', req.io);
                }
            }

            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting appointment', error: error.message });
        }
    },

    async proposeAppointment(req, res) {
        try {
            const proposal = await appointmentService.proposeAppointment(req.body);
            if (!proposal) return res.status(404).json({ message: 'No available slot found' });
            res.status(200).json(proposal);
        } catch (error) {
            res.status(500).json({ message: 'Error proposing appointment', error: error.message });
        }
    },

    async createSeries(req, res) {
        try {
            const opts = req.body; // expect startDate, time, occurrences, durationMinutes, patientName, patientContact
            const created = await appointmentService.createSeriesAppointments(opts);
            
            // Notify about series creation
            if (req.io && created && created.length > 0) {
                notificationService.notifySeriesCreated(created.length, opts.patientName, req.io);
            }
            
            res.status(201).json(created);
        } catch (err) {
            if (err.code === 'PATIENT_NOT_FOUND') return res.status(404).json({ message: err.message });
            if (err.code === 'NO_CANDIDATE') return res.status(400).json({ message: err.message });
            if (err.code === 'OVERLAP') return res.status(409).json({ message: err.message });
            res.status(500).json({ message: 'Error creating appointment series', error: err.message });
        }
    },

    async previewAppointment(req, res) {
        try {
            const preview = await appointmentService.previewAppointment(req.body);
            res.status(200).json(preview);
        } catch (err) {
            if (err.code === 'NO_SLOT') return res.status(409).json({ message: err.message });
            if (err.code === 'NO_CANDIDATE') return res.status(400).json({ message: err.message });
            res.status(500).json({ message: 'Error generating preview', error: err.message });
        }
    }
};