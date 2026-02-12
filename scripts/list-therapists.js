const { connectDB } = require('../src/config/db');
const Therapist = require('../src/models/therapist');

async function listTherapists() {
    await connectDB();
    const therapists = await Therapist.findAll();
    console.log('Therapists:');
    therapists.forEach(t => {
        console.log(`- ${t.name} (ID: ${t.id}): ${t.specialty}`);
    });
    process.exit(0);
}

listTherapists();