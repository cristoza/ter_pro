const Therapist = require('../models/therapist');

const createTherapist = async (data) => {
  return await Therapist.create({
    name: data.name,
    email: data.email,
    password: data.password,
    phone: data.phone,
  });
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
  return await therapist.update(updates);
};

const deleteTherapist = async (id) => {
  const therapist = await Therapist.findByPk(id);
  if (!therapist) return false;
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
