const express = require('express');
const controller = require('../controllers/patientController');
const { validatePatientCreate, validatePatientUpdate } = require('../middlewares/validators');
const { requireRole } = require('../middlewares/auth');

const router = express.Router();

// Read operations - accessible by doctors and admins
router.get('/', controller.list);
router.get('/cedula/:cedula', controller.getByCedula);
router.get('/:id', controller.getById);

// Write operations - accessible by admin, doctor, and secretary
router.post('/', requireRole('admin', 'doctor', 'secretary'), validatePatientCreate, controller.create);
router.put('/:id', requireRole('admin', 'doctor', 'secretary'), validatePatientUpdate, controller.update);
router.delete('/:id', requireRole('admin'), controller.remove);

module.exports = router;
