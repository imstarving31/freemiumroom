import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Folder,
  Users,
  CreditCard, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  User
} from 'lucide-react';
import './AdminLayout.css';

export default function AdminLayout() {
  const currentUser = useAuth()?.currentUser;
  const logout = useAuth()?.logout;
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      path: '#',
      label: 'Tổng quan',
      icon: <LayoutDashboard size={18} />
    },
    {
      path: '/admin/approve-posts',
      label: 'Kiểm duyệt tin',
      icon: <CheckSquare size={18} />
    },
    {
      path: '/admin/categories',
      label: 'Danh mục',
      icon: <Folder size={18} />
    },
    {
      path: '/admin/users',
      label: 'Thành viên',
      icon: <Users size={18} />
    },
    {
      path: '/admin/transactions',
      label: 'Giao dịch',
      icon: <CreditCard size={18} />
    },
    {
      path: '#',
      label: 'Hệ thống',
      icon: <Settings size={18} />
    }
  ];

  return (
    <div className="admin-layout-wrapper">
      
      {/* Left Sidebar */}
      <aside className="admin-sidebar">
        
        {/* Brand/Logo */}
        <div className="admin-brand">
          <Link to="/" className="brand-logo-text">
            FreemiumRoom <span>Admin</span>
          </Link>
        </div>

        {/* Admin Info Profile Summary */}
        <div className="sidebar-profile">
          <img 
            src={currentUser?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
            alt={currentUser?.fullName} 
            className="sidebar-avatar" 
            onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; }}
          />
          <div className="sidebar-profile-text">
            <h5 className="profile-name-text">{currentUser?.fullName || 'Quản trị viên'}</h5>
            <span className="profile-role-badge">Super Admin</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {menuItems.map((item, idx) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={idx} className="menu-item-wrapper">
                  <Link 
                    to={item.path} 
                    className={`menu-link-btn ${isActive ? 'active' : ''}`}
                  >
                    <span className="link-icon">{item.icon}</span>
                    <span className="link-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button 
            type="button" 
            className="sidebar-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Right Main Area */}
      <div className="admin-main-area">
        
        {/* Topbar */}
        <header className="admin-topbar">
          
          {/* Left search */}
          <div className="topbar-search-box">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm tác vụ hoặc bài viết..." 
              className="topbar-search-input"
            />
          </div>

          {/* Right actions */}
          <div className="topbar-actions">
            
            {/* Notification bell */}
            <button className="topbar-bell-btn" title="Thông báo">
              <Bell size={18} />
              <span className="bell-badge-dot"></span>
            </button>

            {/* Profile pill */}
            <div className="topbar-profile-pill">
              <img 
                src={currentUser?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                alt={currentUser?.fullName} 
                className="topbar-avatar" 
                onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; }}
              />
              <span className="topbar-username">{currentUser?.fullName || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="admin-content-outlet">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
