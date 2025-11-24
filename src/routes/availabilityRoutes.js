const express = require('express');
const controller = require('../controllers/availabilityController');
const { validateAvailability } = require('../middlewares/validators');

const router = express.Router();

router.get('/', controller.list);
router.post('/', validateAvailability, controller.create);
router.get('/:id', controller.get);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
