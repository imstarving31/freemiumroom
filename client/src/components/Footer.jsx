import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Share2, Globe, Mail } from 'lucide-react';
import InfoModal from './InfoModal';
import './Footer.css';

export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('about'); // 'about' | 'privacy' | 'terms' | 'support'

  const handleOpenModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <footer className="main-footer">
      <div className="footer-grid">
        <div className="footer-col brand-col">
          <Link to="/" className="footer-logo">FreemiumRoom</Link>
          <p className="footer-copyright-text">
            © 2026 FreemiumRoom. The Digital Creator for Modern Living. Nền tảng kết nối người thuê và cho thuê phòng trọ hàng đầu Việt Nam.
          </p>
          <div className="social-links-row">
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-icon-btn" 
              title="Facebook"
            >
              <Share2 size={16} />
            </a>
            <Link to="/" className="social-icon-btn" title="Website">
              <Globe size={16} />
            </Link>
            <a 
              href="mailto:2iamduy@gmail.com" 
              className="social-icon-btn" 
              title="Gửi Email Hỗ Trợ (2iamduy@gmail.com)"
            >
              <Mail size={16} />
            </a>
          </div>
        </div>

        <div className="footer-col links-col">
          <h5 className="footer-col-title">KHÁM PHÁ</h5>
          <ul className="footer-links-list">
            <li>
              <button 
                type="button" 
                className="footer-link-btn" 
                onClick={() => handleOpenModal('about')}
              >
                Về chúng tôi
              </button>
            </li>
            <li><Link to="/dang-tin">Hướng dẫn đăng tin</Link></li>
            <li>
              <button 
                type="button" 
                className="footer-link-btn" 
                onClick={() => handleOpenModal('support')}
              >
                Liên hệ hỗ trợ
              </button>
            </li>
          </ul>
        </div>

        <div className="footer-col links-col">
          <h5 className="footer-col-title">PHÁP LÝ</h5>
          <ul className="footer-links-list">
            <li>
              <button 
                type="button" 
                className="footer-link-btn" 
                onClick={() => handleOpenModal('privacy')}
              >
                Chính sách bảo mật
              </button>
            </li>
            <li>
              <button 
                type="button" 
                className="footer-link-btn" 
                onClick={() => handleOpenModal('terms')}
              >
                Điều khoản sử dụng
              </button>
            </li>
          </ul>
        </div>
      </div>

      <InfoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        type={modalType} 
      />
    </footer>
  );
}
