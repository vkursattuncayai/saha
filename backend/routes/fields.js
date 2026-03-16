const express = require('express');
const router = express.Router();
const { getFields, getFieldById, getAvailability } = require('../controllers/fieldsController');

router.get('/', getFields);
router.get('/:id', getFieldById);
router.get('/:id/availability', getAvailability);

module.exports = router;
