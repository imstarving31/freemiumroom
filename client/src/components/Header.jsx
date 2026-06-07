import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  User, 
  FileText, 
  CreditCard, 
  LogOut, 
  Heart, 
  Settings, 
  PlusCircle, 
  ChevronDown,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import useDebounce from '../hooks/useDebounce';
import FilterModal from './FilterModal';
import './Header.css';

export default function Header() {
  const { currentUser, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [localKeyword, setLocalKeyword] = useState(searchParams.get('keyword') || '');
  const debouncedKeyword = useDebounce(localKeyword, 500);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync debounced keyword with URL searchParams
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (debouncedKeyword.trim()) {
      newParams.set('keyword', debouncedKeyword.trim());
    } else {
      newParams.delete('keyword');
    }
    setSearchParams(newParams);
  }, [debouncedKeyword]);

  // Sync local keyword with URL parameter when it changes externally
  useEffect(() => {
    setLocalKeyword(searchParams.get('keyword') || '');
  }, [searchParams]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };
  return (
    <header className="main-header w-full bg-white flex justify-between items-center px-8 py-3 border-b shadow-sm">
      <Link to="/" className="logo-brand flex-shrink-0">
        FreemiumRoom
      </Link>

      {/* Central Search Bar */}
      <div className="header-search-bar-center flex-1 max-w-2xl mx-8">
        <div className="header-search-input-wrapper">
          <Search size={16} className="search-icon-left" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            className="header-search-input"
          />
        </div>
        <button 
          type="button" 
          className="header-filter-trigger-btn"
          onClick={() => setIsFilterModalOpen(true)}
        >
          <SlidersHorizontal size={14} style={{ marginRight: '6px' }} />
          <span>Bộ lọc</span>
        </button>
      </div>

      <div className="header-actions flex items-center gap-6 flex-shrink-0">
        {currentUser ? (
          <>
            {/* User Menu Area */}
            <div className="user-profile-wrapper" ref={dropdownRef}>
              <div 
                className="user-profile-trigger" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <img src={currentUser.avatar} alt={currentUser.fullName} className="user-avatar-small" />
                <span className="user-name-small">{currentUser.fullName}</span>
                <ChevronDown size={14} className={`dropdown-caret ${dropdownOpen ? 'open' : ''}`} />
              </div>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="user-dropdown-menu">
                  {/* Khối 1: Avatar, fullName, role/phone */}
                  <div className="dropdown-block profile-info">
                    <img src={currentUser.avatar} alt={currentUser.fullName} className="dropdown-avatar-large" />
                    <div className="profile-text">
                      <div className="profile-name">{currentUser.fullName}</div>
                      <div className="profile-phone">
                        {currentUser.role === 'Admin' ? 'Tài khoản Quản trị' : (currentUser.phoneNumber || 'Chưa cập nhật SĐT')}
                      </div>
                    </div>
                  </div>

                  {currentUser.role === 'Admin' ? (
                    // Admin dropdown items
                    <div className="dropdown-block dropdown-nav">
                      <Link to="/admin/approve-posts" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <Settings size={16} />
                        <span>Vào Dashboard Quản trị</span>
                      </Link>
                      <div className="dropdown-divider"></div>
                      <button onClick={handleLogout} className="dropdown-logout-btn">
                        <LogOut size={16} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  ) : (
                    // Standard User dropdown items
                    <>
                      {/* Khối 2: Số dư tài khoản, balance, nút Nạp tiền */}
                      <div className="dropdown-block profile-balance">
                        <div className="balance-info">
                          <span className="balance-label">Số dư tài khoản</span>
                          <span className="balance-amount">
                            {currentUser.balance?.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                        <button className="deposit-btn" onClick={() => { setDropdownOpen(false); navigate('/wallet'); }}>
                          <PlusCircle size={14} />
                          Nạp tiền
                        </button>
                      </div>

                      <div className="dropdown-block dropdown-nav">
                        <Link to="/favorites" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <Heart size={16} />
                          <span>Tin đã lưu</span>
                        </Link>
                        <Link to="/quan-ly" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <Settings size={16} />
                          <span>Quản lý</span>
                        </Link>
                        <Link to="/manage-posts" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FileText size={16} />
                          <span>Quản lý tin đăng</span>
                        </Link>
                        <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <User size={16} />
                          <span>Quản lý tài khoản</span>
                        </Link>
                        <Link to="/bang-gia" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <CreditCard size={16} />
                          <span>Bảng giá dịch vụ</span>
                        </Link>
                        <div className="dropdown-divider"></div>
                        <button onClick={handleLogout} className="dropdown-logout-btn">
                          <LogOut size={16} />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="login-link-btn">Đăng nhập</Link>
            <Link to="/register" className="register-link-btn">Đăng ký</Link>
          </>
        )}

        <button className="icon-action-btn" title="Thông báo">
          <Bell size={18} />
        </button>
        {(!currentUser || currentUser.role !== 'Admin') && (
          <Link to="/dang-tin" className="post-free-btn">
            Đăng tin miễn phí
          </Link>
        )}
      </div>
      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} />
    </header>
  );
}
