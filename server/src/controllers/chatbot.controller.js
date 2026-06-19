const { GoogleGenerativeAI } = require('@google/generative-ai');
const FAQ = require('../models/FAQ');
const RoomPost = require('../models/RoomPost');
const ChatSession = require('../models/ChatSession');

/**
 * Controller to handle AI Chatbot interactions using Retrieval-Augmented Generation (RAG)
 *
 * Model: gemini-2.5-flash (free tier)
 * Free tier limits: 5 RPM, 250K TPM, 20 RPD
 */

// --- Singleton Gemini client (reuse across requests) ---
let genAI = null;
let model = null;

function getModel() {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction:
        `Bạn là nhân viên tư vấn phòng trọ thân thiện.
Dưới đây là dữ liệu thực tế từ hệ thống của chúng tôi. Hãy DỰA VÀO DỮ LIỆU NÀY để trả lời người dùng.
Tuyệt đối không tự bịa giá cả hoặc địa chỉ. Nếu không có dữ liệu khớp, hãy báo là chưa tìm thấy thông tin.
Khi giới thiệu bất kỳ phòng trọ nào, hãy luôn kèm theo đường link chi tiết ở dạng Markdown để người dùng bấm vào xem: [Xem chi tiết](/room/<ID bài đăng>).`
    });
  }
  return model;
}

/**
 * Helper: Call Gemini with retry + exponential backoff for 429 rate limits
 */
async function generateWithRetry(prompt, maxRetries = 3) {
  const geminiModel = getModel();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await geminiModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      const status = error?.status || error?.httpStatusCode || error?.code;
      const isRateLimit = status === 429 || (error.message && error.message.includes('429'));
      const isServerError = status === 503;

      if ((isRateLimit || isServerError) && attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const waitMs = Math.pow(2, attempt + 1) * 1000;
        console.warn(
          `[Chatbot] Rate limited (${status}). Retrying in ${waitMs / 1000}s... (attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      } else {
        throw error;
      }
    }
  }
}

exports.handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({
        success: false,
        reply: 'Vui lòng nhập tin nhắn.'
      });
    }

    // Try to parse optional user token to associate chat session with userId
    if (!req.user && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'freemium_room_secret_key_2026_safe_and_secure';
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, jwtSecret);
        const User = require('../models/User');
        req.user = await User.findById(decoded.id);
      } catch (err) {
        // Suppress validation error for guests
      }
    }

    // 1. Validate API Key
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not defined in environment variables.');
      return res.status(500).json({
        success: false,
        reply: 'Xin lỗi, hệ thống AI chưa được cấu hình. Vui lòng thử lại sau!'
      });
    }

    // 2. Retrieval (RAG) - Fetch internal data from MongoDB
    // Retrieve all FAQ records (up to 100) so Gemini can perform semantic matching
    const faqResults = await FAQ.find({}).limit(100);

    // --- Smart Room Search ---
    const indicatesDemand = /thuê|phòng|giá|tìm|khu vực|cho thuê|trọ|ở|quận|huyện|tỉnh|thành phố/i.test(message);
    let roomPostResults = [];

    if (indicatesDemand) {
      // Build a smart filter from the user's message
      const filter = {
        status: 'Approved',
        isAvailable: true,
        isHostBlocked: { $ne: true }
      };

      // Extract location keywords dynamically from the database to match user messages
      const baseLocations = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
      const provincesInDb = await RoomPost.distinct('province', { status: 'Approved' });
      const locationKeywords = [...new Set([...baseLocations, ...provincesInDb])].filter(Boolean);

      const cleanKeyword = (name) => {
        return name ? name.replace(/^(tỉnh|thành phố|phường|xã|quận|huyện)\s+/i, '').trim() : '';
      };

      const matchedLocations = locationKeywords.filter((loc) => {
        const cleanLoc = cleanKeyword(loc);
        return (
          message.toLowerCase().includes(loc.toLowerCase()) ||
          (cleanLoc && message.toLowerCase().includes(cleanLoc.toLowerCase()))
        );
      });

      if (matchedLocations.length > 0) {
        // Search across province and address fields
        filter.$or = matchedLocations.map((loc) => {
          const cleanLoc = cleanKeyword(loc);
          return {
            $or: [
              { province: { $regex: loc, $options: 'i' } },
              { address: { $regex: loc, $options: 'i' } },
              ...(cleanLoc ? [
                { province: { $regex: cleanLoc, $options: 'i' } },
                { address: { $regex: cleanLoc, $options: 'i' } }
              ] : [])
            ]
          };
        });
      }

      // Extract price hints from message
      const priceMatch = message.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tr)/i);
      if (priceMatch) {
        const priceValue = parseFloat(priceMatch[1].replace(',', '.')) * 1_000_000;
        // If user says "dưới 3 triệu" or "< 3 triệu"
        if (/dưới|<|thấp hơn|rẻ hơn|không quá|tối đa/i.test(message)) {
          filter.price = { $lte: priceValue };
        } else if (/trên|>|cao hơn|từ/i.test(message)) {
          filter.price = { $gte: priceValue };
        } else {
          // Around that price (±30%)
          filter.price = { $gte: priceValue * 0.7, $lte: priceValue * 1.3 };
        }
      }

      roomPostResults = await RoomPost.find(filter)
        .select('_id title address province price area description utilities contactPhone')
        .sort({ createdAt: -1 })
        .limit(10);
    }

    // 3. Build Context String for Gemini
    let context = 'DỮ LIỆU THỰC TẾ TỪ HỆ THỐNG:\n\n';

    if (faqResults.length > 0) {
      context += '--- CÂU HỎI THƯỜNG GẶP (FAQ) ---\n';
      faqResults.forEach((faq, index) => {
        context += `${index + 1}. Câu hỏi: ${faq.question}\n   Trả lời: ${faq.answer}\n\n`;
      });
    }

    if (roomPostResults.length > 0) {
      context += `--- DANH SÁCH PHÒNG TRỌ ĐANG CHO THUÊ (${roomPostResults.length} kết quả) ---\n`;
      roomPostResults.forEach((room, index) => {
        const priceFormatted = room.price ? room.price.toLocaleString('vi-VN') : 'N/A';
        const utilities = room.utilities && room.utilities.length > 0
          ? room.utilities.join(', ')
          : 'Không có thông tin';
        const desc = room.description
          ? room.description.substring(0, 150)
          : 'Không có mô tả';
        context += `${index + 1}. ID bài đăng: ${room._id}\n   Tiêu đề: ${room.title}\n   Địa chỉ: ${room.address}\n   Giá thuê: ${priceFormatted} đ/tháng\n   Diện tích: ${room.area} m²\n   Tiện ích: ${utilities}\n   Mô tả: ${desc}\n   Liên hệ: ${room.contactPhone || 'N/A'}\n\n`;
      });
    }

    if (faqResults.length === 0 && roomPostResults.length === 0) {
      context += 'Không tìm thấy dữ liệu phù hợp nào trong hệ thống.\n';
    }

    // Combine Context with User Message
    const prompt = `Dữ liệu ngữ cảnh hệ thống:\n${context}\n\nYêu cầu của người dùng: "${message}"`;

    // 4. Generate Response using Gemini API (with retry for rate limits)
    const reply = await generateWithRetry(prompt);

    // Save history to Database
    await ChatSession.create({
      userID: req.user ? req.user._id : null,
      userMessage: message,
      botReply: reply
    });

    return res.status(200).json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error('Error in handleChat controller:', error);

    // Provide specific error message for rate limiting
    const status = error?.status || error?.httpStatusCode || error?.code;
    if (status === 429 || (error.message && error.message.includes('429'))) {
      return res.status(429).json({
        success: false,
        reply: 'Hệ thống AI đang quá tải. Vui lòng đợi 1-2 phút rồi thử lại!'
      });
    }

    return res.status(500).json({
      success: false,
      reply: 'Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau!'
    });
  }
};
