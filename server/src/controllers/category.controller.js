const Category = require('../models/Category');
const RoomPost = require('../models/RoomPost');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    let categories = await Category.find().sort({ createdAt: 1 });

    // Seed default categories if empty
    if (categories.length === 0) {
      const defaultCategories = [
        // Loại phòng
        { categoryName: 'Phòng trọ, nhà trọ', categoryType: 'Loại phòng' },
        { categoryName: 'Nhà thuê nguyên căn', categoryType: 'Loại phòng' },
        { categoryName: 'Cho thuê căn hộ', categoryType: 'Loại phòng' },
        { categoryName: 'Chung cư mini', categoryType: 'Loại phòng' },
        { categoryName: 'Tìm người ở ghép', categoryType: 'Loại phòng' },
        { categoryName: 'Cho thuê mặt bằng', categoryType: 'Loại phòng' },
        // Tiện ích
        { categoryName: 'Wifi', categoryType: 'Tiện ích' },
        { categoryName: 'Điều hòa', categoryType: 'Tiện ích' },
        { categoryName: 'Máy giặt', categoryType: 'Tiện ích' },
        { categoryName: 'Tủ lạnh', categoryType: 'Tiện ích' },
        { categoryName: 'Nóng lạnh', categoryType: 'Tiện ích' },
        { categoryName: 'Bãi đỗ xe', categoryType: 'Tiện ích' },
        { categoryName: 'Tự do đi lại', categoryType: 'Tiện ích' },
        { categoryName: 'Gác lửng', categoryType: 'Tiện ích' },
        { categoryName: 'Khép kín', categoryType: 'Tiện ích' },
        { categoryName: 'Tủ quần áo', categoryType: 'Tiện ích' }
      ];

      await Category.insertMany(defaultCategories);
      categories = await Category.find().sort({ createdAt: 1 });
      console.log('Successfully seeded default categories into database.');
    }

    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy danh mục.'
    });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { categoryName, categoryType } = req.body;

    if (!categoryName || !categoryName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục là bắt buộc.'
      });
    }

    if (!categoryType || !['Loại phòng', 'Khu vực', 'Tiện ích'].includes(categoryType)) {
      return res.status(400).json({
        success: false,
        message: 'Loại danh mục không hợp lệ.'
      });
    }

    const newCategory = new Category({
      categoryName: categoryName.trim(),
      categoryType
    });

    const savedCategory = await newCategory.save();
    return res.status(201).json({
      success: true,
      message: 'Thêm danh mục mới thành công.',
      data: savedCategory
    });
  } catch (error) {
    console.error('Error in createCategory controller:', error);
    // Catch unique constraint conflict (code 11000)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục này đã tồn tại, vui lòng chọn tên khác'
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi tạo danh mục.'
    });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, categoryType } = req.body;

    if (!categoryName || !categoryName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục là bắt buộc.'
      });
    }

    if (!categoryType || !['Loại phòng', 'Tiện ích'].includes(categoryType)) {
      return res.status(400).json({
        success: false,
        message: 'Loại danh mục không hợp lệ.'
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        categoryName: categoryName.trim(),
        categoryType
      },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công.',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error in updateCategory controller:', error);
    // Catch unique constraint conflict (code 11000)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục này đã tồn tại, vui lòng chọn tên khác'
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi cập nhật danh mục.'
    });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are any room posts utilizing this category
    const postCount = await RoomPost.countDocuments({ categoryID: id });

    if (postCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa danh mục đang có tin đăng sử dụng. Vui lòng gỡ danh mục khỏi các tin đăng trước'
      });
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục để xóa.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Xóa danh mục thành công.'
    });
  } catch (error) {
    console.error('Error in deleteCategory controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi xóa danh mục.'
    });
  }
};
