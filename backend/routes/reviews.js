const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getReviews, createReview } = require('../controllers/reviewsController');

router.get('/:fieldId', getReviews);
router.post('/', auth, createReview);

module.exports = router;
