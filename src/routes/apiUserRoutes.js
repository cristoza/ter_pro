const express = require('express');
const router = express.Router();
const apiUserController = require('../controllers/apiUserController');
const { requireRole } = require('../middlewares/auth');

// All routes require admin
router.use(requireRole('admin'));

router.get('/', apiUserController.getAllUsers);
router.post('/', apiUserController.createUser);
router.put('/:id', apiUserController.updateUser);
router.delete('/:id', apiUserController.deleteUser);

module.exports = router;
