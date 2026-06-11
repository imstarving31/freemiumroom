import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import socket from '../utils/socket';
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
  User,
  ChevronDown
} from 'lucide-react';
import './AdminLayout.css';

export default function AdminLayout() {
  const currentUser = useAuth()?.currentUser;
  const logout = useAuth()?.logout;
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [unreadCount, setUnreadCount] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_notifications_unread');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    localStorage.setItem('admin_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('admin_notifications_unread', unreadCount.toString());
  }, [unreadCount]);

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate('/login');
    toast.success('Đăng xuất thành công!');
  };

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleAdminNotification = (data) => {
      console.log('Received admin notification:', data);
      const newNotif = {
        id: data.id || data._id || Date.now().toString(),
        message: data.message || data.content || 'Có thông báo mới từ hệ thống.',
        type: data.type || 'SYSTEM',
        createdAt: data.createdAt || new Date()
      };
      setNotifications(prev => {
        const updated = [newNotif, ...prev];
        return updated.slice(0, 20);
      });
      setUnreadCount(prev => prev + 1);
    };

    socket.on('admin_notification', handleAdminNotification);

    return () => {
      socket.off('admin_notification', handleAdminNotification);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.topbar-bell-wrapper')) {
        setShowNotifications(false);
      }
      if (!e.target.closest('.topbar-profile-wrapper')) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const menuItems = [
    {
      path: '/admin/dashboard',
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
          {/* Left search placeholder (hidden search box per layout design requirements) */}
          <div style={{ flex: 1 }}></div>

          {/* Right actions */}
          <div className="topbar-actions">
            
            {/* Notification bell */}
            <div className="topbar-bell-wrapper">
              <button 
                type="button"
                className="topbar-bell-btn" 
                title="Thông báo"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                  setUnreadCount(0);
                }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="bell-badge-count">{unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="dropdown-header">
                    <h4>Thông báo hệ thống</h4>
                    {notifications.length > 0 && (
                      <button 
                        type="button"
                        className="clear-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotifications([]);
                        }}
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>
                  <div className="dropdown-body">
                    {notifications.length === 0 ? (
                      <div className="empty-notifications">Không có thông báo mới</div>
                    ) : (
                      notifications.map((notif) => {
                        let targetPath = '#';
                        if (notif.type === 'POST' || notif.type === 'kiem-duyet') {
                          targetPath = '/admin/approve-posts';
                        } else if (notif.type === 'PAYMENT' || notif.type === 'giao-dich') {
                          targetPath = '/admin/transactions';
                        }
                        
                        return (
                          <div 
                            key={notif.id} 
                            className="notification-item"
                            onClick={() => {
                              setShowNotifications(false);
                              if (targetPath !== '#') {
                                navigate(targetPath);
                              }
                            }}
                          >
                            <span className={`notif-icon-dot ${notif.type.toLowerCase()}`} />
                            <div className="notif-content">
                              <p className="notif-message">{notif.message}</p>
                              <span className="notif-time">
                                {new Date(notif.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile pill */}
            <div className="topbar-profile-wrapper">
              <button 
                type="button"
                className="topbar-profile-pill"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
              >
                <img 
                  src={currentUser?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                  alt={currentUser?.fullName} 
                  className="topbar-avatar" 
                  onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; }}
                />
                <span className="topbar-username">{currentUser?.fullName || 'Admin'}</span>
                <ChevronDown size={14} className={`profile-arrow ${showProfileMenu ? 'open' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="profile-dropdown-menu">
                  <div className="profile-dropdown-header">
                    <span className="user-name">{currentUser?.fullName || 'Quản trị viên'}</span>
                    <span className="user-email">{currentUser?.email || 'admin@freemiumroom.com'}</span>
                  </div>
                  <hr className="dropdown-divider" />
                  <button 
                    type="button" 
                    className="profile-dropdown-item"
                    onClick={() => {
                      setShowProfileMenu(false);
                      toast.info('Tính năng Cài đặt tài khoản đang được cập nhật.');
                    }}
                  >
                    <Settings size={15} />
                    <span>Cài đặt tài khoản</span>
                  </button>
                  <button 
                    type="button" 
                    className="profile-dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
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
