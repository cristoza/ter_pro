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

async function findAvailableForSlot(date, time, dur, specialty = 'Físico') {
  // Parse date properly to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number);
  const dow = new Date(year, month - 1, day).getDay();
  
  console.log(`Checking ${specialty} on ${date} (Dow: ${dow}) at ${time}`);

  const allTherapists = await Therapist.findAll({
    where: { specialty: specialty },
    include: [
      {
        model: TherapistAvailability,
        as: 'availability',
        where: {
          dayOfWeek: dow,
          startTime: { [Op.lte]: time },
          endTime: { [Op.gte]: addMinutesToTime(time, dur) }
        },
        required: true
      },
      {
        model: Appointment,
        as: 'appointments',
        where: { date },
        required: false
      }
    ]
  });

  console.log(`Found ${allTherapists.length} therapists for ${specialty}`);
  
  if (allTherapists.length > 0) {
      console.log(`First candidate: ${allTherapists[0].name}`);
  }

  const newStart = timeToMinutes(time);
  const newEnd = newStart + dur;

  for (const t of allTherapists) {
    console.log(`Checking candidate ${t.name} (ID: ${t.id})`);
    let conflict = false;
    if (t.appointments && t.appointments.length > 0) {
      console.log(`  Has ${t.appointments.length} appointments`);
      for (const e of t.appointments) {
        const eStart = timeToMinutes(e.time);
        const eDur = e.durationMinutes || 45;
        const eEnd = eStart + eDur;
        console.log(`    Appt: ${e.time} (${eStart}-${eEnd}) vs Request: ${newStart}-${newEnd}`);
        if (newStart < eEnd && eStart < newEnd) {
          console.log('    CONFLICT!');
          conflict = true;
          break;
        }
      }
    } else {
        console.log('  No appointments');
    }
    if (!conflict) {
        console.log('  AVAILABLE!');
        return t.id;
    }
  }
  return null;
}

async function test() {
    await connectDB();
    
    const today = new Date();
    const d = new Date(today);
    d.setDate(today.getDate() + 1); // Monday
    const dateStr = d.toISOString().slice(0, 10);
    
    console.log(`Testing for date: ${dateStr}`);
    
    const step = 15;
    const endLimit = '18:00';
    let cursor = timeToMinutes('08:00');
    const endMin = timeToMinutes(endLimit);
    const dur = 45;

    while (cursor <= endMin) {
        const tStr = `${String(Math.floor(cursor/60)).padStart(2,'0')}:${String(cursor%60).padStart(2,'0')}`;
        console.log(`\nChecking time: ${tStr}`);
        
        const t1 = await findAvailableForSlot(dateStr, tStr, dur, 'Físico');
        const t2 = await findAvailableForSlot(dateStr, tStr, dur, 'Ocupacional');
        
        if (t1 && t2) {
            console.log(`SUCCESS: Combined slot found at ${tStr}! Physical: ${t1}, Occupational: ${t2}`);
            process.exit(0);
        }
        cursor += step;
    }
    
    console.log('FAILURE: No combined slot found on this date.');
    process.exit(0);
}

test();