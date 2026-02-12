const { createTherapist } = require('../src/services/therapistService');
const { sequelize } = require('../src/config/db');

(async () => {
    try {
        console.log('Attempting to create therapist with NO email...');
        const t1 = await createTherapist({
            name: 'Debug Therapist NoEmail',
            specialty: 'Físico',
            email: '',
            password: 'password123',
            phone: '1234567890',
            workingHours: 'Lunes: 08:00 - 12:00'
        });
        console.log('✓ Created therapist with no email:', t1.id);

        console.log('Attempting to create therapist WITH email...');
        const t2 = await createTherapist({
            name: 'Debug Therapist Email',
            specialty: 'Ocupacional',
            email: 'debug' + Date.now() + '@example.com',
            password: 'password123',
            phone: '0987654321',
            workingHours: 'Martes: 10:00 - 14:00'
        });
        console.log('✓ Created therapist with email:', t2.id);

    } catch (error) {
        console.error('ERROR creating therapist:', error);
    } finally {
        await sequelize.close();
    }
})();
