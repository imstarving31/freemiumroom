const express = require('express');
const router = express.Router();
const statisticController = require('../controllers/statistic.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyAdmin = require('../middlewares/verifyAdmin');

// Cấu hình phân quyền Admin cho các API thống kê
router.use(verifyToken, verifyAdmin);

router.get('/overview', statisticController.getOverviewStats);
router.get('/posts-by-province', statisticController.getPostsByProvince);
router.get('/revenue-by-month', statisticController.getRevenueByMonth);

module.exports = router;
