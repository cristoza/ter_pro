const express = require('express');
const router = express.Router();
const apiUserController = require('../controllers/apiUserController');
const { requireRole } = require('../middlewares/auth');
const { validateUserCreate } = require('../middlewares/validators');

// All routes require admin
router.use(requireRole('admin'));

router.get('/', apiUserController.getAllUsers);
router.post('/', validateUserCreate, apiUserController.createUser);
router.put('/:id', apiUserController.updateUser);
router.delete('/:id', apiUserController.deleteUser);

module.exports = router;
