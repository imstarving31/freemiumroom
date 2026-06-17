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

// Các API thống kê nâng cấp mới
router.get('/posts-by-time', statisticController.getPostsByTime);
router.get('/posts-by-region', statisticController.getPostsByRegion);
router.get('/revenue', statisticController.getRevenue);
router.get('/export', statisticController.exportReport);

module.exports = router;
