import React from 'react';
import { Link } from 'react-router-dom';
import { Share2, Globe, Mail } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-grid">
        <div className="footer-col brand-col">
          <Link to="/" className="footer-logo">FreemiumRoom</Link>
          <p className="footer-copyright-text">
            © 2026 FreemiumRoom. The Digital Creator for Modern Living. Nền tảng kết nối người thuê và cho thuê phòng trọ hàng đầu Việt Nam.
          </p>
          <div className="social-links-row">
            <a href="#fb" className="social-icon-btn"><Share2 size={16} /></a>
            <a href="#tw" className="social-icon-btn"><Globe size={16} /></a>
            <a href="#ln" className="social-icon-btn"><Mail size={16} /></a>
          </div>
        </div>

        <div className="footer-col links-col">
          <h5 className="footer-col-title">KHÁM PHÁ</h5>
          <ul className="footer-links-list">
            <li><a href="#about">Về chúng tôi</a></li>
            <li><Link to="/dang-tin">Hướng dẫn đăng tin</Link></li>
            <li><a href="#support">Liên hệ hỗ trợ</a></li>
          </ul>
        </div>

        <div className="footer-col links-col">
          <h5 className="footer-col-title">PHÁP LÝ</h5>
          <ul className="footer-links-list">
            <li><a href="#privacy">Chính sách bảo mật</a></li>
            <li><a href="#terms">Điều khoản sử dụng</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
