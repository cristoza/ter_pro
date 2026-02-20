const { Appointment, Therapist, Patient, Machine } = require('../models');
const logger = require('../config/logger');

module.exports = {
    // Show therapist dashboard
    async showDashboard(req, res) {
        try {
            const therapistId = req.session.therapistId;
            const therapist = await Therapist.findByPk(therapistId);
            
            if (!therapist) {
                return res.status(404).send('Therapist not found');
            }
            
            res.render('therapist', { 
                therapistName: therapist.name,
                therapistId: therapistId,
                specialty: therapist.specialty,
                therapist: therapist
            });
        } catch (error) {
            logger.error('Error loading therapist dashboard:', error);
            res.status(500).send('Error loading dashboard');
        }
    },

    // Get therapist's appointments
    async getAppointments(req, res) {
        try {
            const therapistId = req.session.therapistId;
            
            if (!therapistId) {
                return res.status(403).json({ message: 'Not authorized' });
            }
            
            const appointments = await Appointment.findAll({
                where: { therapistId },
                include: [
                    { model: Patient, as: 'patient' },
                    { model: Machine, as: 'machine' }
                ],
                order: [['date', 'ASC'], ['time', 'ASC']]
            });
            
            res.json(appointments);
        } catch (error) {
            logger.error('Error fetching therapist appointments:', error);
            res.status(500).json({ message: 'Error fetching appointments' });
        }
    },
    // Update appointment status/notes
    async updateAppointment(req, res) {
        try {
            const therapistId = req.session.therapistId;
            const appointmentId = req.params.id;
            const { status, notes } = req.body;

            if (!therapistId) {
                return res.status(403).json({ message: 'Not authorized' });
            }

            const appointment = await Appointment.findByPk(appointmentId);
            if (!appointment) {
                return res.status(404).json({ message: 'Appointment not found' });
            }

            // Verify this appointment belongs to the therapist
            if (appointment.therapistId !== parseInt(therapistId)) {
                return res.status(403).json({ message: 'You can only update your own appointments' });
            }

            // Update allowed fields
            if (status) appointment.status = status;
            if (notes !== undefined) appointment.notes = notes;
            
            await appointment.save();
            res.json(appointment);
        } catch (error) {
            logger.error('Error updating appointment:', error);
            res.status(500).json({ message: 'Error updating appointment' });
        }
    }
};
