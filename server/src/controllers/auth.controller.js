const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register User
exports.register = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;

    // Simple validation
    if (!fullName || !email || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: họ tên, email, số điện thoại và mật khẩu'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng bởi một tài khoản khác'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword
    });

    const savedUser = await newUser.save();

    // Create copy without password to return
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: userResponse
    });
  } catch (error) {
    console.error('Error in register controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi trong quá trình đăng ký'
    });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và mật khẩu'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản email hoặc mật khẩu không chính xác'
      });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản email hoặc mật khẩu không chính xác'
      });
    }

    // Check if blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
      });
    }

    // Create JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'freemium_room_secret_key_2026_safe_and_secure';
    const token = jwt.sign(
      { id: user._id, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Prepare user response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Error in login controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi trong quá trình đăng nhập'
    });
  }
};

// Seed Admin User (run-once)
exports.seedAdmin = async (req, res) => {
  try {
    // Migrate 'admin@gmail.com' record back to 'admin' if it exists
    await User.updateOne({ email: 'admin@gmail.com' }, { email: 'admin' });

    const adminEmail = 'admin';
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      return res.status(200).json({
        success: true,
        message: 'Tài khoản admin đã tồn tại',
        data: {
          id: adminExists._id,
          email: adminExists.email,
          fullName: adminExists.fullName,
          role: adminExists.role
        }
      });
    }

    const password = req.body.password || 'admin';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const adminUser = new User({
      fullName: 'Quản trị viên',
      email: adminEmail,
      phoneNumber: '0123456789', // required field in User model
      password: hashedPassword,
      role: 'Admin'
    });

    const savedAdmin = await adminUser.save();
    const adminResponse = savedAdmin.toObject();
    delete adminResponse.password;

    return res.status(201).json({
      success: true,
      message: 'Khởi tạo tài khoản Admin gốc thành công',
      data: adminResponse
    });
  } catch (error) {
    console.error('Error in seedAdmin controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi khởi tạo Admin'
    });
  }
};

