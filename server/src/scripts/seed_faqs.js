require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const FAQ = require('../models/FAQ');
const connectDB = require('../config/db');

const seed = async () => {
  try {
    await connectDB();

    // Clear existing FAQs
    await FAQ.deleteMany({});
    console.log('Cleared existing FAQs');

    const initialFAQs = [
      {
        question: 'Làm thế nào để đăng tin phòng trọ?',
        answer: 'Để đăng tin phòng trọ, bạn vui lòng đăng nhập, chọn mục "Đăng tin" trên thanh menu chính. Sau đó điền các thông tin cần thiết như tiêu đề, giá cả, diện tích, hình ảnh và địa chỉ chi tiết rồi bấm gửi. Tin của bạn sẽ được chuyển đến Admin kiểm duyệt.'
      },
      {
        question: 'Phí nâng cấp tin đăng VIP là bao nhiêu?',
        answer: 'Chi phí nâng cấp một bài đăng thông thường lên tin VIP là **20.000 VNĐ**. Tin VIP sẽ được hiển thị nổi bật ở trang chủ và trên các kết quả tìm kiếm giúp bạn tiếp cận nhiều khách hàng hơn.'
      },
      {
        question: 'Làm sao để liên hệ hỗ trợ kỹ thuật?',
        answer: 'Bạn có thể liên hệ bộ phận hỗ trợ kỹ thuật của FreemiumRoom trực tiếp qua email: **2iamduy@gmail.com** hoặc gọi số hotline **0392 158 141** để được xử lý nhanh nhất.'
      }
    ];

    await FAQ.insertMany(initialFAQs);
    console.log('Seeded 3 FAQs successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding FAQs:', error);
    process.exit(1);
  }
};

seed();
