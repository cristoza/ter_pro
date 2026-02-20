const { Appointment, Therapist, Patient } = require('../models');
const appointmentService = require('../services/appointmentService2');
const logger = require('../config/logger');

module.exports = {
    // Show secretary dashboard
    showDashboard(req, res) {
        res.render('secretary');
    },

    // Show patients search view
    showPatientsSearch(req, res) {
        res.render('secretary/patients');
    },

    // Get patient appointment batches
    async getPatientBatches(req, res) {
        try {
            const { publicId } = req.params;
            const batches = await appointmentService.getAppointmentBatches(publicId);
            res.json(batches);
        } catch (error) {
            logger.error('Error fetching patient batches:', error);
            res.status(500).json({ message: 'Error fetching batches' });
        }
    },

    // Get all appointments (for all therapists)
    async getAllAppointments(req, res) {
        try {
            const { page = 1, limit = 100, status, therapistId, date } = req.query;
            const where = {};
            if (status) where.status = status;
            if (therapistId) where.therapistId = parseInt(therapistId, 10);
            if (date) where.date = date;
            const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
            const { count, rows } = await Appointment.findAndCountAll({
                where,
                include: [
                    {
                        model: Therapist,
                        as: 'therapist',
                        attributes: ['id', 'name', 'email', 'phone']
                    },
                    {
                        model: Patient,
                        as: 'patient',
                        attributes: ['id', 'name', 'contact', 'cedula', 'publicId']
                    }
                ],
                order: [['date', 'ASC'], ['time', 'ASC']],
                limit: parseInt(limit, 10),
                offset,
            });
            res.json({
                data: rows,
                total: count,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages: Math.ceil(count / parseInt(limit, 10)),
            });
        } catch (error) {
            logger.error('Error fetching all appointments:', error);
            res.status(500).json({
                message: 'Error fetching appointments (Updated)',
                error: error.message,
                detail: error.parent ? error.parent.message : 'No DB detail'
            });
        }
    },

    // Get all therapists
    async getAllTherapists(req, res) {
        try {
            const therapists = await Therapist.findAll({
                attributes: ['id', 'name', 'email', 'phone'],
                order: [['name', 'ASC']]
            });
            
            res.json(therapists);
        } catch (error) {
            logger.error('Error fetching therapists:', error);
            res.status(500).json({ message: 'Error fetching therapists' });
        }
    },
};
