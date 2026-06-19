const RoomPost = require('../models/RoomPost');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get all pending room posts
exports.getPendingPosts = async (req, res) => {
  try {
    const pendingPosts = await RoomPost.find({ status: 'Pending' })
      .populate('userID', 'fullName email')
      .populate('categoryID', 'categoryName')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: pendingPosts
    });
  } catch (error) {
    console.error('Error in getPendingPosts controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy danh sách tin chờ duyệt.'
    });
  }
};

// Approve a room post
exports.approvePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await RoomPost.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin đăng.'
      });
    }

    post.status = 'Approved';
    const updatedPost = await post.save();

    return res.status(200).json({
      success: true,
      message: 'Phê duyệt tin đăng thành công.',
      data: updatedPost
    });
  } catch (error) {
    console.error('Error in approvePost controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi phê duyệt tin đăng.'
    });
  }
};

// Reject a room post with reason
exports.rejectPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do từ chối.'
      });
    }

    const post = await RoomPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin đăng.'
      });
    }

    post.status = 'Rejected';
    post.rejectionReason = rejectionReason.trim();
    const updatedPost = await post.save();

    return res.status(200).json({
      success: true,
      message: 'Từ chối tin đăng thành công.',
      data: updatedPost
    });
  } catch (error) {
    console.error('Error in rejectPost controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi từ chối tin đăng.'
    });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const [pendingCount, approvedCount, rejectedCount, userCount] = await Promise.all([
      RoomPost.countDocuments({ status: 'Pending' }),
      RoomPost.countDocuments({ status: 'Approved', isHostBlocked: { $ne: true } }),
      RoomPost.countDocuments({ status: 'Rejected' }),
      User.countDocuments({ role: 'User' })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        pendingCount,
        approvedCount,
        rejectedCount,
        userCount
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi tải số liệu thống kê.'
    });
  }
};

// Get all users with pagination and search
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, status, role } = req.query;

    const conditions = [];

    // Search condition
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      conditions.push({
        $or: [
          { fullName: searchRegex },
          { email: searchRegex },
          { phoneNumber: searchRegex }
        ]
      });
    }

    // Status filter
    if (status) {
      if (status === 'Blocked') {
        conditions.push({ isBlocked: true });
      } else if (status === 'Active') {
        conditions.push({ isBlocked: { $ne: true } });
      }
    }

    // Role filter
    if (role && ['User', 'Admin'].includes(role)) {
      conditions.push({ role });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    const [users, total, activeCount, blockedCount, adminCount, totalUsersInDb] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
      User.countDocuments({ isBlocked: { $ne: true } }),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({ role: 'Admin' }),
      User.countDocuments({})
    ]);

    return res.status(200).json({
      success: true,
      data: users,
      stats: {
        totalUsers: totalUsersInDb,
        activeUsers: activeCount,
        blockedUsers: blockedCount,
        adminUsers: adminCount
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getAllUsers controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy danh sách người dùng.'
    });
  }
};

// Toggle lock/unlock user account
exports.toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentAdminId = req.user._id;

    // Check self block
    if (id.toString() === currentAdminId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tự khóa tài khoản của chính mình.'
      });
    }

    const userToBlock = await User.findById(id);
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người dùng.'
      });
    }

    // Prevent blocking administrators
    if (userToBlock.role === 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Không thể khóa tài khoản quản trị viên.'
      });
    }

    // Toggle block status
    userToBlock.isBlocked = !userToBlock.isBlocked;
    userToBlock.status = userToBlock.isBlocked ? 'Khóa' : 'Hoạt động';
    await userToBlock.save();

    // Data Cascade: update room posts isHostBlocked status
    await RoomPost.updateMany(
      { userID: id },
      { isHostBlocked: userToBlock.isBlocked }
    );

    // Emit force-logout event via socket.io if user is blocked
    if (userToBlock.isBlocked) {
      const io = req.app.get('socketio');
      if (io) {
        io.emit('force-logout', { userID: id });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${userToBlock.isBlocked ? 'Khóa' : 'Mở khóa'} tài khoản thành công.`,
      data: {
        id: userToBlock._id,
        fullName: userToBlock.fullName,
        isBlocked: userToBlock.isBlocked,
        status: userToBlock.status
      }
    });
  } catch (error) {
    console.error('Error in toggleBlockUser controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi thay đổi trạng thái tài khoản.'
    });
  }
};

// Get all transactions for Admin
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userID', 'fullName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error in getAllTransactions controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy danh sách giao dịch.'
    });
  }
};

// Update transaction adminNote
exports.updateTransactionNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch.'
      });
    }

    transaction.adminNote = adminNote;
    await transaction.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật ghi chú giao dịch thành công.',
      data: transaction
    });
  } catch (error) {
    console.error('Error in updateTransactionNote controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi cập nhật ghi chú giao dịch.'
    });
  }
};


