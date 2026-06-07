const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyAdmin = require('../middlewares/verifyAdmin');

// Create payment URL route (Requires user authentication)
router.post('/create_payment_url', verifyToken, paymentController.createPaymentUrl);

// VNPAY return redirect route (Handles VNPAY callbacks, unsecured so user browser redirects can hit it)
router.get('/vnpay_return', paymentController.vnpayReturn);

// VNPAY IPN route (Unsecured, called by VNPAY servers)
router.get('/vnpay_ipn', paymentController.vnpayIpn);

// Admin query transaction status from VNPAY (QueryDR)
router.post('/query-status', verifyToken, verifyAdmin, paymentController.queryTransactionStatus);

// Admin update transaction status manually (to Success and credit user)
router.post('/update-status', verifyToken, verifyAdmin, paymentController.updateTransactionStatus);

// Get transaction history route (Requires user authentication)
router.get('/history', verifyToken, paymentController.getTransactionHistory);

module.exports = router;
