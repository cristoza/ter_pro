const { Appointment, Therapist, Patient } = require('../src/models');
const { sequelize } = require('../src/config/db');

(async () => {
    try {
        console.log('Testing Appointment Association Query (FIXED)...');
        const appoints = await Appointment.findAll({
            limit: 10,
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
        console.log('Query successful. Returned', appoints.length, 'records.');
        if(appoints.length > 0) {
             console.log('Sample Patient:', appoints[0].patient ? appoints[0].patient.toJSON() : 'None');
        }
    } catch (err) {
        console.error('Query Failed:', err);
    } finally {
        await sequelize.close();
    }
})();
