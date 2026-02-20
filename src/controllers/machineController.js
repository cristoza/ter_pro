const { Machine, Appointment, Patient, Therapist } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

module.exports = {
  async getAllMachines(req, res) {
    try {
      const machines = await Machine.findAll({
        order: [['name', 'ASC']]
      });
      res.json(machines);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving machines', error: error.message });
    }
  },

  async getOccupancy(req, res) {
    try {
      const { date } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];

      const machines = await Machine.findAll({
        order: [['name', 'ASC']],
        include: [{
          model: Appointment,
          as: 'appointments',
          required: false, // Include even if no appointments
          where: {
            date: targetDate,
            status: { [Op.ne]: 'cancelled' } // Don't count cancelled
          },
          include: [
            { model: Patient, as: 'patient', attributes: ['name'] },
            { model: Therapist, as: 'therapist', attributes: ['name'] }
          ]
        }]
      });

      res.json(machines);
    } catch (error) {
      logger.error('Error getting occupancy:', error);
      res.status(500).json({ message: 'Error retrieving occupancy', error: error.message });
    }
  },

  async createMachine(req, res) {
    try {
      const machine = await Machine.create(req.body);
      res.status(201).json(machine);
    } catch (error) {
      res.status(400).json({ message: 'Error creating machine', error: error.message });
    }
  },

  async updateMachine(req, res) {
    try {
      const machine = await Machine.findByPk(req.params.id);
      if (!machine) return res.status(404).json({ message: 'Machine not found' });
      
      await machine.update(req.body);
      res.json(machine);
    } catch (error) {
      res.status(400).json({ message: 'Error updating machine', error: error.message });
    }
  },

  async deleteMachine(req, res) {
    try {
      const machine = await Machine.findByPk(req.params.id);
      if (!machine) return res.status(404).json({ message: 'Machine not found' });
      
      await machine.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting machine', error: error.message });
    }
  }
};
