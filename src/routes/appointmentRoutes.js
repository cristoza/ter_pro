const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const { validateAppointmentCreate } = require('../middlewares/validators');

const router = express.Router();

// POST /api/appointments
router.post('/appointments', validateAppointmentCreate, appointmentController.createAppointment);
// POST /api/appointments/propose
router.post('/appointments/propose', validateAppointmentCreate, appointmentController.proposeAppointment);
// GET /api/appointments
router.get('/appointments', appointmentController.listAppointments);
// GET /api/appointments/:id
router.get('/appointments/:id', appointmentController.getAppointment);
// PUT /api/appointments/:id
router.put('/appointments/:id', appointmentController.updateAppointment);
// DELETE /api/appointments/:id
router.delete('/appointments/:id', appointmentController.deleteAppointment);
// POST /api/appointments/series - create consecutive appointments
router.post('/appointments/series', validateAppointmentCreate, appointmentController.createSeries);
// POST /api/appointments/preview - preview appointments before creation
router.post('/appointments/preview', validateAppointmentCreate, appointmentController.previewAppointment);

module.exports = router;