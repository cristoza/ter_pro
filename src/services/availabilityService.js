const TherapistAvailability = require('../models/therapistAvailability');

const createAvailability = async (data) => {
  return await TherapistAvailability.create({
    therapistId: data.therapistId,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
  });
};

const listAvailabilities = async (therapistId) => {
  const where = therapistId ? { therapistId } : {};
  return await TherapistAvailability.findAll({ where, order: [['therapistId', 'ASC'], ['dayOfWeek', 'ASC'], ['startTime', 'ASC']] });
};

const getAvailability = async (id) => {
  return await TherapistAvailability.findByPk(id);
};

const updateAvailability = async (id, updates) => {
  const av = await TherapistAvailability.findByPk(id);
  if (!av) return null;
  return await av.update(updates);
};

const deleteAvailability = async (id) => {
  const av = await TherapistAvailability.findByPk(id);
  if (!av) return false;
  await av.destroy();
  return true;
};

module.exports = {
  createAvailability,
  listAvailabilities,
  getAvailability,
  updateAvailability,
  deleteAvailability,
};
