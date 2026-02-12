const { connectDB } = require('../src/config/db');
const appointmentService = require('../src/services/appointmentService2');

async function run() {
    await connectDB();
    try {
        const result = await appointmentService.previewAppointment({
            startDate: '2025-12-01',
            time: '09:00',
            occurrences: 5,
            therapyType: 'Combinada',
            durationMinutes: 45,
            patientName: 'Test Patient'
        });
        console.log('Preview Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Preview Error:', err);
    }
    process.exit();
}

run();