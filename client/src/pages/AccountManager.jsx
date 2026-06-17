import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Lock,
  ShieldAlert,
  AlertTriangle,
  Save,
  Key
} from 'lucide-react';
import { toast } from 'react-toastify';
import './AccountManager.css';

export default function AccountManager() {
  const { currentUser, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Profile form state
  const [profileData, setProfileData] = useState({
    email: '',
    fullName: '',
    phoneNumber: ''
  });

  // Change password form state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Deactivate form state
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [showDeactivateForm, setShowDeactivateForm] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setPageLoading(true);
        const response = await fetch('http://localhost:5000/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setProfileData({
            email: data.data.email || '',
            fullName: data.data.fullName || '',
            phoneNumber: data.data.phoneNumber || ''
          });
        } else {
          toast.error(data.message || 'Không thể tải thông tin tài khoản');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Lỗi kết nối đến máy chủ');
      } finally {
        setPageLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!profileData.fullName.trim()) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }
    if (!profileData.phoneNumber.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profileData.fullName.trim(),
          phoneNumber: profileData.phoneNumber.trim()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(data.message || 'Cập nhật thông tin thành công!');
      } else {
        toast.error(data.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Lỗi kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  // Handle change password
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.oldPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!passwordData.newPassword) {
      toast.error('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(data.message || 'Đổi mật khẩu thành công!');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.message || 'Đổi mật khẩu thất bại');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error('Lỗi kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  // Handle deactivate account
  const handleDeactivateAccount = async (e) => {
    e.preventDefault();

    if (!deactivatePassword) {
      toast.error('Vui lòng nhập mật khẩu để xác nhận');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/users/deactivate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: deactivatePassword })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(data.message || 'Tài khoản đã bị vô hiệu hóa');
        // Clear auth and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (logout) logout();
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      } else {
        toast.error(data.message || 'Vô hiệu hóa tài khoản thất bại');
      }
    } catch (err) {
      console.error('Error deactivating account:', err);
      toast.error('Lỗi kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: <User size={16} /> },
    { id: 'password', label: 'Đổi mật khẩu', icon: <Lock size={16} /> },
    { id: 'deactivate', label: 'Vô hiệu hóa tài khoản', icon: <ShieldAlert size={16} />, danger: true },
  ];

  return (
    <div className="account-manager-page">
      <div className="account-manager-container">
        {/* Sidebar */}
        <div className="account-sidebar">
          <div className="user-profile-summary">
            <img
              src={currentUser?.avatar || '/logoFR.jpg'}
              alt={currentUser?.fullName || 'Avatar'}
              className="summary-avatar"
              onError={(e) => { e.target.src = '/logoFR.jpg'; }}
            />
            <div className="summary-info">
              <h4 className="summary-name">{currentUser?.fullName || 'Người dùng'}</h4>
              <span className="summary-role">{currentUser?.role === 'Admin' ? 'Quản trị viên' : 'Thành viên'}</span>
            </div>
          </div>

          <nav className="account-tabs-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-nav-btn ${activeTab === tab.id ? 'active' : ''} ${tab.danger ? 'danger-tab' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Panel */}
        <div className="account-content-card">
          {pageLoading && (
            <div className="panel-loading-overlay">
              <div className="loading-spinner"></div>
            </div>
          )}

          {/* Tab: Thông tin cá nhân */}
          {activeTab === 'profile' && (
            <div className="panel-tab-body animate-fade" key="profile">
              <h2 className="panel-heading">Thông tin cá nhân</h2>
              <p className="panel-subheading">Cập nhật họ tên và số điện thoại liên hệ của bạn</p>

              <form className="account-form" onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="disabled-input"
                  />
                  <span className="input-hint">Email không thể thay đổi</span>
                </div>
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    value={profileData.phoneNumber}
                    onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <button type="submit" className="save-btn" disabled={loading}>
                  <Save size={16} />
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            </div>
          )}

          {/* Tab: Đổi mật khẩu */}
          {activeTab === 'password' && (
            <div className="panel-tab-body animate-fade" key="password">
              <h2 className="panel-heading">Đổi mật khẩu</h2>
              <p className="panel-subheading">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>

              <form className="account-form" onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>
                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  />
                </div>
                <div className="form-group">
                  <label>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
                <button type="submit" className="save-btn key-btn" disabled={loading}>
                  <Key size={16} />
                  {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </div>
          )}

          {/* Tab: Vô hiệu hóa tài khoản */}
          {activeTab === 'deactivate' && (
            <div className="panel-tab-body animate-fade" key="deactivate">
              <h2 className="panel-heading danger-heading">Vô hiệu hóa tài khoản</h2>
              <p className="panel-subheading">Hành động này có thể ảnh hưởng nghiêm trọng đến tài khoản của bạn</p>

              <div className="danger-zone-card">
                <div className="danger-warning-message">
                  <AlertTriangle size={24} className="warning-icon" />
                  <p>
                    Hành động này sẽ <strong>ẩn toàn bộ tin đăng</strong> của bạn và bạn sẽ bị <strong>đăng xuất</strong> ngay lập tức.
                    Tài khoản của bạn sẽ chuyển sang trạng thái không hoạt động và không thể đăng nhập cho đến khi được kích hoạt lại bởi quản trị viên.
                  </p>
                </div>

                {!showDeactivateForm ? (
                  <button
                    type="button"
                    className="deactivate-trigger-btn"
                    onClick={() => setShowDeactivateForm(true)}
                  >
                    Vô hiệu hóa tài khoản của tôi
                  </button>
                ) : (
                  <form className="deactivate-confirm-form" onSubmit={handleDeactivateAccount}>
                    <div className="form-group">
                      <label>Nhập mật khẩu hiện tại để xác nhận</label>
                      <input
                        type="password"
                        value={deactivatePassword}
                        onChange={(e) => setDeactivatePassword(e.target.value)}
                        placeholder="Nhập mật khẩu xác thực"
                      />
                    </div>
                    <div className="deactivate-action-group">
                      <button type="submit" className="confirm-deactivate-btn" disabled={loading}>
                        {loading ? 'Đang xử lý...' : 'Xác nhận vô hiệu hóa'}
                      </button>
                      <button
                        type="button"
                        className="cancel-deactivate-btn"
                        onClick={() => {
                          setShowDeactivateForm(false);
                          setDeactivatePassword('');
                        }}
                      >
                        Hủy bỏ
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
