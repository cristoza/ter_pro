const express = require('express');
const controller = require('../controllers/patientController');
const { validatePatientCreate } = require('../middlewares/validators');
const { requireRole } = require('../middlewares/auth');

const router = express.Router();

// Read operations - accessible by doctors and admins
router.get('/', controller.list);
router.get('/cedula/:cedula', controller.getByCedula);
router.get('/:id', controller.getById);

// Write operations - admin only
router.post('/', requireRole('admin'), validatePatientCreate, controller.create);
router.put('/:id', requireRole('admin'), controller.update);
router.delete('/:id', requireRole('admin'), controller.remove);

module.exports = router;
