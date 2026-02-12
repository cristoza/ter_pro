const { connectDB } = require('../src/config/db');
const { TherapistAvailability } = require('../src/models');

async function checkDB() {
    await connectDB();
    const av = await TherapistAvailability.findOne();
    console.log('Raw availability:', av.toJSON());
    console.log('StartTime type:', typeof av.startTime);
    console.log('StartTime value:', av.startTime);
    
    const { Op } = require('sequelize');
    const testTime = '09:00';
    const match = await TherapistAvailability.findOne({
        where: {
            id: av.id,
            startTime: { [Op.lte]: testTime }
        }
    });
    console.log(`Querying startTime <= "${testTime}":`, !!match);

    const testTime2 = '09:00:00';
    const match2 = await TherapistAvailability.findOne({
        where: {
            id: av.id,
            startTime: { [Op.lte]: testTime2 }
        }
    });
    console.log(`Querying startTime <= "${testTime2}":`, !!match2);

    process.exit();
}

checkDB();