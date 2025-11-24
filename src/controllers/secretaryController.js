const { Appointment, Therapist } = require('../models');

module.exports = {
    // Show secretary dashboard
    showDashboard(req, res) {
        res.render('secretary');
    },

    // Get all appointments (for all therapists)
    async getAllAppointments(req, res) {
        try {
            const appointments = await Appointment.findAll({
                include: [{ 
                    model: Therapist, 
                    as: 'therapist', 
                    attributes: ['id', 'name', 'email', 'phone'] 
                }],
                order: [['date', 'ASC'], ['time', 'ASC']]
            });
            
            res.json(appointments);
        } catch (error) {
            console.error('Error fetching all appointments:', error);
            res.status(500).json({ message: 'Error fetching appointments' });
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
