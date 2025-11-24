const therapistService = require('../services/therapistService');

module.exports = {
  async create(req, res) {
    try {
      const therapist = await therapistService.createTherapist(req.body);
      res.status(201).json(therapist);
    } catch (err) {
      res.status(500).json({ message: 'Error creating therapist', error: err.message });
    }
  },

  async list(req, res) {
    try {
      const therapists = await therapistService.getTherapists();
      res.status(200).json(therapists);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching therapists', error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const therapist = await therapistService.getTherapistById(req.params.id);
      if (!therapist) return res.status(404).json({ message: 'Therapist not found' });
      res.status(200).json(therapist);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching therapist', error: err.message });
    }
  },

  async update(req, res) {
    try {
      const updated = await therapistService.updateTherapist(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: 'Therapist not found' });
      res.status(200).json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Error updating therapist', error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const ok = await therapistService.deleteTherapist(req.params.id);
      if (!ok) return res.status(404).json({ message: 'Therapist not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: 'Error deleting therapist', error: err.message });
    }
  },
};
