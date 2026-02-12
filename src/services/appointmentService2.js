const Appointment = require('../models/appointment');
const { Therapist, Patient, Machine } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

function logDebug(msg) {
    console.log(msg);
    try {
        const logFile = path.join(__dirname, '../../debug-series.log');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
    } catch (e) {
        // ignore file write errors
    }
}

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

async function findAvailableMachine(date, time, dur, type = null, specificMachineId = null) {
  const whereClause = { status: 'active' };
  if (specificMachineId) {
    whereClause.id = specificMachineId;
  } else if (type) {
    whereClause.type = type;
  }

  const allMachines = await Machine.findAll({
    where: whereClause,
    include: [{
      model: Appointment,
      as: 'appointments',
      where: { date },
      required: false
    }]
  });

  const newStart = timeToMinutes(time);
  const newEnd = newStart + dur;

  for (const m of allMachines) {
    let conflict = false;
    if (m.appointments && m.appointments.length > 0) {
      for (const e of m.appointments) {
        const eStart = timeToMinutes(e.time);
        const eEnd = eStart + (e.durationMinutes || 30);
        if (newStart < eEnd && eStart < newEnd) {
          conflict = true;
          break;
        }
      }
    }
    if (!conflict) return m.id;
  }
  return null;
}

// Helper to find slots with machine type support
async function findAvailableForSlot(date, time, dur, specialty = 'Físico', preferredTherapistId = null, machineType = null, specificMachineId = null) {
  const TherapistAvailability = require('../models/therapistAvailability');
  
  // 1. Check Machine Availability
  const machineId = await findAvailableMachine(date, time, dur, machineType, specificMachineId);
  if (!machineId) return null;

  const [year, month, day] = date.split('-').map(Number);
  const dow = new Date(year, month - 1, day).getDay();
  const newStart = timeToMinutes(time);
  const newEnd = newStart + dur;

  // 2. Fetch Candidates
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

  // 3. Score Candidates (Heuristic Optimization)
  // Higher score = Better match
  const candidates = [];
  
  for (const t of allTherapists) {
    let conflict = false;
    let hasAdjacent = false;
    let load = 0;

    if (t.appointments && t.appointments.length > 0) {
      load = t.appointments.length;
      for (const e of t.appointments) {
        const eStart = timeToMinutes(e.time);
        const eDur = e.durationMinutes || 30;
        const eEnd = eStart + eDur;
        
        // Conflict Check
        if (newStart < eEnd && eStart < newEnd) {
          conflict = true;
          break;
        }

        // Adjacency Check (Optimization for Therapist)
        // Check if this slot (newStart...newEnd) is right before (eStart) or right after (eEnd)
        if (newEnd === eStart || newStart === eEnd) {
            hasAdjacent = true;
        }
      }
    }
    
    if (!conflict) {
        let score = 0;
        // Priority 1: Patient Preference (Continuity of Care)
        if (preferredTherapistId && t.id === preferredTherapistId) score += 100;
        
        // Priority 2: Cluster Appointments (Reduce Gaps)
        if (hasAdjacent) score += 50;

        // Priority 3: Load Balancing (Distribute work if no other prefs)
        // Subtract score based on load to prefer emptier schedules if no adjacency
        // But we probably prefer adjacency over load balancing for efficiency
        score -= load; 

        candidates.push({ therapist: t, score });
    }
  }

  // 4. Sort by Score DESC
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
      return candidates[0].therapist.id;
  }
  return null;
}

async function findNextAvailableSlotOnDate(date, startTime, dur, specialty = 'Físico', preferredTherapistId = null, machineType = null, limitTime = '18:00', specificMachineId = null) {
  const step = 30;
  const endLimit = limitTime;
  let cursor = timeToMinutes(startTime);
  const endMin = timeToMinutes(endLimit);
  while (cursor <= endMin) {
    const tStr = `${String(Math.floor(cursor/60)).padStart(2,'0')}:${String(cursor%60).padStart(2,'0')}`;
    const tid = await findAvailableForSlot(date, tStr, dur, specialty, preferredTherapistId, machineType, specificMachineId);
    if (tid) return { time: tStr, therapistId: tid };
    cursor += step;
  }
  return null;
}

// Helper for combined therapy (needs 2 therapists)
async function findAvailableForCombined(date, time, dur) {
  const t1 = await findAvailableForSlot(date, time, dur, 'Físico');
  if (!t1) return null;
  
  // We need to find an Occupational therapist who is NOT the same person (though specialties differ, so IDs should differ)
  // But we need to make sure we don't pick the same person if someone has dual specialties (not supported by schema yet but good practice)
  
  // Actually, findAvailableForSlot returns the first match. 
  // For combined, we need to ensure we can find BOTH.
  // The current findAvailableForSlot returns an ID.
  
  const t2 = await findAvailableForSlot(date, time, dur, 'Ocupacional');
  if (!t2) return null;
  
  return { physicalId: t1, occupationalId: t2 };
}

async function findNextAvailableSlotOnDateCombined(date, startTime, dur, limitTime = '18:00') {
  const step = 30;
  const endLimit = limitTime;
  let cursor = timeToMinutes(startTime);
  const endMin = timeToMinutes(endLimit);
  while (cursor <= endMin) {
    const tStr = `${String(Math.floor(cursor/60)).padStart(2,'0')}:${String(cursor%60).padStart(2,'0')}`;
    const slots = await findAvailableForCombined(date, tStr, dur);
    if (slots) return { time: tStr, ...slots };
    cursor += step;
  }
  return null;
}

const proposeAppointment = async (data) => {
  const duration = Number(data.durationMinutes) || 30;
  const therapyType = data.therapyType || 'Físico'; // Físico, Ocupacional, Combinada
  const machineType = data.machineType || 'General'; // Default to General cubicle
  const specificMachineId = data.machineId || null; // Capture specific machine preference
  
  // Scoring / Preferences Setup
  let preferredTherapistId = data.therapistId || null;
  if (!preferredTherapistId && data.patientId) {
      // Look up previous therapist for continuity of care
      const lastAppt = await Appointment.findOne({
          where: { patientId: data.patientId, therapistId: { [Op.ne]: null } },
          order: [['date', 'DESC']],
          limit: 1
      });
      if (lastAppt) preferredTherapistId = lastAppt.therapistId;
  }

  // If no date, pick today or next available date
  let desiredDate = data.date;
  let desiredTime = data.time;

  // Helper: find earliest available date/time
  async function findEarliestSlot() {
    const today = new Date();
    // Use preferences if provided
    const startTime = data.preferredStartTime ? normalizeTime(data.preferredStartTime) : '08:00';
    const endTime = data.preferredEndTime ? normalizeTime(data.preferredEndTime) : '18:00';

    for (let i = 0; i < 30; i++) { // look up to 30 days ahead
      const d = new Date(today); 
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      
      let next;
      if (therapyType === 'Combinada') {
        next = await findNextAvailableSlotOnDateCombined(dateStr, startTime, duration, endTime);
      } else {
        // Pass preference here
        next = await findNextAvailableSlotOnDate(dateStr, startTime, duration, therapyType, preferredTherapistId, machineType, endTime, specificMachineId);
      }
      
      // If we found a therapist slot, we MUST check machine availability too
      // Note: findNextAvailableSlotOnDate returns { time, therapistId }
      if (next) {
        // Check machine for this slot
        const machineId = await findAvailableMachine(dateStr, next.time, duration, machineType, specificMachineId);
        if (machineId) {
             if (therapyType === 'Combinada') {
                 return { date: dateStr, time: next.time, physicalId: next.physicalId, occupationalId: next.occupationalId, machineId };
             } else {
                 return { date: dateStr, time: next.time, therapistId: next.therapistId, machineId };
             }
        }
        // If no machine found for this time... (we could improve this by checking machine in findNextAvailableSlotOnDate, but for now this is ok)
      }
    }
    return null;
  }

  // If date or time missing, find earliest slot
  if (!desiredDate || !desiredTime) {
    const earliest = await findEarliestSlot();
    if (!earliest) return null;
    desiredDate = earliest.date;
    desiredTime = earliest.time;
    // We found a specific slot including machine, return it
    return { requested: { date: null, time: null }, actual: earliest, adjusted: true };
  }

  // Specific date/time requested
  if (therapyType === 'Combinada') {
    const found = await findAvailableForCombined(desiredDate, desiredTime, duration);
    const machineId = found ? await findAvailableMachine(desiredDate, desiredTime, duration) : null;
    
    if (found && machineId) {
        return { requested: { date: desiredDate, time: desiredTime }, actual: { date: desiredDate, time: desiredTime, physicalId: found.physicalId, occupationalId: found.occupationalId, machineId }, adjusted: false };
    }
    
    // Scan rest of day
    // This part is tricky because we need to loop. 
    // Simplified: reuse logic or accept that we only check the exact time requested, or use the loop logic from findNextAvailableSlotOnDateCombined but checking machines.
    
    // Logic for "next available on this date"
    let cursor = timeToMinutes(desiredTime);
    const endMin = timeToMinutes('18:00');
    while(cursor <= endMin) {
        const timeStr = `${String(Math.floor(cursor/60)).padStart(2,'0')}:${String(cursor%60).padStart(2,'0')}`;
        const slot = await findAvailableForCombined(desiredDate, timeStr, duration);
        if (slot) {
            const mId = await findAvailableMachine(desiredDate, timeStr, duration);
            if (mId) {
                return { requested: { date: desiredDate, time: desiredTime }, actual: { date: desiredDate, time: timeStr, physicalId: slot.physicalId, occupationalId: slot.occupationalId, machineId: mId }, adjusted: true }; 
            }
        }
        cursor += 15;
    }

  } else {
    // Single therapy type
    const foundId = await findAvailableForSlot(desiredDate, desiredTime, duration, therapyType, preferredTherapistId, machineType, specificMachineId);
    const machineId = foundId ? await findAvailableMachine(desiredDate, desiredTime, duration, machineType, specificMachineId) : null;

    if (foundId && machineId) {
        return { requested: { date: desiredDate, time: desiredTime }, actual: { date: desiredDate, time: desiredTime, therapistId: foundId, machineId }, adjusted: false };
    }
    
    // Scan rest of day
    let cursor = timeToMinutes(desiredTime);
    const endMin = timeToMinutes('18:00');
    while(cursor <= endMin) {
        const timeStr = `${String(Math.floor(cursor/60)).padStart(2,'0')}:${String(cursor%60).padStart(2,'0')}`;
        const tId = await findAvailableForSlot(desiredDate, timeStr, duration, therapyType, preferredTherapistId, machineType, specificMachineId);
        if (tId) {
            const mId = await findAvailableMachine(desiredDate, timeStr, duration, machineType, specificMachineId);
            if (mId) {
                return { requested: { date: desiredDate, time: desiredTime }, actual: { date: desiredDate, time: timeStr, therapistId: tId, machineId: mId }, adjusted: true }; 
            }
        }
        cursor += 15;
    }
  }
  
  return null;
};

// Helper: normalize time to HH:MM:SS format
function normalizeTime(timeStr) {
  if (!timeStr) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length === 2) return `${parts[0]}:${parts[1]}:00`;
  if (parts.length === 3) return timeStr;
  return timeStr;
}


const createAppointment = async (data) => {
  const duration = Number(data.durationMinutes) || 30;
  // Normalize time format to include seconds
  if (data.time) data.time = normalizeTime(data.time);
  
  // resolve patient if cedula provided
  let patientId = data.patientId || null; 
  let patientPublicId = null;
  
  if (data.patientCedula) {
    const Patient = require('../models/patient');
    const p = await Patient.findOne({ where: { cedula: data.patientCedula } });
    if (!p) { const err = new Error(`Patient with cédula ${data.patientCedula} not found`); err.code = 'PATIENT_NOT_FOUND'; throw err; }
    patientId = p.id; patientPublicId = p.publicId; data.patientName = data.patientName || p.name; data.patientContact = data.patientContact || p.contact;
  } else if (patientId) {
    const Patient = require('../models/patient');
    const p = await Patient.findByPk(patientId);
    if (!p) { const err = new Error(`Patient with ID ${patientId} not found`); err.code = 'PATIENT_NOT_FOUND'; throw err; }
    patientPublicId = p.publicId; data.patientName = data.patientName || p.name; data.patientContact = data.patientContact || p.contact;
  }

  const proposal = await proposeAppointment(data);
  if (!proposal) { const err = new Error('No available slot found on requested date'); err.code = 'NO_SLOT'; throw err; }

  const actual = proposal.actual;
  const creationDate = new Date().toISOString().slice(0, 10);
  const batchId = randomUUID();

  // Handle Combined Therapy (2 appointments)
  if (actual.physicalId && actual.occupationalId) {
    const appt1 = await Appointment.create({ 
      date: actual.date, 
      time: normalizeTime(actual.time), 
      patientName: data.patientName, 
      patientContact: data.patientContact, 
      therapistId: actual.physicalId, 
      durationMinutes: duration, 
      patientId, 
      patientPublicId,
      creationDate,
      batchId,
      machineId: actual.machineId,
      notes: 'Terapia Combinada (Físico)'
    });
    
    const appt2 = await Appointment.create({ 
      date: actual.date, 
      time: normalizeTime(actual.time), 
      patientName: data.patientName, 
      patientContact: data.patientContact, 
      therapistId: actual.occupationalId, 
      durationMinutes: duration, 
      patientId, 
      patientPublicId,
      creationDate,
      batchId,
      machineId: actual.machineId,
      notes: 'Terapia Combinada (Ocupacional)'
    });

    try {
        await appt1.reload({ include: ['therapist', 'machine'] });
        await appt2.reload({ include: ['therapist', 'machine'] });
    } catch (e) { console.error('Error reloading associations', e); }

    console.log(`[CREATE] Created combined appointments ${appt1.id}, ${appt2.id} for patientPublicId: ${patientPublicId} on ${creationDate} batchId: ${batchId}`);
    // Return the first one as the main reference, but maybe we should return both?
    // The controller expects a single object usually, but let's see.
    // For now, returning the first one is safer for existing frontend logic, 
    // but we might want to indicate it was a combined creation.
    return { created: appt1, related: appt2, requested: proposal.requested, actual: proposal.actual, adjusted: proposal.adjusted };
  }

  const appointment = await Appointment.create({ 
    date: actual.date, 
    time: normalizeTime(actual.time), 
    patientName: data.patientName, 
    patientContact: data.patientContact, 
    therapistId: actual.therapistId, 
    durationMinutes: duration, 
    patientId, 
    patientPublicId,
    creationDate,
    batchId,
    machineId: actual.machineId,
    notes: data.notes
  });
  
  try {
      await appointment.reload({ include: ['therapist', 'machine'] });
  } catch (e) { console.error('Error reloading associations', e); }

  console.log(`[CREATE] Created appointment ${appointment.id} for patientPublicId: ${patientPublicId} on ${creationDate} batchId: ${batchId}`);
  return { created: appointment, requested: proposal.requested, actual: proposal.actual, adjusted: proposal.adjusted };
};

const createSeriesAppointments = async (opts) => {
  const occurrences = Number(opts.occurrences) || 1;
  const duration = Number(opts.durationMinutes) || 30;
  const therapyType = opts.therapyType || 'Físico';
  let startDate = opts.startDate;
  let time = opts.time ? normalizeTime(opts.time) : opts.time;

  // Resolve patient if cedula provided
  if (opts.patientCedula) {
    const Patient = require('../models/patient');
    const p = await Patient.findOne({ where: { cedula: opts.patientCedula } });
    if (!p) { const err = new Error(`Patient with cédula ${opts.patientCedula} not found`); err.code = 'PATIENT_NOT_FOUND'; throw err; }
    opts.patientId = p.id;
    opts.patientPublicId = p.publicId;
    opts.patientName = opts.patientName || p.name;
    opts.patientContact = opts.patientContact || p.contact;
  }

  // If missing, find earliest available slot
  if (!startDate || !time) {
    // Use the same logic as proposeAppointment
    const today = new Date();
    // Use preferences if provided
    const searchStartTime = opts.preferredStartTime ? normalizeTime(opts.preferredStartTime) : '08:00';
    const searchEndTime = opts.preferredEndTime ? normalizeTime(opts.preferredEndTime) : '18:00';
    
    let found = null;
    for (let i = 0; i < 30 && !found; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      
      let slot;
      if (therapyType === 'Combinada') {
           slot = await findNextAvailableSlotOnDateCombined(dateStr, searchStartTime, duration, searchEndTime);
      } else {
           slot = await findNextAvailableSlotOnDate(dateStr, searchStartTime, duration, therapyType, null, null, searchEndTime);
      }

      if (slot) { startDate = dateStr; time = slot.time; found = true; break; }
    }
    if (!found) { const err = new Error('No available slot found for series'); err.code = 'NO_SLOT'; throw err; }
  }

  // Parse start date properly to avoid timezone issues
  const [year, month, day] = startDate.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const dates = [];
  let currentDate = new Date(start);
  let count = 0;
  // Generate dates for consecutive business days (skip weekends)
  while (count < occurrences) {
    const dayOfWeek = currentDate.getDay();
    // Skip Saturday (6) and Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const TherapistAvailability = require('../models/therapistAvailability');
  const { sequelize } = require('../config/db'); 
  const tnx = await sequelize.transaction();

// Helper to check if a therapist is available for all dates
    async function isTherapistAvailableForSeries(t, dates, time, duration) {
        logDebug(`[SERIES-CHECK] Checking ${t.name} (${t.specialty}) for ${dates.length} dates starting at ${time}`);
        for (const d of dates) {
            const [y, m, day] = d.split('-').map(Number);
            const dow = new Date(y, m - 1, day).getDay();
            const av = await TherapistAvailability.findOne({ where: { therapistId: t.id, dayOfWeek: dow, startTime: { [Op.lte]: time }, endTime: { [Op.gte]: addMinutesToTime(time, duration) } } });
            if (!av) {
                logDebug(`[SERIES-CHECK] ${t.name} NOT working on ${d} (Dow: ${dow})`);
                return false;
            }
            
            const existing = await Appointment.findAll({ where: { therapistId: t.id, date: d } });
            const newStart = timeToMinutes(time); const newEnd = newStart + duration;
            for (const e of existing) { 
                const eStart = timeToMinutes(e.time); 
                const eDur = e.durationMinutes || 45; 
                const eEnd = eStart + eDur; 
                if (newStart < eEnd && eStart < newEnd) {
                    logDebug(`[SERIES-CHECK] ${t.name} CONFLICT on ${d} with appt at ${e.time}`);
                    return false; 
                }
            }
        }
        logDebug(`[SERIES-CHECK] ${t.name} AVAILABLE`);
        return true;
    }  try {
    const created = [];
    const creationDate = new Date().toISOString().slice(0, 10);
    const batchId = randomUUID();

    if (therapyType === 'Combinada') {
        const physicalTherapists = await Therapist.findAll({ where: { specialty: 'Físico' } });
        const occupationalTherapists = await Therapist.findAll({ where: { specialty: 'Ocupacional' } });
        
        let bestPhysical = null;
        for (const t of physicalTherapists) {
            if (await isTherapistAvailableForSeries(t, dates, time, duration)) {
                bestPhysical = t;
                break; 
            }
        }
        
        let bestOccupational = null;
        for (const t of occupationalTherapists) {
            if (await isTherapistAvailableForSeries(t, dates, time, duration)) {
                bestOccupational = t;
                break;
            }
        }
        
        if (!bestPhysical || !bestOccupational) {
             const err = new Error('No pair of therapists available for all requested dates/times'); 
             err.code = 'NO_CANDIDATE'; 
             throw err; 
        }

        for (const d of dates) { 
            const ap1 = await Appointment.create({ 
              date: d, 
              time: normalizeTime(time), 
              patientName: opts.patientName, 
              patientContact: opts.patientContact, 
              therapistId: bestPhysical.id, 
              durationMinutes: duration, 
              patientId: opts.patientId || null, 
              patientPublicId: opts.patientPublicId || null,
              creationDate,
              batchId,
              notes: 'Terapia Combinada (Físico)'
            }, { transaction: tnx }); 
            created.push(ap1); 

            const ap2 = await Appointment.create({ 
              date: d, 
              time: normalizeTime(time), 
              patientName: opts.patientName, 
              patientContact: opts.patientContact, 
              therapistId: bestOccupational.id, 
              durationMinutes: duration, 
              patientId: opts.patientId || null, 
              patientPublicId: opts.patientPublicId || null,
              creationDate,
              batchId,
              notes: 'Terapia Combinada (Ocupacional)'
            }, { transaction: tnx }); 
            created.push(ap2); 
        }

    } else {
        // Single therapy type
        const allTherapists = await Therapist.findAll({ where: { specialty: therapyType } });
        const candidates = [];
        for (const t of allTherapists) {
            if (await isTherapistAvailableForSeries(t, dates, time, duration)) {
                candidates.push(t);
            }
        }
        if (candidates.length === 0) { const err = new Error('No therapist available for all requested dates/times'); err.code = 'NO_CANDIDATE'; throw err; }
        
        let best = null; let bestCount = Number.POSITIVE_INFINITY;
        for (const t of candidates) { const cnt = await Appointment.count({ where: { therapistId: t.id, date: { [Op.between]: [dates[0], dates[dates.length-1]] } } }); if (cnt < bestCount) { bestCount = cnt; best = t; } }
        const chosenId = best.id;

        for (const d of dates) { 
          const ap = await Appointment.create({ 
            date: d, 
            time: normalizeTime(time), 
            patientName: opts.patientName, 
            patientContact: opts.patientContact, 
            therapistId: chosenId, 
            durationMinutes: duration, 
            patientId: opts.patientId || null, 
            patientPublicId: opts.patientPublicId || null,
            creationDate,
            batchId
          }, { transaction: tnx }); 
          created.push(ap); 
        }
    }

    await tnx.commit(); 
    
    // Fetch populated appointments to return full details
    try {
        const ids = created.map(c => c.id);
        const populated = await Appointment.findAll({
            where: { id: ids },
            include: [
                { model: Therapist, as: 'therapist', attributes: ['name', 'specialty'] },
                { model: Machine, as: 'machine', attributes: ['name', 'type'] }
            ],
            order: [['date', 'ASC'], ['time', 'ASC']]
        });
        return populated;
    } catch (e) {
        console.error('Error fetching populated series:', e);
        return created;
    }
  } catch (err) { await tnx.rollback(); throw err; }
};

const getAppointments = async () => Appointment.findAll({ 
  include: [
    { model: Therapist, as: 'therapist', attributes: ['id', 'name'] },
    { model: Patient, as: 'patient', attributes: ['id', 'name'] }
  ],
  order: [['id','DESC']]  // Order by creation (newest first)
});
const getAppointmentById = async (id) => Appointment.findByPk(id, {
  include: [{ model: Therapist, as: 'therapist', attributes: ['id', 'name'] }]
});
const getAppointmentsByPatientPublicId = async (publicId, batchId) => {
  console.log(`[SCHEDULE] Fetching appointments for patientPublicId: ${publicId}, batchId: ${batchId}`);
  
  // Resolve patient internal ID first to ensure we get all appointments even if patientPublicId is missing on Appointment
  const patient = await Patient.findOne({ where: { publicId } });
  if (!patient) {
      console.log(`[SCHEDULE] Patient not found for publicId: ${publicId}`);
      return [];
  }
  const patientId = patient.id;

  // 1. Try filtering by batchId if provided
  if (batchId) {
    const apps = await Appointment.findAll({
      where: {
        patientId: patientId,
        batchId: batchId
      },
      include: [{ model: Therapist, as: 'therapist', attributes: ['name'] }],
      order: [['date', 'ASC'], ['time', 'ASC']]
    });

    if (apps.length > 0) {
      console.log(`[SCHEDULE] Found ${apps.length} appointments with batchId ${batchId}`);
      return apps;
    }
  }

  // 2. Fallback: Return all upcoming appointments
  const today = new Date().toISOString().slice(0, 10);
  const apps = await Appointment.findAll({
    where: { 
      patientId: patientId,
      date: { [Op.gte]: today }
    },
    include: [{ model: Therapist, as: 'therapist', attributes: ['name'] }],
    order: [['date', 'ASC'], ['time', 'ASC']]
  });
  console.log(`[SCHEDULE] Found ${apps.length} upcoming appointments (fallback)`);
  return apps;
};
const updateAppointment = async (id, updates) => { 
  if (updates.time) updates.time = normalizeTime(updates.time);
  const ap = await Appointment.findByPk(id); 
  if (!ap) return null; 
  return ap.update(updates); 
};
const deleteAppointment = async (id) => { const ap = await Appointment.findByPk(id); if (!ap) return false; await ap.destroy(); return true; };

const previewAppointment = async (data) => {
  const occurrences = Number(data.occurrences) || 1;
  const therapyType = data.therapyType || 'Físico';
  
  // Resolve patient name if cedula provided
  let patientName = data.patientName;
  if (data.patientCedula) {
    const Patient = require('../models/patient');
    const p = await Patient.findOne({ where: { cedula: data.patientCedula } });
    if (p) patientName = p.name;
  }

  if (occurrences > 1) {
    // Series logic
    const duration = Number(data.durationMinutes) || 30;
    let startDate = data.startDate || data.date;
    let time = data.time ? normalizeTime(data.time) : data.time;

    // Find start slot if missing
    if (!startDate || !time) {
      const today = new Date();
      // Preferences
      const searchStartTime = data.preferredStartTime ? normalizeTime(data.preferredStartTime) : '08:00';
      const searchEndTime = data.preferredEndTime ? normalizeTime(data.preferredEndTime) : '18:00';

      let found = null;
      for (let i = 0; i < 30 && !found; i++) {
        const d = new Date(today); d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        
        let slot;
        if (therapyType === 'Combinada') {
             slot = await findNextAvailableSlotOnDateCombined(dateStr, searchStartTime, duration, searchEndTime);
        } else {
             slot = await findNextAvailableSlotOnDate(dateStr, searchStartTime, duration, therapyType, null, null, searchEndTime);
        }

        if (slot) { startDate = dateStr; time = slot.time; found = true; break; }
      }
      if (!found) { const err = new Error('No available slot found for series'); err.code = 'NO_SLOT'; throw err; }
    }

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

    const TherapistAvailability = require('../models/therapistAvailability');
    
    // Helper to check if a therapist is available for all dates
    async function isTherapistAvailableForSeries(t, dates, time, duration) {
        logDebug(`[PREVIEW-CHECK] Checking ${t.name} (${t.specialty}) for ${dates.length} dates starting at ${time}`);
        for (const d of dates) {
            const [y, m, day] = d.split('-').map(Number);
            const dow = new Date(y, m - 1, day).getDay();
            const av = await TherapistAvailability.findOne({ where: { therapistId: t.id, dayOfWeek: dow, startTime: { [Op.lte]: time }, endTime: { [Op.gte]: addMinutesToTime(time, duration) } } });
            if (!av) {
                logDebug(`[PREVIEW-CHECK] ${t.name} NOT working on ${d} (Dow: ${dow})`);
                return false;
            }
            
            const existing = await Appointment.findAll({ where: { therapistId: t.id, date: d } });
            const newStart = timeToMinutes(time); const newEnd = newStart + duration;
            for (const e of existing) { 
                const eStart = timeToMinutes(e.time); 
                const eDur = e.durationMinutes || 30; 
                const eEnd = eStart + eDur; 
                if (newStart < eEnd && eStart < newEnd) {
                    logDebug(`[PREVIEW-CHECK] ${t.name} CONFLICT on ${d} with appt at ${e.time}`);
                    return false; 
                }
            }
        }
        logDebug(`[PREVIEW-CHECK] ${t.name} AVAILABLE`);
        return true;
    }

    if (therapyType === 'Combinada') {
        // Find one Physical and one Occupational available for ALL dates
        const physicalTherapists = await Therapist.findAll({ where: { specialty: 'Físico' } });
        const occupationalTherapists = await Therapist.findAll({ where: { specialty: 'Ocupacional' } });
        
        let bestPhysical = null;
        for (const t of physicalTherapists) {
            if (await isTherapistAvailableForSeries(t, dates, time, duration)) {
                bestPhysical = t;
                break; // Just pick the first one for now
            }
        }
        
        let bestOccupational = null;
        for (const t of occupationalTherapists) {
            if (await isTherapistAvailableForSeries(t, dates, time, duration)) {
                bestOccupational = t;
                break;
            }
        }
        
        if (!bestPhysical || !bestOccupational) {
             const err = new Error('No pair of therapists available for all requested dates/times'); 
             err.code = 'NO_CANDIDATE'; 
             throw err; 
        }
        
        const result = [];
        for (const d of dates) {
            result.push({
                date: d,
                time: normalizeTime(time),
                therapistName: `${bestPhysical.name} (Físico)`,
                patientName: patientName,
                durationMinutes: duration
            });
            result.push({
                date: d,
                time: normalizeTime(time),
                therapistName: `${bestOccupational.name} (Ocupacional)`,
                patientName: patientName,
                durationMinutes: duration
            });
        }
        return result;

    } else {
        const allTherapists = await Therapist.findAll({ where: { specialty: therapyType } });
        const candidates = [];
        for (const t of allTherapists) {
            if (await isTherapistAvailableForSeries(t, dates, time, duration)) {
                candidates.push(t);
            }
        }
        
        if (candidates.length === 0) { const err = new Error('No therapist available for all requested dates/times'); err.code = 'NO_CANDIDATE'; throw err; }
        
        let best = null; let bestCount = Number.POSITIVE_INFINITY;
        for (const t of candidates) { const cnt = await Appointment.count({ where: { therapistId: t.id, date: { [Op.between]: [dates[0], dates[dates.length-1]] } } }); if (cnt < bestCount) { bestCount = cnt; best = t; } }
        
        return dates.map(d => ({
          date: d,
          time: normalizeTime(time),
          therapistName: best.name,
          patientName: patientName,
          durationMinutes: duration
        }));
    }

  } else {
    // Single logic
    const proposal = await proposeAppointment(data);
    if (!proposal) { const err = new Error('No available slot found on requested date'); err.code = 'NO_SLOT'; throw err; }
    
    if (proposal.actual.physicalId && proposal.actual.occupationalId) {
        const t1 = await Therapist.findByPk(proposal.actual.physicalId);
        const t2 = await Therapist.findByPk(proposal.actual.occupationalId);
        return [
            {
                date: proposal.actual.date,
                time: normalizeTime(proposal.actual.time),
                therapistName: t1 ? `${t1.name} (Físico)` : 'Unknown',
                patientName: patientName,
                durationMinutes: data.durationMinutes || 30
            },
            {
                date: proposal.actual.date,
                time: normalizeTime(proposal.actual.time),
                therapistName: t2 ? `${t2.name} (Ocupacional)` : 'Unknown',
                patientName: patientName,
                durationMinutes: data.durationMinutes || 30
            }
        ];
    }

    const t = await Therapist.findByPk(proposal.actual.therapistId);
    return [{
      date: proposal.actual.date,
      time: normalizeTime(proposal.actual.time),
      therapistName: t ? t.name : 'Unknown',
      patientName: patientName,
      durationMinutes: data.durationMinutes || 30
    }];
  }
};

const getAppointmentBatches = async (patientPublicId) => {
  const { sequelize } = require('../config/db');
  try {
    const batches = await Appointment.findAll({
      attributes: [
        'batchId',
        [sequelize.fn('MIN', sequelize.col('date')), 'startDate'],
        [sequelize.fn('MAX', sequelize.col('date')), 'endDate'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('MIN', sequelize.col('creationDate')), 'created']
      ],
      where: {
        patientPublicId: patientPublicId,
        batchId: { [Op.ne]: null }
      },
      group: ['batchId'],
      order: [[sequelize.fn('MIN', sequelize.col('date')), 'DESC']]
    });
    return batches;
  } catch (error) {
    console.error('Error getting appointment batches:', error);
    return [];
  }
};

module.exports = { createAppointment, proposeAppointment, createSeriesAppointments, getAppointments, getAppointmentById, getAppointmentsByPatientPublicId, updateAppointment, deleteAppointment, previewAppointment, getAppointmentBatches };
