const patientService = require('../services/patientService');

module.exports = {
  async create(req, res) {
    try {
      const patient = await patientService.createPatient(req.body);
      res.status(201).json(patient);
    } catch (err) {
      res.status(500).json({ message: 'Error creating patient', error: err.message });
    }
  },

  async list(req, res) {
    try {
      const patients = await patientService.getPatients();
      res.status(200).json(patients);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching patients', error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const patient = await patientService.getPatientById(req.params.id);
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      res.status(200).json(patient);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching patient', error: err.message });
    }
  },

  async getByCedula(req, res) {
    try {
      const patient = await patientService.getPatientByCedula(req.params.cedula);
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      res.status(200).json(patient);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching patient', error: err.message });
    }
  },

  async update(req, res) {
    try {
      const updated = await patientService.updatePatient(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: 'Patient not found' });
      res.status(200).json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Error updating patient', error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const ok = await patientService.deletePatient(req.params.id);
      if (!ok) return res.status(404).json({ message: 'Patient not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: 'Error deleting patient', error: err.message });
    }
  },
};
