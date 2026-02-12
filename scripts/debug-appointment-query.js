const { Appointment, Therapist, Patient } = require('../src/models');
const { sequelize } = require('../src/config/db');

(async () => {
    try {
        console.log('Testing Appointment Association Query...');
        const appoints = await Appointment.findAll({
            limit: 1,
            include: [
                { 
                    model: Therapist, 
                    as: 'therapist', 
                    attributes: ['id', 'name', 'email', 'phone'] 
                },
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'name', 'email', 'phone', 'cedula', 'publicId']
                }
            ]
        });
        console.log('Query successful. Returned', appoints.length, 'records.');
    } catch (err) {
        console.error('Query Failed:', err);
    } finally {
        await sequelize.close();
    }
})();
