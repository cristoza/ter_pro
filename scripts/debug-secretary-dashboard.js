const { Appointment, Therapist, Patient } = require('../src/models');
const { sequelize } = require('../src/config/db');

(async () => {
    try {
        console.log('--- Testing getAllTherapists ---');
        try {
            const therapists = await Therapist.findAll({
                attributes: ['id', 'name', 'email', 'phone'],
                order: [['name', 'ASC']]
            });
            console.log(`Success! Found ${therapists.length} therapists.`);
        } catch (e) {
            console.error('FAILED getAllTherapists:', e.message);
            // console.error(e);
        }

        console.log('\n--- Testing getAllAppointments ---');
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
                order: [['date', 'ASC'], ['time', 'ASC']] // removed limit to match controller
            });
            console.log(`Success! Found ${appointments.length} appointments.`);
        } catch (e) {
            console.error('FAILED getAllAppointments:', e.message, e.parent ? e.parent.message : '');
        }

    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        await sequelize.close();
    }
})();
