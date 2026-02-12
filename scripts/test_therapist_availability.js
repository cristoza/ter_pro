const { createTherapist, deleteTherapist } = require('../src/services/therapistService');
const { TherapistAvailability, sequelize } = require('../src/models');

(async () => {
    try {
        console.log('--- Testing Therapist Availability Creation ---');

        // Test Case 1: Custom Schedule
        const schedule1 = "Lunes, Miércoles, Viernes: 08:00 - 13:00";
        console.log(`\n1. Creating therapist with schedule: "${schedule1}"`);
        
        const therapist1 = await createTherapist({
            name: 'Test Therapist Custom',
            specialty: 'Físico',
            email: null,
            password: 'password123',
            phone: '1112223333',
            workingHours: schedule1
        });

        const avail1 = await TherapistAvailability.findAll({
            where: { therapistId: therapist1.id },
            order: [['dayOfWeek', 'ASC']]
        });

        console.log(`   > Created Therapist ID: ${therapist1.id}`);
        console.log(`   > Availability Records Found: ${avail1.length}`);
        
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        avail1.forEach(a => {
            console.log(`     - ${dayNames[a.dayOfWeek]}: ${a.startTime} to ${a.endTime}`);
        });


        // Test Case 2: Custom Schedule with different times
        const schedule2 = "Martes, Jueves: 14:00 - 18:00";
        console.log(`\n2. Creating therapist with schedule: "${schedule2}"`);
        
        const therapist2 = await createTherapist({
            name: 'Test Therapist Afternoon',
            specialty: 'Ocupacional',
            email: null,
            password: 'password123',
            phone: '4445556666',
            workingHours: schedule2
        });

        const avail2 = await TherapistAvailability.findAll({
            where: { therapistId: therapist2.id },
            order: [['dayOfWeek', 'ASC']]
        });

        console.log(`   > Created Therapist ID: ${therapist2.id}`);
        console.log(`   > Availability Records Found: ${avail2.length}`);
        avail2.forEach(a => {
            console.log(`     - ${dayNames[a.dayOfWeek]}: ${a.startTime} to ${a.endTime}`);
        });


        // Test Case 3: Default/Fallback (Empty workingHours)
        console.log(`\n3. Creating therapist with EMPTY schedule (should use defaults 9-17 Mon-Fri)`);
        
        const therapist3 = await createTherapist({
            name: 'Test Therapist Default',
            specialty: 'Físico',
            email: null,
            password: 'password123',
            workingHours: ''
        });

        const avail3 = await TherapistAvailability.findAll({
            where: { therapistId: therapist3.id },
            order: [['dayOfWeek', 'ASC']]
        });

        console.log(`   > Created Therapist ID: ${therapist3.id}`);
        console.log(`   > Availability Records Found: ${avail3.length}`);
        avail3.forEach(a => {
            console.log(`     - ${dayNames[a.dayOfWeek]}: ${a.startTime} to ${a.endTime}`);
        });

        // Cleanup
        console.log('\n--- Cleaning up test data ---');
        await deleteTherapist(therapist1.id);
        await deleteTherapist(therapist2.id);
        await deleteTherapist(therapist3.id);
        console.log('✓ Cleanup complete');

    } catch (error) {
        console.error('TEST FAILED:', error);
    } finally {
        await sequelize.close();
    }
})();
