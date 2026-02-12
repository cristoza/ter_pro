const { connectDB } = require('../src/config/db');
const { Appointment } = require('../src/models');
const { Op } = require('sequelize');

async function clearAppointments() {
    await connectDB();
    
    const today = new Date();
    const d = new Date(today);
    d.setDate(today.getDate() + 1); // Monday
    const dateStr = d.toISOString().slice(0, 10);
    
    console.log(`Clearing appointments for ${dateStr}...`);
    
    const count = await Appointment.destroy({
        where: {
            date: dateStr
        }
    });
    
    console.log(`Deleted ${count} appointments.`);
    process.exit(0);
}

clearAppointments();