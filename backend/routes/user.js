const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile, getStatistics } = require('../controllers/userController');

router.use(auth);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/statistics', getStatistics);

module.exports = router;
