const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập. Chỉ dành cho quản trị viên.'
    });
  }
  next();
};

module.exports = verifyAdmin;
