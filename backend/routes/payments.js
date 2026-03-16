const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createPayment, getPayment } = require('../controllers/paymentsController');

router.use(auth);
router.post('/', createPayment);
router.get('/:id', getPayment);

module.exports = router;
