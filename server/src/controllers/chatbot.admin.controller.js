const FAQ = require('../models/FAQ');
const ChatSession = require('../models/ChatSession');

// ==========================================
// FAQ CRUD CONTROLLERS
// ==========================================

// 1. Get FAQs with pagination and search
exports.getFAQs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = {};
    if (search) {
      query.question = { $regex: search, $options: 'i' };
    }

    const total = await FAQ.countDocuments(query);
    const faqs = await FAQ.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: faqs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getFAQs admin controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách câu hỏi FAQ.'
    });
  }
};

// 2. Create new FAQ
exports.createFAQ = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !question.trim() || !answer || !answer.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ câu hỏi và câu trả lời để Chatbot có cơ sở dữ liệu tư vấn'
      });
    }

    const newFaq = new FAQ({
      question: question.trim(),
      answer: answer.trim()
    });

    await newFaq.save();

    return res.status(201).json({
      success: true,
      message: 'Thêm mới câu hỏi FAQ thành công.',
      data: newFaq
    });
  } catch (error) {
    console.error('Error in createFAQ admin controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm mới câu hỏi FAQ.'
    });
  }
};

// 3. Update FAQ
exports.updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;

    if (!question || !question.trim() || !answer || !answer.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ câu hỏi và câu trả lời để Chatbot có cơ sở dữ liệu tư vấn'
      });
    }

    const updatedFaq = await FAQ.findByIdAndUpdate(
      id,
      {
        question: question.trim(),
        answer: answer.trim()
      },
      { new: true, runValidators: true }
    );

    if (!updatedFaq) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi FAQ cần chỉnh sửa.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật câu hỏi FAQ thành công.',
      data: updatedFaq
    });
  } catch (error) {
    console.error('Error in updateFAQ admin controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi chỉnh sửa câu hỏi FAQ.'
    });
  }
};

// 4. Delete FAQ
exports.deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFaq = await FAQ.findByIdAndDelete(id);

    if (!deletedFaq) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi FAQ cần xóa.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Xóa câu hỏi FAQ thành công.'
    });
  } catch (error) {
    console.error('Error in deleteFAQ admin controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa câu hỏi FAQ.'
    });
  }
};

// ==========================================
// CHAT SESSION CONTROLLER
// ==========================================

// 5. Get Chat Sessions with pagination and userId populate
exports.getChatSessions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const total = await ChatSession.countDocuments();
    const sessions = await ChatSession.find()
      .populate('userID', 'fullName email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getChatSessions admin controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách lịch sử trò chuyện.'
    });
  }
};
