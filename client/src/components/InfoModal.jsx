import React from 'react';
import { X, Mail, Phone, Clock, MessageSquare, Info, Shield, FileText } from 'lucide-react';
import './InfoModal.css';

export default function InfoModal({ isOpen, onClose, type }) {
  if (!isOpen) return null;

  const handleOpenChatbot = () => {
    // Close the current info modal
    onClose();
    // Dispatch custom event to open ChatbotBubble
    window.dispatchEvent(new Event('open-chatbot'));
  };

  const renderContent = () => {
    switch (type) {
      case 'about':
        return (
          <>
            <div className="info-modal-icon-header about-icon">
              <Info size={40} />
            </div>
            <h3 className="info-modal-title">Về Chúng Tôi</h3>
            <div className="info-modal-body-content">
              <p className="info-highlight-text">
                <strong>FreemiumRoom</strong> - Nền tảng kết nối người thuê và cho thuê phòng trọ hàng đầu Việt Nam.
              </p>
              <div className="info-card-text">
                <h5>Sứ mệnh của chúng tôi</h5>
                <p>
                  Chúng tôi ra đời nhằm mang lại giải pháp tìm kiếm chỗ ở lý tưởng, đơn giản, minh bạch và an toàn. Bằng việc tích hợp các công nghệ thông minh và Trợ lý ảo AI tư vấn 24/7, FreemiumRoom rút ngắn khoảng cách giữa chủ nhà và người thuê trọ.
                </p>
              </div>
              <div className="info-features-list">
                <h5>Các tính năng nổi bật</h5>
                <ul>
                  <li>
                    <span className="feat-bullet">🔍</span>
                    <div>
                      <strong>Bộ lọc thông minh:</strong> Lọc chi tiết theo tỉnh thành, quận huyện, phường xã, tiện ích, khoảng giá và diện tích.
                    </div>
                  </li>
                  <li>
                    <span className="feat-bullet">🤖</span>
                    <div>
                      <strong>Trợ lý ảo AI:</strong> Trò chuyện thông minh hỗ trợ trả lời mọi câu hỏi về tin đăng, phí dịch vụ và kỹ thuật.
                    </div>
                  </li>
                  <li>
                    <span className="feat-bullet">💎</span>
                    <div>
                      <strong>Tin đăng VIP:</strong> Hệ thống đẩy tin VIP lên đầu danh sách giúp chủ nhà tiếp cận khách hàng tiềm năng nhanh gấp 5 lần.
                    </div>
                  </li>
                  <li>
                    <span className="feat-bullet">🛡️</span>
                    <div>
                      <strong>Thông tin xác thực:</strong> Đội ngũ quản trị viên phê duyệt kỹ lưỡng để hạn chế tối đa các tin đăng giả hoặc lừa đảo.
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </>
        );
      case 'privacy':
        return (
          <>
            <div className="info-modal-icon-header privacy-icon">
              <Shield size={40} />
            </div>
            <h3 className="info-modal-title">Chính Sách Bảo Mật</h3>
            <div className="info-modal-body-content">
              <p className="info-intro-p">
                Chào mừng bạn đến với FreemiumRoom. Sự riêng tư và an toàn thông tin của người dùng là ưu tiên hàng đầu của chúng tôi.
              </p>
              
              <div className="privacy-section">
                <h5>1. Thu thập thông tin cá nhân</h5>
                <p>
                  Khi đăng ký tài khoản trên FreemiumRoom, chúng tôi thu thập các thông tin bao gồm: Họ tên, Số điện thoại, Email và Mật khẩu (đã được mã hóa). Thông tin này chỉ được sử dụng cho mục đích xác minh danh tính và hỗ trợ liên hệ liên quan đến tin đăng phòng trọ.
                </p>
              </div>

              <div className="privacy-section">
                <h5>2. Cam kết bảo mật dữ liệu</h5>
                <p>
                  Chúng tôi áp dụng các tiêu chuẩn mã hóa dữ liệu nghiêm ngặt để bảo mật tài khoản người dùng. FreemiumRoom cam kết không bán, trao đổi hoặc tiết lộ thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào khi chưa có sự đồng ý của bạn, trừ trường hợp có yêu cầu bằng văn bản từ cơ quan pháp luật.
                </p>
              </div>

              <div className="privacy-section">
                <h5>3. Bảo mật giao dịch Ví điện tử</h5>
                <p>
                  Mọi thông tin liên quan đến số dư ví, nạp tiền và các giao dịch trừ phí dịch vụ nâng cấp tin VIP đều được hệ thống mã hóa và lưu trữ an toàn, đảm bảo tính minh bạch và tránh sai sót số liệu tài chính.
                </p>
              </div>
            </div>
          </>
        );
      case 'terms':
        return (
          <>
            <div className="info-modal-icon-header terms-icon">
              <FileText size={40} />
            </div>
            <h3 className="info-modal-title">Điều Khoản Sử Dụng</h3>
            <div className="info-modal-body-content">
              <p className="info-intro-p">
                Khi sử dụng dịch vụ của FreemiumRoom, bạn đồng ý tuân thủ các điều khoản và quy định sử dụng dưới đây.
              </p>

              <div className="terms-section">
                <h5>1. Quy định về tài khoản và đăng tin</h5>
                <p>
                  Thành viên đăng tin phải chịu hoàn toàn trách nhiệm về tính trung thực của thông tin phòng trọ (vị trí, giá cả, diện tích và hình ảnh). Tuyệt đối không đăng hình ảnh ảo, thông tin sai lệch nhằm dụ dỗ khách hàng hoặc lừa tiền đặt cọc.
                </p>
              </div>

              <div className="terms-section">
                <h5>2. Hành vi bị nghiêm cấm</h5>
                <p>
                  Nghiêm cấm đăng tin spam trùng lặp nhiều lần, đăng tin chứa nội dung xúc phạm, đồi trụy hoặc vi phạm pháp luật Việt Nam. Nghiêm cấm các tài khoản lợi dụng chatbot hoặc hệ thống để quấy phá, thực hiện tấn công mạng.
                </p>
              </div>

              <div className="terms-section">
                <h5>3. Quyền hạn của Ban quản trị</h5>
                <p>
                  FreemiumRoom có toàn quyền từ chối phê duyệt, khóa hoặc xóa vĩnh viễn các bài đăng vi phạm chính sách của chúng tôi mà không cần thông báo trước. Các tài khoản vi phạm nghiêm trọng sẽ bị khóa vĩnh viễn và không được hoàn trả số dư trong ví.
                </p>
              </div>
            </div>
          </>
        );
      case 'support':
        return (
          <>
            <div className="info-modal-icon-header support-icon">
              <Mail size={40} />
            </div>
            <h3 className="info-modal-title">Hỗ Trợ Kỹ Thuật</h3>
            <div className="info-modal-body-content">
              <p className="info-intro-p">
                Hệ thống hỗ trợ kỹ thuật của FreemiumRoom luôn sẵn sàng trợ giúp bạn giải quyết các thắc mắc về kỹ thuật, nạp tiền hoặc đăng tin.
              </p>
              
              <div className="contact-methods-grid">
                <a href="mailto:2iamduy@gmail.com" className="contact-method-card">
                  <div className="method-icon-wrap">
                    <Mail size={20} />
                  </div>
                  <div className="method-details">
                    <span className="method-label">Gửi Email hỗ trợ</span>
                    <span className="method-value">2iamduy@gmail.com</span>
                  </div>
                </a>

                <a href="tel:0392158141" className="contact-method-card">
                  <div className="method-icon-wrap">
                    <Phone size={20} />
                  </div>
                  <div className="method-details">
                    <span className="method-label">Hotline 24/7</span>
                    <span className="method-value">0392 158 141</span>
                  </div>
                </a>

                <div className="contact-method-card no-link">
                  <div className="method-icon-wrap">
                    <Clock size={20} />
                  </div>
                  <div className="method-details">
                    <span className="method-label">Thời gian làm việc</span>
                    <span className="method-value">Hỗ trợ 24/7 (Cả ngày lễ)</span>
                  </div>
                </div>
              </div>

              <div className="support-ai-cta">
                <div className="ai-cta-icon">🤖</div>
                <div className="ai-cta-content">
                  <h5>Hỏi trợ lý ảo AI của chúng tôi</h5>
                  <p>Trợ lý ảo có thể giải đáp tức thì các câu hỏi về quy trình đăng tin và biểu phí nâng cấp VIP.</p>
                  <button type="button" className="ai-chat-trigger-btn" onClick={handleOpenChatbot}>
                    <MessageSquare size={16} />
                    Trò chuyện với AI ngay
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="info-modal-container animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="info-modal-close" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>
        <div className="info-modal-scrollable">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
