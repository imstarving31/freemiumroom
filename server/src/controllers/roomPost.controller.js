const RoomPost = require('../models/RoomPost');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

exports.createPost = async (req, res) => {
  try {
    const userID = req.user.id; // Lấy userID từ verifyToken middleware
    const {
      categoryID,
      categoryId,
      title,
      address,
      province,
      district,
      ward,
      exactAddress,
      price,
      area,
      contactName,
      contactPhone,
      description,
      postType,
      status,
      rejectionReason
    } = req.body;

    // Helper to parse array fields from FormData
    const getArrayFromField = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { }
      // Filter out empty strings
      return [val].filter(item => typeof item === 'string' && item.trim().length > 0);
    };

    // Extract utility list
    let utilityArray = [];
    if (req.body.utilities) {
      utilityArray = getArrayFromField(req.body.utilities);
    } else if (req.body['utilities[]']) {
      utilityArray = getArrayFromField(req.body['utilities[]']);
    }

    // Extract manual image URLs
    let textImageUrls = [];
    if (req.body.imageUrls) {
      textImageUrls = getArrayFromField(req.body.imageUrls);
    } else if (req.body['imageUrls[]']) {
      textImageUrls = getArrayFromField(req.body['imageUrls[]']);
    }

    // Extract uploaded files from Cloudinary
    const fileUrls = req.files ? req.files.map(file => file.path || file.secure_url) : [];

    // Merge both image lists
    const mergedImages = [...textImageUrls, ...fileUrls].filter(url => typeof url === 'string' && url.trim().length > 0);

    // Helper to parse ObjectId, returning null or mock if empty/invalid
    const parseObjectId = (id) => {
      if (id && mongoose.Types.ObjectId.isValid(id)) {
        return new mongoose.Types.ObjectId(id);
      }
      return null;
    };

    const cleanPrice = price ? Number(price.toString().replace(/\D/g, '')) : undefined;

    const newPost = new RoomPost({
      userID: parseObjectId(userID),
      categoryID: parseObjectId(categoryId || categoryID),
      categoryId: parseObjectId(categoryId || categoryID),
      title,
      address,
      province,
      district,
      ward,
      exactAddress,
      price: cleanPrice,
      area: area ? Number(area) : undefined,
      contactName,
      contactPhone,
      description,
      images: mergedImages,
      utilities: utilityArray,
      postType: postType || 'Tin thường',
      status: 'Pending',
      rejectionReason: rejectionReason || ''
    });

    const VIP_PRICE = 20000;
    let savedPost;

    if (newPost.postType === 'Tin VIP') {
      const user = await User.findById(userID);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin người dùng'
        });
      }

      if (user.balance < VIP_PRICE) {
        return res.status(400).json({
          success: false,
          message: 'Số dư không đủ để thực hiện giao dịch'
        });
      }

      const results = await Promise.all([
        User.findByIdAndUpdate(userID, { $inc: { balance: -VIP_PRICE } }),
        Transaction.create({
          userId: userID,
          amount: VIP_PRICE,
          transactionType: 'Payment',
          status: 'Success',
          description: 'Thanh toán đăng tin VIP'
        }),
        newPost.save()
      ]);
      savedPost = results[2];
    } else {
      savedPost = await newPost.save();
    }

    // Phát tín hiệu thông báo cho Admin qua Socket.io
    const io = req.app.get('socketio');
    if (io && savedPost.status === 'Pending') {
      const user = await User.findById(userID);
      const userName = user ? user.fullName : 'Thành viên';
      const rawTitle = title || '';
      const shortTitle = rawTitle.length > 35 ? `${rawTitle.substring(0, 35)}...` : rawTitle;
      io.emit('admin_notification', {
        type: 'POST',
        message: `User ${userName} vừa đăng phòng: ${shortTitle} chờ duyệt.`,
        countType: 'pendingPosts'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Đăng tin thành công',
      data: savedPost
    });
  } catch (error) {
    console.error('Error in createPost controller:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi đăng tin'
    });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const { 
      searchTerm, 
      minPrice, 
      maxPrice, 
      minArea, 
      maxArea, 
      district, 
      utilities, 
      postType,
      categoryId,
      province,
      ward,
      keyword
    } = req.query;
    
    let query = {};
    const conditions = [];

    // Search term (title hoặc address)
    if (searchTerm) {
      conditions.push({
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { address: { $regex: searchTerm, $options: 'i' } }
        ]
      });
    }

    // Keyword search (quét title, address, description)
    if (keyword) {
      conditions.push({
        $or: [
          { title: { $regex: keyword, $options: 'i' } }, 
          { address: { $regex: keyword, $options: 'i' } }, 
          { description: { $regex: keyword, $options: 'i' } }
        ]
      });
    }

    // Category Filter (matches either categoryId or categoryID field)
    if (categoryId) {
      conditions.push({
        $or: [
          { categoryId: categoryId },
          { categoryID: categoryId }
        ]
      });
    }

    // Address Filters (province, district, ward)
    if (province) {
      conditions.push({ address: { $regex: province, $options: 'i' } });
    }
    if (district) {
      conditions.push({ address: { $regex: district, $options: 'i' } });
    }
    if (ward) {
      conditions.push({ address: { $regex: ward, $options: 'i' } });
    }

    // Price range
    if (minPrice || maxPrice) {
      const priceQuery = {};
      if (minPrice) priceQuery.$gte = Number(minPrice);
      if (maxPrice) priceQuery.$lte = Number(maxPrice);
      conditions.push({ price: priceQuery });
    }

    // Area range
    if (minArea || maxArea) {
      const areaQuery = {};
      if (minArea) areaQuery.$gte = Number(minArea);
      if (maxArea) areaQuery.$lte = Number(maxArea);
      conditions.push({ area: areaQuery });
    }

    // Utilities (chuỗi phân cách bằng dấu phẩy)
    if (utilities) {
      const utilsList = utilities.split(',').map(u => u.trim()).filter(Boolean);
      if (utilsList.length > 0) {
        conditions.push({ utilities: { $all: utilsList } });
      }
    }

    // Post Type filter
    if (postType) {
      conditions.push({ postType });
    }

    // Only return approved and available room posts on public listing
    conditions.push({ status: 'Approved' });
    conditions.push({ isAvailable: true });
    conditions.push({ isHostBlocked: { $ne: true } });

    // Assemble query object using $and to avoid conflicts with multiple $or operations
    if (conditions.length > 0) {
      query = { $and: conditions };
    }

    // Query and sort: Tin VIP (postType === 'Tin VIP') lên đầu, sau đó mới đến createdAt mới nhất.
    const posts = await RoomPost.find(query)
      .populate('categoryId', 'categoryName')
      .populate('categoryID', 'categoryName')
      .populate('userID', 'fullName avatar phoneNumber')
      .sort({ postType: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error in getAllPosts controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy danh sách bài đăng'
    });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã phòng trọ không hợp lệ.'
      });
    }

    const post = await RoomPost.findById(id)
      .populate('userID', 'fullName avatar phoneNumber')
      .populate('categoryId', 'categoryName')
      .populate('categoryID', 'categoryName');
    if (!post || post.isHostBlocked) {
      return res.status(404).json({
        success: false,
        message: 'Bài đăng không tồn tại hoặc đã bị ẩn do vi phạm.'
      });
    }

    return res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error in getPostById controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi tải thông tin phòng trọ.'
    });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const userID = req.user.id;
    const posts = await RoomPost.find({ userID })
      .populate('categoryId', 'categoryName')
      .populate('categoryID', 'categoryName')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error in getMyPosts controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy danh sách tin đăng của bạn.'
    });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const userID = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã phòng trọ không hợp lệ.'
      });
    }

    const post = await RoomPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin phòng trọ.'
      });
    }

    if (post.userID.toString() !== userID) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa trạng thái tin đăng này.'
      });
    }

    post.isAvailable = !post.isAvailable;
    const updatedPost = await post.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái phòng thành công.',
      data: updatedPost
    });
  } catch (error) {
    console.error('Error in toggleAvailability controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi cập nhật trạng thái.'
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userID = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã phòng trọ không hợp lệ.'
      });
    }

    const post = await RoomPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin phòng trọ.'
      });
    }

    if (post.userID.toString() !== userID) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa tin đăng này.'
      });
    }

    await RoomPost.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Xóa tin đăng thành công.'
    });
  } catch (error) {
    console.error('Error in deletePost controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi xóa tin đăng.'
    });
  }
};
