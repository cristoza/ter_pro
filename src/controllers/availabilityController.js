const availabilityService = require('../services/availabilityService');

module.exports = {
  async create(req, res) {
    try {
      const av = await availabilityService.createAvailability(req.body);
      res.status(201).json(av);
    } catch (err) {
      res.status(500).json({ message: 'Error creating availability', error: err.message });
    }
  },

  async list(req, res) {
    try {
      const therapistId = req.query.therapistId;
      const list = await availabilityService.listAvailabilities(therapistId);
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ message: 'Error listing availability', error: err.message });
    }
  },

  async get(req, res) {
    try {
      const av = await availabilityService.getAvailability(req.params.id);
      if (!av) return res.status(404).json({ message: 'Not found' });
      res.status(200).json(av);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching availability', error: err.message });
    }
  },

  async update(req, res) {
    try {
      const updated = await availabilityService.updateAvailability(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: 'Not found' });
      res.status(200).json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Error updating availability', error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const ok = await availabilityService.deleteAvailability(req.params.id);
      if (!ok) return res.status(404).json({ message: 'Not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: 'Error deleting availability', error: err.message });
    }
  },
};
