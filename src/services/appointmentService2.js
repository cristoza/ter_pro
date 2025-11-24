const Appointment = require('../models/appointment');
const { Therapist } = require('../models');
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

async function findAvailableForSlot(date, time, dur) {
  const TherapistAvailability = require('../models/therapistAvailability');
  
  // Parse date properly to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number);
  const dow = new Date(year, month - 1, day).getDay();
  
  // Optimized: Get all therapists with their availability and appointments in one query
  const allTherapists = await Therapist.findAll({
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

  const newStart = timeToMinutes(time);
  const newEnd = newStart + dur;

  for (const t of allTherapists) {
    let conflict = false;
    if (t.appointments && t.appointments.length > 0) {
      for (const e of t.appointments) {
        const eStart = timeToMinutes(e.time);
        const eDur = e.durationMinutes || 45;
        const eEnd = eStart + eDur;
        if (newStart < eEnd && eStart < newEnd) {
          conflict = true;
          break;
        }
      }
    }
    if (!conflict) return t.id;
  }
  return null;
}

async function findNextAvailableSlotOnDate(date, startTime, dur) {
  const step = 15;
  const endLimit = '18:00';
  let cursor = timeToMinutes(startTime);
  const endMin = timeToMinutes(endLimit);
  while (cursor <= endMin) {
    const tStr = `${String(Math.floor(cursor/60)).padStart(2,'0')}:${String(cursor%60).padStart(2,'0')}`;
    const tid = await findAvailableForSlot(date, tStr, dur);
    if (tid) return { time: tStr, therapistId: tid };
    cursor += step;
  }
  return null;
}

const proposeAppointment = async (data) => {
  const duration = Number(data.durationMinutes) || 45;
  // If no date, pick today or next available date
  let desiredDate = data.date;
  let desiredTime = data.time;
  const therapistPref = data.therapistId || null;

  // Helper: find earliest available date/time
  async function findEarliestSlot() {
    const today = new Date();
    for (let i = 0; i < 30; i++) { // look up to 30 days ahead
      const d = new Date(today); d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const startTime = '08:00';
      const next = await findNextAvailableSlotOnDate(dateStr, startTime, duration);
      if (next) return { date: dateStr, time: next.time, therapistId: next.therapistId };
    }
    return null;
  }

  // If date or time missing, find earliest slot
  if (!desiredDate || !desiredTime) {
    const earliest = await findEarliestSlot();
    if (!earliest) return null;
    desiredDate = earliest.date;
    desiredTime = earliest.time;
    data.date = desiredDate;
    data.time = desiredTime;
    return { requested: { date: null, time: null }, actual: earliest, adjusted: true };
  }

  if (therapistPref) {
    const availAny = await findAvailableForSlot(desiredDate, desiredTime, duration);
    if (availAny) {
      if (availAny === therapistPref) return { requested: { date: desiredDate, time: desiredTime }, actual: { date: desiredDate, time: desiredTime, therapistId: therapistPref }, adjusted: false };
      return { requested: { date: desiredDate, time: desiredTime }, actual: { date: desiredDate, time: desiredTime, therapistId: availAny }, adjusted: true };
    }
    const next = await findNextAvailableSlotOnDate(desiredDate, desiredTime, duration);
    if (next) return { requested: { date: desiredDate, time: desiredTime }, actual: { date: desiredDate, time: next.time, therapistId: next.therapistId }, adjusted: true };
    return null;
  }

  const found = await findAvailableForSlot(desiredDate, desiredTime, duration);
  if (found) return { requested: { date: desiredDate, time: desiredTime }, actual: { date: desiredDate, time: desiredTime, therapistId: found }, adjusted: false };
  const next = await findNextAvailableSlotOnDate(desiredDate, desiredTime, duration);
  if (next) return { requested: { date: desiredDate, time: desiredTime }, actual: { date: desiredDate, time: next.time, therapistId: next.therapistId }, adjusted: true };
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
  const duration = Number(data.durationMinutes) || 45;
  // Normalize time format to include seconds
  if (data.time) data.time = normalizeTime(data.time);
  
  // resolve patient if cedula provided
  let patientId = null; let patientPublicId = null;
  if (data.patientCedula) {
    const Patient = require('../models/patient');
    const p = await Patient.findOne({ where: { cedula: data.patientCedula } });
    if (!p) { const err = new Error(`Patient with cédula ${data.patientCedula} not found`); err.code = 'PATIENT_NOT_FOUND'; throw err; }
    patientId = p.id; patientPublicId = p.publicId; data.patientName = data.patientName || p.name; data.patientContact = data.patientContact || p.contact;
  }

  const proposal = await proposeAppointment(data);
  if (!proposal) { const err = new Error('No available slot found on requested date'); err.code = 'NO_SLOT'; throw err; }

  const actual = proposal.actual;
  const appointment = await Appointment.create({ date: actual.date, time: normalizeTime(actual.time), patientName: data.patientName, patientContact: data.patientContact, therapistId: actual.therapistId, durationMinutes: duration, patientId, patientPublicId });
  return { created: appointment, requested: proposal.requested, actual: proposal.actual, adjusted: proposal.adjusted };
};

const createSeriesAppointments = async (opts) => {
  const occurrences = Number(opts.occurrences) || 1;
  const duration = Number(opts.durationMinutes) || 45;
  let startDate = opts.startDate;
  let time = opts.time ? normalizeTime(opts.time) : opts.time;

  // If missing, find earliest available slot
  if (!startDate || !time) {
    // Use the same logic as proposeAppointment
    const today = new Date();
    let found = null;
    for (let i = 0; i < 30 && !found; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const startTime = '08:00';
      const slot = await findNextAvailableSlotOnDate(dateStr, startTime, duration);
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
  const allTherapists = await Therapist.findAll();
  const candidates = [];
  for (const t of allTherapists) {
    let ok = true;
    for (const d of dates) {
      const [y, m, day] = d.split('-').map(Number);
      const dow = new Date(y, m - 1, day).getDay();
      const av = await TherapistAvailability.findOne({ where: { therapistId: t.id, dayOfWeek: dow, startTime: { [Op.lte]: time }, endTime: { [Op.gte]: addMinutesToTime(time, duration) } } });
      if (!av) { ok = false; break; }
      const existing = await Appointment.findAll({ where: { therapistId: t.id, date: d } });
      const newStart = timeToMinutes(time); const newEnd = newStart + duration;
      for (const e of existing) { const eStart = timeToMinutes(e.time); const eDur = e.durationMinutes || 45; const eEnd = eStart + eDur; if (newStart < eEnd && eStart < newEnd) { ok = false; break; } }
      if (!ok) break;
    }
    if (ok) candidates.push(t);
  }
  if (candidates.length === 0) { const err = new Error('No therapist available for all requested dates/times'); err.code = 'NO_CANDIDATE'; throw err; }
  let best = null; let bestCount = Number.POSITIVE_INFINITY;
  for (const t of candidates) { const cnt = await Appointment.count({ where: { therapistId: t.id, date: { [Op.between]: [dates[0], dates[dates.length-1]] } } }); if (cnt < bestCount) { bestCount = cnt; best = t; } }
  const chosenId = best.id;
  const { sequelize } = require('../config/db'); const tnx = await sequelize.transaction();
  try {
    const created = [];
    for (const d of dates) { const ap = await Appointment.create({ date: d, time: normalizeTime(time), patientName: opts.patientName, patientContact: opts.patientContact, therapistId: chosenId, durationMinutes: duration, patientId: opts.patientId || null, patientPublicId: opts.patientPublicId || null }, { transaction: tnx }); created.push(ap); }
    await tnx.commit(); return created;
  } catch (err) { await tnx.rollback(); throw err; }
};

const getAppointments = async () => Appointment.findAll({ 
  include: [{ model: Therapist, as: 'therapist', attributes: ['id', 'name'] }],
  order: [['id','DESC']]  // Order by creation (newest first)
});
const getAppointmentById = async (id) => Appointment.findByPk(id, {
  include: [{ model: Therapist, as: 'therapist', attributes: ['id', 'name'] }]
});
const updateAppointment = async (id, updates) => { 
  if (updates.time) updates.time = normalizeTime(updates.time);
  const ap = await Appointment.findByPk(id); 
  if (!ap) return null; 
  return ap.update(updates); 
};
const deleteAppointment = async (id) => { const ap = await Appointment.findByPk(id); if (!ap) return false; await ap.destroy(); return true; };

module.exports = { createAppointment, proposeAppointment, createSeriesAppointments, getAppointments, getAppointmentById, updateAppointment, deleteAppointment };
