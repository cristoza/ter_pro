const { connectDB } = require('../src/config/db');
const { Therapist, TherapistAvailability, Appointment } = require('../src/models');
const { Op } = require('sequelize');

function timeToMinutes(timeStr) {
  const [h, m] = (timeStr || '').split(':').map(Number);
  return h * 60 + (m || 0);
}

function addMinutesToTime(timeStr, minutes) {
  const total = timeToMinutes(timeStr) + minutes;
  const h = Math.floor(total / 60).toString().padStart(2, '0');
  const m = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}:00`;
}

async function debugSeries() {
    await connectDB();

    // Simulate parameters
    const startDate = '2025-12-01'; // Tomorrow
    const time = '09:00';
    const duration = 45;
    const occurrences = 5;
    const therapyType = 'Combinada'; // Assuming this is what fails

    console.log(`Debugging Series: Start=${startDate}, Time=${time}, Occurrences=${occurrences}, Type=${therapyType}`);

    // Generate dates
    const [year, month, day] = startDate.split('-').map(Number);
    const start = new Date(year, month - 1, day);
    const dates = [];
    let currentDate = new Date(start);
    let count = 0;
    while (count < occurrences) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            const yyyy = currentDate.getFullYear();
            const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dd = String(currentDate.getDate()).padStart(2, '0');
            dates.push(`${yyyy}-${mm}-${dd}`);
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log('Dates:', dates);

    // Helper to check availability
    async function checkTherapist(t) {
        console.log(`Checking ${t.name} (${t.specialty})...`);
        for (const d of dates) {
            const [y, m, day] = d.split('-').map(Number);
            const dow = new Date(y, m - 1, day).getDay();
            
            // Check working hours
            const av = await TherapistAvailability.findOne({ 
                where: { 
                    therapistId: t.id, 
                    dayOfWeek: dow, 
                    startTime: { [Op.lte]: time }, 
                    endTime: { [Op.gte]: addMinutesToTime(time, duration) } 
                } 
            });
            
            if (!av) {
                console.log(`  [X] Not working on ${d} (Dow: ${dow}) at ${time}`);
                return false;
            }

            // Check existing appointments
            const existing = await Appointment.findAll({ where: { therapistId: t.id, date: d } });
            const newStart = timeToMinutes(time); 
            const newEnd = newStart + duration;
            
            for (const e of existing) { 
                const eStart = timeToMinutes(e.time); 
                const eDur = e.durationMinutes || 45; 
                const eEnd = eStart + eDur; 
                if (newStart < eEnd && eStart < newEnd) {
                    console.log(`  [X] Conflict on ${d} with appt at ${e.time}`);
                    return false; 
                }
            }
        }
        console.log(`  [OK] Available for all dates`);
        return true;
    }

    if (therapyType === 'Combinada') {
        const physicalTherapists = await Therapist.findAll({ where: { specialty: 'Físico' } });
        const occupationalTherapists = await Therapist.findAll({ where: { specialty: 'Ocupacional' } });

        console.log(`\n--- Checking Physical Therapists (${physicalTherapists.length}) ---`);
        let pFound = false;
        for (const t of physicalTherapists) {
            if (await checkTherapist(t)) pFound = true;
        }

        console.log(`\n--- Checking Occupational Therapists (${occupationalTherapists.length}) ---`);
        let oFound = false;
        for (const t of occupationalTherapists) {
            if (await checkTherapist(t)) oFound = true;
        }

        if (pFound && oFound) {
            console.log('\nSUCCESS: Found candidates for both types.');
        } else {
            console.log('\nFAILURE: Could not find candidates for both types.');
        }
    } else {
        const therapists = await Therapist.findAll({ where: { specialty: therapyType } });
        for (const t of therapists) {
            await checkTherapist(t);
        }
    }

    process.exit(0);
}

debugSeries();