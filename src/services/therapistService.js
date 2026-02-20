const { Therapist, TherapistAvailability, Appointment, User } = require('../models');
const logger = require('../config/logger');

const createTherapist = async (data) => {
  // Sanitize email: trim and convert empty strings to null
  const email = data.email && data.email.trim() !== '' ? data.email.trim() : null;

  const therapist = await Therapist.create({
    name: data.name,
    specialty: data.specialty || 'Físico',
    email: email,
    password: data.password,
    phone: data.phone,
    workingHours: data.workingHours,
  });

  // Parse workingHours string or use default
  // Format expected: "Lunes, Martes: 08:00 - 16:00"
  const availability = [];
  const dayMap = { 'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };

  if (data.workingHours && data.workingHours.includes(':') && data.workingHours.includes('-')) {
    try {
      // Split "Lunes, Martes: 08:00 - 16:00"
      // First split by first colon finding index
      const colonIndex = data.workingHours.indexOf(':');
      const daysPart = data.workingHours.substring(0, colonIndex);
      const timePart = data.workingHours.substring(colonIndex + 1);
      
      const [startTime, endTime] = timePart.split(' - ').map(t => t.trim());
      const days = daysPart.split(',').map(d => d.trim());
      
      days.forEach(day => {
        const dayNum = dayMap[day];
        if (dayNum !== undefined) {
          availability.push({
            therapistId: therapist.id,
            dayOfWeek: dayNum,
            startTime: startTime.length === 5 ? startTime + ':00' : startTime,
            endTime: endTime.length === 5 ? endTime + ':00' : endTime
          });
        }
      });
    } catch (e) {
      logger.error('Error parsing workingHours, utilizing defaults', e);
    }
  }

  // Fallback if parsing failed or no days found
  if (availability.length === 0) {
    for (let i = 1; i <= 5; i++) {
      availability.push({
        therapistId: therapist.id,
        dayOfWeek: i,
        startTime: '09:00:00',
        endTime: '17:00:00'
      });
    }
  }

  await TherapistAvailability.bulkCreate(availability);

  return therapist;
};

const getTherapists = async () => {
  return await Therapist.findAll({ order: [['name', 'ASC']] });
};

const getTherapistById = async (id) => {
  return await Therapist.findByPk(id);
};

const updateTherapist = async (id, updates) => {
  const therapist = await Therapist.findByPk(id);
  if (!therapist) return null;

  // Sanitize email if it's being updated
  if (updates.email !== undefined) {
    updates.email = updates.email && updates.email.trim() !== '' ? updates.email.trim() : null;
  }

  return await therapist.update(updates);
};

const deleteTherapist = async (id) => {
  const therapist = await Therapist.findByPk(id);
  if (!therapist) return false;

  // Unlink appointments instead of failing foreign key constraints
  await Appointment.update({ therapistId: null }, { where: { therapistId: id } });

  // Remove availability records
  await TherapistAvailability.destroy({ where: { therapistId: id } });

  // Remove linked user account
  await User.destroy({ where: { therapistId: id } });

  await therapist.destroy();
  return true;
};

module.exports = {
  createTherapist,
  getTherapists,
  getTherapistById,
  updateTherapist,
  deleteTherapist,
};
