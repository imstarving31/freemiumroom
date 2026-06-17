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

// Update User Profile route
router.put('/profile', verifyToken, userController.updateProfile);

// Change Password route
router.put('/change-password', verifyToken, userController.changePassword);

// Deactivate Account route
router.put('/deactivate', verifyToken, userController.deactivateAccount);

module.exports = router;
