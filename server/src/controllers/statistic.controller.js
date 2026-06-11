const User = require('../models/User');
const RoomPost = require('../models/RoomPost');
const Transaction = require('../models/Transaction');

// 1. API Tổng quan số liệu (Cards)
exports.getOverviewStats = async (req, res) => {
  try {
    const [totalUsers, totalRoomPosts, pendingRoomPosts, revenueResult] = await Promise.all([
      User.countDocuments(),
      RoomPost.countDocuments(),
      RoomPost.countDocuments({ status: 'Pending' }),
      Transaction.aggregate([
        {
          $match: {
            transactionType: 'Payment',
            status: 'Success'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalRoomPosts,
        pendingRoomPosts,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Error in getOverviewStats:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy số liệu tổng quan.'
    });
  }
};

// 2. API Thống kê biểu đồ tin đăng theo Tỉnh/Thành
exports.getPostsByProvince = async (req, res) => {
  try {
    const postsByProvince = await RoomPost.aggregate([
      {
        $match: {
          province: { $ne: null, $exists: true }
        }
      },
      {
        $group: {
          _id: '$province',
          value: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: 1
        }
      },
      {
        $sort: { value: -1 }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: postsByProvince
    });
  } catch (error) {
    console.error('Error in getPostsByProvince:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi thống kê tin đăng theo tỉnh thành.'
    });
  }
};

// 3. API Thống kê Doanh thu theo tháng (Chart) của năm hiện tại
exports.getRevenueByMonth = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);

    const monthlyRevenueAgg = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'Payment',
          status: 'Success',
          createdAt: {
            $gte: startOfYear,
            $lte: endOfYear
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Khởi tạo mảng doanh thu 12 tháng mặc định là 0
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      month: `Tháng ${i + 1}`,
      revenue: 0
    }));

    // Gán dữ liệu truy vấn được vào các tháng tương ứng
    monthlyRevenueAgg.forEach(item => {
      const monthIndex = item._id - 1; // MongoDB $month trả về giá trị từ 1 - 12
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyRevenue[monthIndex].revenue = item.revenue;
      }
    });

    return res.status(200).json({
      success: true,
      data: monthlyRevenue
    });
  } catch (error) {
    console.error('Error in getRevenueByMonth:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi thống kê doanh thu theo tháng.'
    });
  }
};
