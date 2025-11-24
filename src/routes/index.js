const express = require('express');
const appointmentRoutes = require('./appointmentRoutes');
const therapistRoutes = require('./therapistRoutes');
const patientRoutes = require('./patientRoutes');
const userRoutes = require('./userRoutes');
const { requireAuth, requireRole } = require('../middlewares/auth');
const authController = require('../controllers/authController');
const doctorController = require('../controllers/doctorController');
const therapistDashboardController = require('../controllers/therapistDashboardController');
const secretaryController = require('../controllers/secretaryController');

function setRoutes(app) {
    // Authentication routes (public)
    app.get('/login', authController.showLogin);
    app.post('/login', authController.login);
    app.post('/logout', authController.logout);
    
    // Landing page redirect to login
    app.get('/', (req, res) => {
        if (req.session && req.session.userId) {
            // Redirect to appropriate dashboard
            const role = req.session.userRole;
            if (role === 'admin') return res.redirect('/admin');
            if (role === 'doctor') return res.redirect('/doctor');
            if (role === 'therapist') return res.redirect('/therapist');
            if (role === 'secretary') return res.redirect('/secretary');
        }
        res.redirect('/login');
    });

    // Doctor routes (doctor and admin only)
    app.get('/doctor', requireRole('doctor', 'admin'), doctorController.showDashboard);

    // Therapist routes (therapist and admin only)
    app.get('/therapist', requireRole('therapist', 'admin'), therapistDashboardController.showDashboard);
    app.get('/therapist/appointments', requireRole('therapist', 'admin'), therapistDashboardController.getAppointments);

    // Secretary routes (secretary and admin only)
    app.get('/secretary', requireRole('secretary', 'admin'), secretaryController.showDashboard);
    app.get('/secretary/appointments', requireRole('secretary', 'admin'), secretaryController.getAllAppointments);
    app.get('/secretary/therapists', requireRole('secretary', 'admin'), secretaryController.getAllTherapists);
    
    // Secretary can also access appointment API for editing
    app.use('/secretary/api', requireRole('secretary', 'admin'), appointmentRoutes);

    // API routes (doctors and admins can create appointments)
    app.use('/api', requireRole('doctor', 'admin'), appointmentRoutes);
    
    // Admin-only routes for therapist/patient/user management
    app.use('/therapists', requireRole('admin'), therapistRoutes);
    // Patients routes - doctors can read (for cedula lookup), only admin can create/update/delete
    app.use('/patients', requireRole('doctor', 'admin'), patientRoutes);
    app.use('/admin/users', requireRole('admin'), userRoutes);

    // Admin UI pages (admin only)
    const adminController = require('../controllers/adminController');
    app.get('/admin', requireRole('admin'), adminController.dashboard);
    app.get('/admin/therapists', requireRole('admin'), adminController.therapists);
    app.get('/admin/patients', requireRole('admin'), adminController.patients);
    app.get('/admin/appointments', requireRole('admin'), adminController.appointments);
    
    const availabilityRoutes = require('./availabilityRoutes');
    app.use('/availability', requireRole('admin'), availabilityRoutes);
}

module.exports = { setRoutes };