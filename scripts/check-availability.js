const { connectDB } = require('../src/config/db');
const Therapist = require('../src/models/therapist');
const TherapistAvailability = require('../src/models/therapistAvailability');

async function checkAvailability() {
    await connectDB();
    
    const t = await Therapist.findOne({ where: { name: 'Ana Morales' } });
    if (!t) {
        console.log('María Ruiz not found');
        process.exit(1);
    }
    
    console.log(`Checking availability for ${t.name} (${t.specialty})`);
    const avails = await TherapistAvailability.findAll({ where: { therapistId: t.id } });
    
    if (avails.length === 0) {
        console.log('No availability records found!');
    } else {
        avails.forEach(a => {
            console.log(`- Day ${a.dayOfWeek}: ${a.startTime} - ${a.endTime}`);
        });
    }
    
    process.exit(0);
}

checkAvailability();