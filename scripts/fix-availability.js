const { connectDB } = require('../src/config/db');
const { Therapist, TherapistAvailability } = require('../src/models');

async function fixAvailability() {
    await connectDB();
    const therapists = await Therapist.findAll({
        include: [{ model: TherapistAvailability, as: 'availability' }]
    });

    for (const t of therapists) {
        if (!t.availability || t.availability.length === 0) {
            console.log(`Adding default availability for ${t.name}...`);
            const entries = [];
            // Add Mon(1) to Fri(5)
            for (let day = 1; day <= 5; day++) {
                entries.push({
                    therapistId: t.id,
                    dayOfWeek: day,
                    startTime: '09:00:00',
                    endTime: '17:00:00'
                });
            }
            await TherapistAvailability.bulkCreate(entries);
            console.log('Done.');
        }
    }
    process.exit();
}

fixAvailability();