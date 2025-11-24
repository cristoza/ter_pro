const Patient = require('../models/patient');

const createPatient = async (data) => {
  return await Patient.create({
    cedula: data.cedula,
    name: data.name,
    dob: data.dob,
    contact: data.contact,
    notes: data.notes,
  });
};

const getPatients = async () => {
  return await Patient.findAll({ order: [['name', 'ASC']] });
};

const getPatientByCedula = async (cedula) => {
  return await Patient.findOne({ where: { cedula } });
};

const getPatientById = async (id) => {
  return await Patient.findByPk(id);
};

const updatePatient = async (id, updates) => {
  const patient = await Patient.findByPk(id);
  if (!patient) return null;
  return await patient.update(updates);
};

const deletePatient = async (id) => {
  const patient = await Patient.findByPk(id);
  if (!patient) return false;
  await patient.destroy();
  return true;
};

module.exports = {
  createPatient,
  getPatients,
  getPatientByCedula,
  getPatientById,
  updatePatient,
  deletePatient,
};
