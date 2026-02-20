const { Appointment, Therapist, Patient } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const logger = require('../config/logger');

module.exports = {
    async getStats(req, res) {
        try {
            const { startDate, endDate, therapistId } = req.query;
            
            const whereClause = {};
            if (startDate && endDate) {
                whereClause.date = {
                    [Op.between]: [startDate, endDate]
                };
            } else if (startDate) {
                whereClause.date = { [Op.gte]: startDate };
            }

            if (therapistId) {
                whereClause.therapistId = therapistId;
            }

            // General Counts
            const totalPatients = await Patient.count();
            const totalTherapists = await Therapist.count();
            const totalAppointments = await Appointment.count({ where: whereClause });

            // Appointments per Therapist
            const appointmentsByTherapist = await Appointment.findAll({
                where: whereClause,
                attributes: [
                    'therapistId',
                    [sequelize.fn('COUNT', sequelize.col('Appointment.id')), 'count']
                ],
                include: [{
                    model: Therapist,
                    as: 'therapist',
                    attributes: ['name']
                }],
                group: ['therapistId', 'therapist.id', 'therapist.name'],
                order: [[sequelize.literal('count'), 'DESC']]
            });

            // Appointments by Status (for Pie Chart)
            const appointmentsByStatus = await Appointment.findAll({
                where: whereClause,
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['status']
            });

            // Appointments Over Time (for Line/Bar Chart) - Last 30 days if no date range
            const timeWhere = { ...whereClause };
            if(!startDate && !endDate) {
                 const thirtyDaysAgo = new Date();
                 thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                 timeWhere.date = { [Op.gte]: thirtyDaysAgo };
            }

            const appointmentsOverTime = await Appointment.findAll({
                where: timeWhere,
                attributes: [
                    'date',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['date'],
                order: [['date', 'ASC']]
            });

            res.json({
                totalPatients,
                totalTherapists,
                totalAppointments,
                appointmentsByTherapist,
                appointmentsByStatus,
                appointmentsOverTime
            });
        } catch (error) {
            logger.error('Analytics Error:', error);
            res.status(500).json({ message: 'Error fetching analytics' });
        }
    }
};
