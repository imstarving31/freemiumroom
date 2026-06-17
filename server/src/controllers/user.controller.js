const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.toggleFavorite = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const isFavorite = user.favoritePosts.includes(postId);
    let message = '';
    let updatedFavoritePosts = [];

    if (isFavorite) {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { favoritePosts: postId } },
        { new: true }
      ).select('favoritePosts');
      updatedFavoritePosts = updatedUser.favoritePosts;
      message = 'Đã bỏ lưu tin';
    } else {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { favoritePosts: postId } },
        { new: true }
      ).select('favoritePosts');
      updatedFavoritePosts = updatedUser.favoritePosts;
      message = 'Đã lưu tin thành công';
    }

    return res.status(200).json({
      success: true,
      message,
      favoritePosts: updatedFavoritePosts
    });
  } catch (error) {
    console.error('Error in toggleFavorite:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi xử lý lưu tin'
    });
  }
};

exports.getFavoritePosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate({
      path: 'favoritePosts',
      match: { isHostBlocked: { $ne: true } }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Filter out null posts (in case any favorited posts were deleted or blocked)
    const favoritePosts = (user.favoritePosts || []).filter(post => post !== null);

    return res.status(200).json({
      success: true,
      data: favoritePosts
    });
  } catch (error) {
    console.error('Error in getFavoritePosts:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy danh sách tin yêu thích'
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy thông tin cá nhân'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber } = req.body;
    const userId = req.user.id;

    if (!fullName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Họ tên và số điện thoại là bắt buộc'
      });
    }

    const phoneClean = phoneNumber.trim();
    if (!/^\d{9,11}$/.test(phoneClean)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại phải là số và có độ dài từ 9 đến 11 ký tự'
      });
    }

    // Check if another user is already using this phone number
    const phoneExists = await User.findOne({ phoneNumber: phoneClean, _id: { $ne: userId } });
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại này đã được sử dụng bởi một tài khoản khác'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullName, phoneNumber: phoneClean },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin tài khoản thành công',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi cập nhật thông tin cá nhân'
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu cũ và mật khẩu mới là bắt buộc'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có độ dài ít nhất 6 ký tự'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Error in changePassword:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi thay đổi mật khẩu'
    });
  }
};

exports.deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mật khẩu để xác thực hành động này'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu xác thực không chính xác'
      });
    }

    user.status = 'Inactive';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Vô hiệu hóa tài khoản thành công. Bạn sẽ bị đăng xuất.'
    });
  } catch (error) {
    console.error('Error in deactivateAccount:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi vô hiệu hóa tài khoản'
    });
  }
};
