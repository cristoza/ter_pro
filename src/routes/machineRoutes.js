const express = require('express');
const router = express.Router();
const machineController = require('../controllers/machineController');
const { requireRole } = require('../middlewares/auth');

// All machine routes require admin role (or at least staff, but admin for managing)
// For now, let's keep it open or require specific roles. 
// Ideally "admin" can manage, "doctor"/"secretary" can view.

// List all (public or authenticated)
router.get('/', machineController.getAllMachines);
router.get('/occupancy', requireRole('admin', 'doctor', 'therapist'), machineController.getOccupancy);

// Protected routes
router.use(requireRole('admin'));
router.post('/', machineController.createMachine);
router.put('/:id', machineController.updateMachine);
router.delete('/:id', machineController.deleteMachine);

module.exports = router;
