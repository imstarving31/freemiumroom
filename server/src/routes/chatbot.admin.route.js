const express = require('express');
const router = express.Router();
const chatbotAdminController = require('../controllers/chatbot.admin.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyAdmin = require('../middlewares/verifyAdmin');

// Ensure only admins can access statistics and chatbot management
router.use(verifyToken, verifyAdmin);

// FAQ REST routes
router.get('/faq', chatbotAdminController.getFAQs);
router.post('/faq', chatbotAdminController.createFAQ);
router.put('/faq/:id', chatbotAdminController.updateFAQ);
router.delete('/faq/:id', chatbotAdminController.deleteFAQ);

// Chat Sessions route
router.get('/sessions', chatbotAdminController.getChatSessions);

module.exports = router;
