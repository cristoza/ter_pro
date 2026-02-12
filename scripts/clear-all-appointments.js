const { connectDB } = require('../src/config/db');
const { Appointment } = require('../src/models');

async function clearAllAppointments() {
    try {
        await connectDB();
        console.log('Clearing ALL appointments from the database...');
        
        // Using truncate to remove all rows and reset auto-increment if supported/needed, 
        // or just destroy with empty where clause.
        const count = await Appointment.destroy({
            where: {},
            truncate: false // Set to true if you want to reset IDs, but false is safer for foreign keys usually
        });
        
        console.log(`Successfully deleted ${count} appointments.`);
    } catch (error) {
        console.error('Error clearing appointments:', error);
    }
    process.exit();
}

clearAllAppointments();