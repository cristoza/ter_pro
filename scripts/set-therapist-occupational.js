const { connectDB } = require('../src/config/db');
const Therapist = require('../src/models/therapist');

async function updateTherapist() {
    await connectDB();
    
    // Find María Ruiz or just the last therapist
    const therapist = await Therapist.findOne({ where: { name: 'María Ruiz' } });
    
    if (therapist) {
        therapist.specialty = 'Ocupacional';
        await therapist.save();
        console.log(`Updated ${therapist.name} to Ocupacional`);
    } else {
        console.log('Therapist María Ruiz not found. Updating the last therapist found.');
        const last = await Therapist.findOne({ order: [['id', 'DESC']] });
        if (last) {
            last.specialty = 'Ocupacional';
            await last.save();
            console.log(`Updated ${last.name} to Ocupacional`);
        } else {
            console.log('No therapists found.');
        }
    }
    
    process.exit(0);
}

updateTherapist();