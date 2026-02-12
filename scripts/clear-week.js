const { connectDB } = require('../src/config/db');
const { Appointment } = require('../src/models');
const { Op } = require('sequelize');

async function clearWeek() {
    await connectDB();
    
    const startDate = '2025-12-01';
    const endDate = '2025-12-07';
    
    console.log(`Clearing appointments from ${startDate} to ${endDate}...`);
    
    const count = await Appointment.destroy({
        where: {
            date: {
                [Op.between]: [startDate, endDate]
            }
        }
    });
    
    console.log(`Deleted ${count} appointments.`);
    process.exit(0);
}

clearWeek();