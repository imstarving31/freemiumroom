const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Không có quyền truy cập. Vui lòng cung cấp token xác thực.'
    });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'freemium_room_secret_key_2026_safe_and_secure';

  jwt.verify(token, jwtSecret, async (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn.'
      });
    }

    try {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản người dùng không tồn tại.'
        });
      }

      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
        });
      }

      req.user = user;
      next();
    } catch (dbErr) {
      console.error('Error in verifyToken middleware:', dbErr);
      return res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi xác thực tài khoản.'
      });
    }
  });
};

module.exports = verifyToken;
