const { Appointment, Therapist } = require('../models');

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
                therapistId: therapistId
            });
        } catch (error) {
            console.error('Error loading therapist dashboard:', error);
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
                order: [['date', 'ASC'], ['time', 'ASC']]
            });
            
            res.json(appointments);
        } catch (error) {
            console.error('Error fetching therapist appointments:', error);
            res.status(500).json({ message: 'Error fetching appointments' });
        }
    },
};
