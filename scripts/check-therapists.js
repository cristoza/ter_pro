const { connectDB } = require('../src/config/db');
const { Therapist, TherapistAvailability } = require('../src/models');

async function checkTherapists() {
    await connectDB();
    const therapists = await Therapist.findAll({
        include: [{ model: TherapistAvailability, as: 'availability' }]
    });

    console.log('--- Therapist Check ---');
    therapists.forEach(t => {
        console.log(`ID: ${t.id}, Name: ${t.name}, Specialty: ${t.specialty}`);
        console.log(`   Availability Records: ${t.availability ? t.availability.length : 0}`);
        if (t.availability && t.availability.length > 0) {
            // Show a sample
            const av = t.availability[0];
            console.log(`   Sample: Day ${av.dayOfWeek}, ${av.startTime} - ${av.endTime}`);
        } else {
            console.log(`   [WARNING] No availability records found! This therapist cannot receive appointments.`);
        }
        console.log('-----------------------');
    });
    process.exit();
}

checkTherapists();