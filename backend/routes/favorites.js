const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getFavorites, addFavorite, removeFavorite, checkFavorite } = require('../controllers/favoritesController');

router.use(auth);
router.get('/', getFavorites);
router.post('/', addFavorite);
router.get('/check/:fieldId', checkFavorite);
router.delete('/:fieldId', removeFavorite);

module.exports = router;
