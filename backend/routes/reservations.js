const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createReservation, getReservations, updateReservation } = require('../controllers/reservationsController');

router.use(auth);
router.post('/', createReservation);
router.get('/', getReservations);
router.patch('/:id', updateReservation);

module.exports = router;
