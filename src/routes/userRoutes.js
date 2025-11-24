const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireRole } = require('../middlewares/auth');
const { validateUserCreate } = require('../middlewares/validators');

// All user management routes require admin role
router.use(requireRole('admin'));

// Get users page
router.get('/', userController.getUsersPage);

// Create user
router.post('/', validateUserCreate, userController.createUser);

// Delete user
router.post('/:id/delete', userController.deleteUser);

// Update password
router.post('/:id/password', userController.updatePassword);

module.exports = router;
