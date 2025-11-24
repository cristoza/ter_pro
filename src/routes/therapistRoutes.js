const express = require('express');
const controller = require('../controllers/therapistController');
const { validateTherapistCreate } = require('../middlewares/validators');

const router = express.Router();

router.get('/', controller.list);
router.post('/', validateTherapistCreate, controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
