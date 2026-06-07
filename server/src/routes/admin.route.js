const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyAdmin = require('../middlewares/verifyAdmin');

// Verify token and ensure user role is Admin for all routes below
router.use(verifyToken, verifyAdmin);

// Admin Room Post routes
router.get('/room-posts/pending', adminController.getPendingPosts);
router.patch('/room-posts/:id/approve', adminController.approvePost);
router.patch('/room-posts/:id/reject', adminController.rejectPost);

// Admin dashboard stats route
router.get('/stats', adminController.getDashboardStats);

// Admin User Management routes
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/toggle-block', adminController.toggleBlockUser);

// Admin Transaction Management route
router.get('/transactions', adminController.getAllTransactions);
router.patch('/transactions/:id/note', adminController.updateTransactionNote);

module.exports = router;
