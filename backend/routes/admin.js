const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminCheck = require('../middleware/admin');
const ctrl = require('../controllers/adminController');

router.use(auth);
router.use(adminCheck);

router.get('/dashboard', ctrl.getDashboard);
router.get('/fields', ctrl.getFields);
router.post('/fields', ctrl.createField);
router.patch('/fields/:id', ctrl.updateField);
router.get('/reservations', ctrl.getReservations);
router.get('/users', ctrl.getUsers);

module.exports = router;
