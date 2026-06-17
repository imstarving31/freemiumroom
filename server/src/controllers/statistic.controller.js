const User = require('../models/User');
const RoomPost = require('../models/RoomPost');
const Transaction = require('../models/Transaction');

// Helper to calculate date range based on query params
const getFilterDateRange = (timeRange, startDate, endDate) => {
  let start = new Date(0); // Default to all time
  let end = new Date();

  if (startDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
  }
  if (endDate) {
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  if (!startDate && !endDate && timeRange) {
    const now = new Date();
    end = new Date(now);
    end.setHours(23, 59, 59, 999);

    if (timeRange === 'day') {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
    } else if (timeRange === 'week') {
      const dateCopy = new Date(now);
      const day = dateCopy.getDay();
      const diff = dateCopy.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start = new Date(dateCopy.setDate(diff));
      start.setHours(0, 0, 0, 0);
    } else if (timeRange === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
    } else if (timeRange === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
    }
  }

  return { start, end };
};

// Zero-fill slots generators for statistics display
const generateDaySlots = (start, end) => {
  const slots = [];
  const curr = new Date(start);
  while (curr <= end) {
    const label = `${curr.getHours().toString().padStart(2, '0')}:00`;
    slots.push({ time: label, count: 0, revenue: 0 });
    curr.setHours(curr.getHours() + 1);
  }
  return slots;
};

const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const generateWeekSlots = (start, end) => {
  const slots = [];
  const curr = new Date(start);
  while (curr <= end) {
    const label = weekdays[curr.getDay()];
    const dateLabel = `${curr.getDate().toString().padStart(2, '0')}/${(curr.getMonth() + 1).toString().padStart(2, '0')}`;
    const fullLabel = `${label} (${dateLabel})`;
    slots.push({ time: fullLabel, count: 0, revenue: 0, rawDate: curr.toDateString() });
    curr.setDate(curr.getDate() + 1);
  }
  return slots;
};

const generateMonthSlots = (start, end) => {
  const slots = [];
  const curr = new Date(start);
  while (curr <= end) {
    const label = `${curr.getDate().toString().padStart(2, '0')}/${(curr.getMonth() + 1).toString().padStart(2, '0')}`;
    slots.push({ time: label, count: 0, revenue: 0, rawDate: curr.toDateString() });
    curr.setDate(curr.getDate() + 1);
  }
  return slots;
};

const generateYearSlots = (start, end) => {
  const slots = [];
  const curr = new Date(start);
  while (curr <= end) {
    const label = `Tháng ${curr.getMonth() + 1}`;
    slots.push({ time: label, count: 0, revenue: 0, yearMonthKey: `${curr.getFullYear()}-${(curr.getMonth() + 1).toString().padStart(2, '0')}` });
    curr.setMonth(curr.getMonth() + 1);
  }
  return slots;
};

// 1. API Tổng quan số liệu (Cards) có hỗ trợ bộ lọc thời gian
exports.getOverviewStats = async (req, res) => {
  try {
    const { timeRange, startDate, endDate } = req.query;
    const { start, end } = getFilterDateRange(timeRange, startDate, endDate);

    const filterStage = {
      createdAt: { $gte: start, $lte: end }
    };

    const [totalUsers, totalRoomPosts, pendingRoomPosts, revenueResult] = await Promise.all([
      User.countDocuments(filterStage),
      RoomPost.countDocuments(filterStage),
      RoomPost.countDocuments({ ...filterStage, status: 'Pending' }),
      Transaction.aggregate([
        {
          $match: {
            transactionType: 'Payment',
            status: 'Success',
            createdAt: { $gte: start, $lte: end }
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
    const { timeRange, startDate, endDate } = req.query;
    const { start, end } = getFilterDateRange(timeRange, startDate, endDate);

    const matchStage = {
      province: { $ne: null, $exists: true },
      createdAt: { $gte: start, $lte: end }
    };

    const postsByProvince = await RoomPost.aggregate([
      { $match: matchStage },
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
      { $sort: { value: -1 } }
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

// 3. API Thống kê Doanh thu theo tháng của năm hiện tại (Dành cho backward compatibility)
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

    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      month: `Tháng ${i + 1}`,
      revenue: 0
    }));

    monthlyRevenueAgg.forEach(item => {
      const monthIndex = item._id - 1;
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

// 4. API Thống kê tin đăng mới theo thời gian
exports.getPostsByTime = async (req, res) => {
  try {
    const { timeRange, startDate, endDate } = req.query;
    const { start, end } = getFilterDateRange(timeRange, startDate, endDate);

    const matchStage = {
      createdAt: { $gte: start, $lte: end }
    };

    let groupStage;
    if (timeRange === 'day') {
      groupStage = { $hour: { date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } };
    } else if (timeRange === 'year') {
      groupStage = { $month: { date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } };
    } else {
      groupStage = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } };
    }

    const postsAgg = await RoomPost.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupStage,
          count: { $sum: 1 }
        }
      }
    ]);

    let resultData = [];
    if (timeRange === 'day') {
      const slots = generateDaySlots(start, end);
      postsAgg.forEach(item => {
        const label = `${item._id.toString().padStart(2, '0')}:00`;
        const slot = slots.find(s => s.time === label);
        if (slot) slot.count = item.count;
      });
      resultData = slots.map(({ time, count }) => ({ time, count }));
    } else if (timeRange === 'year') {
      const slots = generateYearSlots(start, end);
      postsAgg.forEach(item => {
        const label = `Tháng ${item._id}`;
        const slot = slots.find(s => s.time === label);
        if (slot) slot.count = item.count;
      });
      resultData = slots.map(({ time, count }) => ({ time, count }));
    } else {
      const slots = timeRange === 'week' ? generateWeekSlots(start, end) : generateMonthSlots(start, end);
      postsAgg.forEach(item => {
        const itemDate = new Date(item._id);
        const slot = slots.find(s => {
          const sDate = new Date(s.rawDate);
          return sDate.getFullYear() === itemDate.getFullYear() &&
                 sDate.getMonth() === itemDate.getMonth() &&
                 sDate.getDate() === itemDate.getDate();
        });
        if (slot) slot.count = item.count;
      });
      resultData = slots.map(({ time, count }) => ({ time, count }));
    }

    return res.status(200).json({
      success: true,
      data: resultData
    });
  } catch (error) {
    console.error('Error in getPostsByTime:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi thống kê tin đăng theo thời gian.'
    });
  }
};

// 5. API Thống kê doanh thu theo thời gian lọc
exports.getRevenue = async (req, res) => {
  try {
    const { timeRange, startDate, endDate } = req.query;
    const { start, end } = getFilterDateRange(timeRange, startDate, endDate);

    const matchStage = {
      transactionType: 'Payment',
      status: 'Success',
      createdAt: { $gte: start, $lte: end }
    };

    let groupStage;
    if (timeRange === 'day') {
      groupStage = { $hour: { date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } };
    } else if (timeRange === 'year') {
      groupStage = { $month: { date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } };
    } else {
      groupStage = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } };
    }

    const revenueAgg = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupStage,
          revenue: { $sum: '$amount' }
        }
      }
    ]);

    let resultData = [];
    if (timeRange === 'day') {
      const slots = generateDaySlots(start, end);
      revenueAgg.forEach(item => {
        const label = `${item._id.toString().padStart(2, '0')}:00`;
        const slot = slots.find(s => s.time === label);
        if (slot) slot.revenue = item.revenue;
      });
      resultData = slots.map(({ time, revenue }) => ({ time, revenue }));
    } else if (timeRange === 'year') {
      const slots = generateYearSlots(start, end);
      revenueAgg.forEach(item => {
        const label = `Tháng ${item._id}`;
        const slot = slots.find(s => s.time === label);
        if (slot) slot.revenue = item.revenue;
      });
      resultData = slots.map(({ time, revenue }) => ({ time, revenue }));
    } else {
      const slots = timeRange === 'week' ? generateWeekSlots(start, end) : generateMonthSlots(start, end);
      revenueAgg.forEach(item => {
        const itemDate = new Date(item._id);
        const slot = slots.find(s => {
          const sDate = new Date(s.rawDate);
          return sDate.getFullYear() === itemDate.getFullYear() &&
                 sDate.getMonth() === itemDate.getMonth() &&
                 sDate.getDate() === itemDate.getDate();
        });
        if (slot) slot.revenue = item.revenue;
      });
      resultData = slots.map(({ time, revenue }) => ({ time, revenue }));
    }

    return res.status(200).json({
      success: true,
      data: resultData
    });
  } catch (error) {
    console.error('Error in getRevenue:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi thống kê doanh thu.'
    });
  }
};

// 6. API Thống kê tin đăng theo khu vực lọc theo thời gian
exports.getPostsByRegion = async (req, res) => {
  try {
    const { timeRange, startDate, endDate } = req.query;
    const { start, end } = getFilterDateRange(timeRange, startDate, endDate);

    const matchStage = {
      province: { $ne: null, $exists: true },
      createdAt: { $gte: start, $lte: end }
    };

    const postsByRegion = await RoomPost.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$province',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: '$count'
        }
      },
      { $sort: { value: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: postsByRegion
    });
  } catch (error) {
    console.error('Error in getPostsByRegion:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy thống kê tin theo khu vực.'
    });
  }
};

// 7. API Xuất báo cáo đa sheets Excel/CSV
exports.exportReport = async (req, res) => {
  try {
    const { timeRange, startDate, endDate, format = 'excel' } = req.query;
    const { start, end } = getFilterDateRange(timeRange, startDate, endDate);

    // Fetch data concurrently
    const [usersCount, posts, transactions] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      RoomPost.find({ createdAt: { $gte: start, $lte: end } })
        .populate('userID', 'fullName email')
        .select('title province district price area status createdAt'),
      Transaction.find({ createdAt: { $gte: start, $lte: end } })
        .populate('userId', 'fullName email')
        .select('amount transactionType status description createdAt')
    ]);

    // Safety check for size to protect server memory
    if (posts.length > 5000 || transactions.length > 5000) {
      return res.status(500).json({
        success: false,
        message: 'Xuất báo cáo thất bại, vui lòng thu hẹp khoảng thời gian'
      });
    }

    // Build Workbook using xlsx
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();

    // Sheet 1: Tổng quan
    const totalRevenue = transactions
      .filter(t => t.status === 'Success' && t.transactionType === 'Payment')
      .reduce((sum, t) => sum + t.amount, 0);

    const overviewData = [
      { 'Chỉ số': 'Thời gian bắt đầu', 'Giá trị': start.toLocaleDateString('vi-VN') },
      { 'Chỉ số': 'Thời gian kết thúc', 'Giá trị': end.toLocaleDateString('vi-VN') },
      { 'Chỉ số': 'Thành viên mới', 'Giá trị': usersCount },
      { 'Chỉ số': 'Tin đăng mới', 'Giá trị': posts.length },
      { 'Chỉ số': 'Bài đang chờ duyệt', 'Giá trị': posts.filter(p => p.status === 'Pending').length },
      { 'Chỉ số': 'Bài đã duyệt', 'Giá trị': posts.filter(p => p.status === 'Approved').length },
      { 'Chỉ số': 'Doanh thu phát sinh (VNĐ)', 'Giá trị': totalRevenue }
    ];
    const wsOverview = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan');

    // Sheet 2: Danh sách tin đăng
    const postsData = posts.map((p, idx) => ({
      'STT': idx + 1,
      'Tiêu đề': p.title,
      'Người đăng': p.userID ? p.userID.fullName : 'Ẩn danh',
      'Email': p.userID ? p.userID.email : 'N/A',
      'Tỉnh/Thành': p.province || 'N/A',
      'Quận/Huyện': p.district || 'N/A',
      'Giá thuê (VNĐ)': p.price,
      'Diện tích (m2)': p.area,
      'Trạng thái': p.status,
      'Ngày tạo': new Date(p.createdAt).toLocaleDateString('vi-VN')
    }));
    const wsPosts = XLSX.utils.json_to_sheet(postsData);
    XLSX.utils.book_append_sheet(wb, wsPosts, 'Danh sách tin đăng');

    // Sheet 3: Lịch sử giao dịch
    const txnsData = transactions.map((t, idx) => ({
      'STT': idx + 1,
      'Thành viên': t.userId ? t.userId.fullName : 'Ẩn danh',
      'Email': t.userId ? t.userId.email : 'N/A',
      'Số tiền': t.amount,
      'Loại giao dịch': t.transactionType === 'Deposit' ? 'Nạp tiền' : 'Thanh toán VIP',
      'Trạng thái': t.status,
      'Mô tả': t.description || 'N/A',
      'Ngày tạo': new Date(t.createdAt).toLocaleDateString('vi-VN')
    }));
    const wsTxns = XLSX.utils.json_to_sheet(txnsData);
    XLSX.utils.book_append_sheet(wb, wsTxns, 'Lịch sử giao dịch');

    if (format === 'csv') {
      const csvContent = XLSX.utils.sheet_to_csv(wsOverview);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=bao_cao_thong_ke.csv');
      return res.status(200).send(Buffer.from('\uFEFF' + csvContent, 'utf-8'));
    } else {
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=bao_cao_thong_ke.xlsx');
      return res.status(200).send(buffer);
    }
  } catch (error) {
    console.error('Error in exportReport:', error);
    return res.status(500).json({
      success: false,
      message: 'Xuất báo cáo thất bại, vui lòng thu hẹp khoảng thời gian'
    });
  }
};
