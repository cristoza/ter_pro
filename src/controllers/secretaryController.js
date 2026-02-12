const { Appointment, Therapist, Patient } = require('../models');
const appointmentService = require('../services/appointmentService2');

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
            console.error('Error fetching patient batches:', error);
            res.status(500).json({ message: 'Error fetching batches' });
        }
    },

    // Get all appointments (for all therapists)
    async getAllAppointments(req, res) {
        try {
            const appointments = await Appointment.findAll({
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
                order: [['date', 'ASC'], ['time', 'ASC']]
            });
            
            res.json(appointments);
        } catch (error) {
            console.error('Error fetching all appointments:', error);
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
            console.error('Error fetching therapists:', error);
            res.status(500).json({ message: 'Error fetching therapists' });
        }
    },
};
