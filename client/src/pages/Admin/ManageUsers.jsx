import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import useDebounce from '../../hooks/useDebounce';
import {
  Search,
  UserX,
  UserCheck,
  Shield,
  Users,
  User,
  Loader2,
  X,
  AlertTriangle,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './ManageUsers.css';

export default function ManageUsers() {
  const { token, currentUser } = useAuth();

  // Table states
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');

  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    adminUsers: 0
  });

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const statusParam = statusFilter === 'All' ? '' : statusFilter;
      const roleParam = roleFilter === 'All' ? '' : roleFilter;

      const url = `http://localhost:5000/api/admin/users?page=${currentPage}&limit=10&search=${encodeURIComponent(debouncedSearch)}&status=${statusParam}&role=${roleParam}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        const errorObj = new Error(result.message || 'Không thể tải danh sách người dùng.');
        errorObj.response = { data: result };
        throw errorObj;
      }

      setUsers(result.data || []);
      setTotalUsers(result.pagination?.total || 0);
      setTotalPages(result.pagination?.pages || 1);
      if (result.stats) {
        setStats(result.stats);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when parameters change
  useEffect(() => {
    fetchUsers();
  }, [currentPage, debouncedSearch, statusFilter, roleFilter]);

  // Reset page to 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, roleFilter]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  // Open Block/Unlock confirmation modal
  const handleOpenConfirm = (user) => {
    setSelectedUser(user);
    setShowConfirmModal(true);
  };

  // Handle Lock/Unlock action submission
  const handleToggleBlock = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);

      const response = await fetch(`http://localhost:5000/api/admin/users/${selectedUser._id}/toggle-block`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        const errorObj = new Error(result.message || 'Thay đổi trạng thái tài khoản thất bại.');
        errorObj.response = { data: result };
        throw errorObj;
      }

      toast.success(result.message || 'Cập nhật trạng thái tài khoản thành công!');
      setShowConfirmModal(false);
      setSelectedUser(null);
      fetchUsers(); // Refresh data and stats
    } catch (err) {
      console.error('Error toggling block state:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ.';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Generate pagination page numbers
  const renderPaginationNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`page-num-btn ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-container">

        {/* Page Title */}
        <div className="admin-title-row">
          <div>
            <h1 className="admin-page-title">Quản lý Thành viên</h1>
            <p className="admin-page-subtitle">Quản lý tài khoản người dùng, thực hiện khóa/mở khóa và tự động đồng bộ ẩn bài đăng.</p>
          </div>
        </div>

        {/* Stats Summary Grid */}
        <div className="admin-stats-grid">

          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-blue">
              <Users className="text-blue" size={20} />
            </div>
            <div className="stat-data">
              <span className="stat-value">{stats.totalUsers || 0}</span>
              <span className="stat-label">Tổng thành viên</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-green">
              <UserCheck className="text-green" size={20} />
            </div>
            <div className="stat-data">
              <span className="stat-value">{stats.activeUsers || 0}</span>
              <span className="stat-label">Đang hoạt động</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-red">
              <UserX className="text-red" size={20} />
            </div>
            <div className="stat-data">
              <span className="stat-value">{stats.blockedUsers || 0}</span>
              <span className="stat-label">Tài khoản bị khóa</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-purple">
              <Shield className="text-purple" size={20} />
            </div>
            <div className="stat-data">
              <span className="stat-value">{stats.adminUsers || 0}</span>
              <span className="stat-label">Quản trị viên</span>
            </div>
          </div>

        </div>

        {/* Search, Filter & Actions Bar */}
        <div className="table-actions-bar">

          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm tên, email hoặc số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters-wrapper">
            <div className="filter-group">
              <label htmlFor="role-filter">Vai trò:</label>
              <select
                id="role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">Tất cả</option>
                <option value="User">Thành viên</option>
                <option value="Admin">Quản trị</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="status-filter">Trạng thái:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">Tất cả</option>
                <option value="Active">Hoạt động</option>
                <option value="Blocked">Bị khóa</option>
              </select>
            </div>
          </div>

        </div>

        {/* Users Table Card */}
        <div className="users-table-card">
          {loading ? (
            <div className="table-loading-container">
              <Loader2 size={36} className="spinner-icon animate-spin" />
              <p>Đang tải danh sách thành viên...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-table-state">
              <Users size={48} className="empty-icon" />
              <h3>Không tìm thấy thành viên</h3>
              <p>Không có thành viên nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="users-data-table">
                <thead>
                  <tr>
                    <th>Thành viên</th>
                    <th>Thông tin liên hệ</th>
                    <th>Vai trò</th>
                    <th>Số dư ví</th>
                    <th>Ngày tham gia</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isSelf = user._id === currentUser?._id;
                    const isAdmin = user.role === 'Admin';
                    const canToggle = !isSelf && !isAdmin;

                    return (
                      <tr key={user._id}>
                        {/* Member profile summary */}
                        <td className="col-user-profile">
                          <div className="col-user-profile-flex">
                            <div className="user-avatar-wrapper">
                              <img
                                src={user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                alt={user.fullName}
                                className="user-table-avatar"
                                onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; }}
                              />
                            </div>
                            <div className="user-details-summary">
                              <span className="user-fullName">{user.fullName}</span>
                              {isSelf && <span className="self-badge">Bạn</span>}
                            </div>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="col-user-contact">
                          <div className="col-user-contact-flex">
                            <div className="contact-item">
                              <Mail size={13} className="contact-icon" />
                              <span>{user.email}</span>
                            </div>
                            <div className="contact-item">
                              <Phone size={13} className="contact-icon" />
                              <span>{user.phoneNumber}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td>
                          <span className={`badge-role ${isAdmin ? 'role-admin' : 'role-user'}`}>
                            {isAdmin ? 'Quản trị viên' : 'Thành viên'}
                          </span>
                        </td>

                        {/* Wallet Balance */}
                        <td className="col-user-balance">
                          <div className="balance-item">
                            <DollarSign size={14} className="balance-icon" />
                            <span>{formatCurrency(user.balance)}</span>
                          </div>
                        </td>

                        {/* Created At */}
                        <td className="col-user-date">
                          <div className="date-item">
                            <Calendar size={13} className="date-icon" />
                            <span>
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })
                                : '---'
                              }
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`badge-status ${user.isBlocked ? 'status-blocked' : 'status-active'}`}>
                            {user.isBlocked ? 'Đã khóa' : 'Hoạt động'}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td>
                          <div className="actions-btn-group">
                            {canToggle ? (
                              user.isBlocked ? (
                                <button
                                  type="button"
                                  className="btn-action-status unlock"
                                  title="Mở khóa tài khoản"
                                  onClick={() => handleOpenConfirm(user)}
                                >
                                  <UserCheck size={16} className="mr-1" />
                                  <span>Mở khóa</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-action-status lock"
                                  title="Khóa tài khoản"
                                  onClick={() => handleOpenConfirm(user)}
                                >
                                  <UserX size={16} className="mr-1" />
                                  <span>Khóa</span>
                                </button>
                              )
                            ) : (
                              <span className="action-disabled-text" title={isSelf ? "Bạn không thể tự khóa mình" : "Không thể khóa quản trị viên khác"}>
                                Không khả dụng
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination controls */}
          {!loading && totalPages > 1 && (
            <div className="table-pagination-footer">
              <span className="pagination-summary">
                Hiển thị trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> (Tổng số <strong>{totalUsers}</strong> thành viên)
              </span>

              <div className="pagination-buttons">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="page-nav-btn"
                >
                  <ChevronLeft size={16} />
                </button>

                {renderPaginationNumbers()}

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="page-nav-btn"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedUser && (
        <div className="modal-backdrop-overlay">
          <div className="modal-content-card">

            {/* Modal Header */}
            <div className={`modal-card-header ${selectedUser.isBlocked ? 'text-green-header' : 'text-red-header'}`}>
              <h3>{selectedUser.isBlocked ? 'Xác nhận Mở khóa tài khoản' : 'Xác nhận Khóa tài khoản'}</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedUser(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-card-body">
              <p>Bạn có chắc chắn muốn {selectedUser.isBlocked ? 'mở khóa' : 'khóa'} tài khoản của thành viên <strong>{selectedUser.fullName}</strong>?</p>

              {selectedUser.isBlocked ? (
                <div className="alert-message alert-info mt-3">
                  <UserCheck size={18} />
                  <span>Tài khoản người dùng sẽ hoạt động trở lại bình thường. Đồng thời, toàn bộ bài đăng trước đây của người dùng này sẽ hiển thị công khai trở lại.</span>
                </div>
              ) : (
                <div className="alert-message alert-warning mt-3">
                  <AlertTriangle size={18} />
                  <span><strong>Quan trọng:</strong> Tài khoản bị khóa sẽ không thể truy cập hệ thống nữa. Toàn bộ các tin đăng phòng trọ của người dùng này sẽ tự động bị ẩn khỏi trang chủ công khai ngay lập tức (Data Cascade).</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-card-footer">
              <button
                type="button"
                className="btn-secondary-cancel"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={selectedUser.isBlocked ? 'btn-success-confirm' : 'btn-danger-confirm'}
                onClick={handleToggleBlock}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>{selectedUser.isBlocked ? 'Đồng ý mở khóa' : 'Đồng ý khóa'}</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
