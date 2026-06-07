const User = require('../models/User');

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
