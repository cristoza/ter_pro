const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { requireRole } = require('../middlewares/auth');

const router = express.Router();

// GET /api/analytics
router.get('/analytics', requireRole('admin'), analyticsController.getStats);

module.exports = router;
