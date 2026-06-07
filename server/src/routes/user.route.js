const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const verifyToken = require('../middlewares/verifyToken');

// Toggle Favorite route
router.post('/favorites/:postId', verifyToken, userController.toggleFavorite);

// Get Favorites route
router.get('/favorites', verifyToken, userController.getFavoritePosts);

// Get User Profile route
router.get('/profile', verifyToken, userController.getProfile);

module.exports = router;
