import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Eye,
  Check,
  X,
  User,
  Calendar,
  AlertCircle,
  DollarSign,
  Maximize2,
  MapPin,
  Mail,
  Phone,
  Grid,
  CheckCircle2,
  FolderOpen,
  Clock,
  Search,
  SlidersHorizontal,
  XCircle,
  Users
} from 'lucide-react';
import './ApprovePosts.css';

export default function ApprovePosts() {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real stats state
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    userCount: 0
  });

  // Client-side Filters
  const [keyword, setKeyword] = useState('');
  const [postTypeFilter, setPostTypeFilter] = useState('all');

  // Detail Modal State
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reject Modal State
  const [rejectingPost, setRejectingPost] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Fetch pending posts
  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/room-posts/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setPosts(result.data || []);
      } else {
        toast.error(result.message || 'Không thể tải danh sách tin chờ duyệt.');
      }
    } catch (err) {
      console.error('Error fetching pending posts:', err);
      toast.error('Đã xảy ra lỗi khi kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setStats(result.data || {
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          userCount: 0
        });
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPendingPosts();
      fetchStats();
    }
  }, [token]);

  // Handle Approve
  const handleApprove = async (postId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/room-posts/${postId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast.success('Phê duyệt tin đăng thành công!');
        setPosts(prev => prev.filter(post => post._id !== postId));
        fetchStats(); // Update stats dynamically
        if (selectedPost && selectedPost._id === postId) {
          setShowDetailModal(false);
        }
      } else {
        toast.error(result.message || 'Phê duyệt thất bại.');
      }
    } catch (err) {
      console.error('Error approving post:', err);
      toast.error('Lỗi kết nối. Vui lòng thử lại sau.');
    }
  };

  // Handle Reject Submit
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối để người dùng biết cách khắc phục');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/room-posts/${rejectingPost._id}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectionReason })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast.info('Đã từ chối duyệt bài đăng này.');
        setPosts(prev => prev.filter(post => post._id !== rejectingPost._id));
        fetchStats(); // Update stats dynamically
        setShowRejectModal(false);
        setRejectingPost(null);
        setRejectionReason('');
        setRejectError('');
        if (selectedPost && selectedPost._id === rejectingPost._id) {
          setShowDetailModal(false);
        }
      } else {
        toast.error(result.message || 'Thao tác từ chối thất bại.');
      }
    } catch (err) {
      console.error('Error rejecting post:', err);
      toast.error('Lỗi kết nối. Vui lòng thử lại sau.');
    }
  };

  const openDetailModal = (post) => {
    setSelectedPost(post);
    setActiveImageIndex(0);
    setShowDetailModal(true);
  };

  const openRejectModal = (post) => {
    setRejectingPost(post);
    setRejectionReason('');
    setRejectError('');
    setShowRejectModal(true);
  };

  const formatPrice = (price) => {
    if (!price) return 'Liên hệ';
    const num = Number(price);
    if (num >= 1000000) {
      return `${(num / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr/th`;
    }
    return `${num.toLocaleString('vi-VN')} đ/th`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Client-side filtering logic
  const filteredPosts = posts.filter(post => {
    const authorName = post.userID?.fullName || post.contactName || '';
    const authorEmail = post.userID?.email || '';
    const matchesKeyword = !keyword.trim() ||
      post.title.toLowerCase().includes(keyword.toLowerCase()) ||
      post.address.toLowerCase().includes(keyword.toLowerCase()) ||
      authorName.toLowerCase().includes(keyword.toLowerCase()) ||
      authorEmail.toLowerCase().includes(keyword.toLowerCase());

    const matchesType = postTypeFilter === 'all' ||
      (postTypeFilter === 'VIP' && post.postType === 'Tin VIP') ||
      (postTypeFilter === 'normal' && post.postType === 'Tin thường');

    return matchesKeyword && matchesType;
  });

  return (
    <div className="admin-approve-page">
      <div className="admin-approve-container">

        {/* Page Title Row */}
        <div className="admin-title-row">
          <h1 className="admin-page-title">Kiểm duyệt Tin đăng</h1>
          <p className="admin-page-subtitle">Quản lý, phê duyệt hoặc từ chối tin đăng phòng trọ của người dùng</p>
        </div>

        {/* 4 Real Stats Cards */}
        <div className="admin-stats-grid">
          {/* Card 1: Chờ duyệt */}
          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-blue">
              <Clock size={22} className="text-blue" />
            </div>
            <div className="stat-data">
              <span className="stat-value">{stats.pendingCount}</span>
              <span className="stat-label">Chờ duyệt</span>
            </div>
          </div>
          {/* Card 2: Đang hiển thị */}
          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-green">
              <CheckCircle2 size={22} className="text-green" />
            </div>
            <div className="stat-data">
              <span className="stat-value">{stats.approvedCount}</span>
              <span className="stat-label">Đang hiển thị</span>
            </div>
          </div>
          {/* Card 3: Bị từ chối */}
          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-red">
              <XCircle size={22} className="text-red" />
            </div>
            <div className="stat-data">
              <span className="stat-value">{stats.rejectedCount}</span>
              <span className="stat-label">Bị từ chối</span>
            </div>
          </div>
          {/* Card 4: Tổng thành viên */}
          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-purple">
              <Users size={22} className="text-purple" />
            </div>
            <div className="stat-data">
              <span className="stat-value">{stats.userCount}</span>
              <span className="stat-label">Tổng thành viên</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="admin-filter-bar">
          <div className="filter-search-input-box">
            <Search size={16} className="filter-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm tin theo tiêu đề, địa chỉ, người đăng..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="filter-search-input"
            />
          </div>
          <div className="filter-select-box">
            <SlidersHorizontal size={14} className="filter-select-icon" />
            <select
              value={postTypeFilter}
              onChange={(e) => setPostTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả loại tin</option>
              <option value="VIP">Tin VIP</option>
              <option value="normal">Tin thường</option>
            </select>
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="admin-loading-state">
            <div className="admin-spinner"></div>
            <p>Đang tải danh sách bài viết...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="admin-empty-state">
            <div className="empty-icon-circle">
              <CheckCircle2 size={48} className="empty-icon-green" />
            </div>
            <h3>Không tìm thấy bài viết phù hợp</h3>
            <p>Không có tin đăng nào chờ duyệt hoặc khớp với điều kiện tìm kiếm của bạn.</p>
          </div>
        ) : (
          /* Clean & Compact Table */
          <div className="admin-table-wrapper">
            <table className="admin-posts-table">
              <thead>
                <tr>
                  <th>Thông tin bài viết</th>
                  <th>Người đăng</th>
                  <th>Thời gian gửi</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => {
                  const thumbnail = post.images && post.images.length > 0
                    ? post.images[0]
                    : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=200&auto=format&fit=crop';

                  const authorName = post.userID?.fullName || post.contactName || 'Người dùng ẩn danh';
                  const authorEmail = post.userID?.email || 'Chưa cung cấp';

                  return (
                    <tr key={post._id} className="admin-post-row">
                      {/* Post Info */}
                      <td className="admin-col-info">
                        <div className="admin-room-cell">
                          <img
                            src={thumbnail}
                            alt={post.title}
                            className="admin-room-thumb"
                            onError={(e) => { e.target.src = 'https://placehold.co/120x80?text=Hình+ảnh'; }}
                          />
                          <div className="admin-room-details">
                            <h4 className="admin-room-title" title={post.title}>{post.title}</h4>
                            <div className="admin-room-meta">
                              <span className="admin-price">{formatPrice(post.price)}</span>
                              <span className="admin-bullet">•</span>
                              <span className="admin-area">{post.area} m²</span>
                              <span className="admin-bullet">•</span>
                              <span className={`admin-type-tag ${post.postType === 'Tin VIP' ? 'vip' : 'normal'}`}>
                                {post.postType === 'Tin VIP' ? 'VIP' : 'Thường'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Author Info */}
                      <td className="admin-col-author">
                        <div className="author-cell">
                          <span className="author-name"><User size={12} className="inline-icon" /> {authorName}</span>
                          <span className="author-email"><Mail size={12} className="inline-icon" /> {authorEmail}</span>
                        </div>
                      </td>

                      {/* Time */}
                      <td className="admin-col-time">
                        <div className="time-cell">
                          <span><Calendar size={12} className="inline-icon" /> {formatDate(post.createdAt)}</span>
                        </div>
                      </td>

                      {/* Operations: Circular Compact Icon Buttons */}
                      <td className="admin-col-actions text-center">
                        <div className="admin-actions-circle-group">
                          <button
                            type="button"
                            className="action-circle-btn view"
                            title="Xem chi tiết bài đăng"
                            onClick={() => openDetailModal(post)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-circle-btn approve"
                            title="Phê duyệt tin đăng"
                            onClick={() => handleApprove(post._id)}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-circle-btn reject"
                            title="Từ chối phê duyệt"
                            onClick={() => openRejectModal(post)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: View Details */}
        {showDetailModal && selectedPost && (
          <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="admin-modal-content detail-modal animate-scale" onClick={(e) => e.stopPropagation()}>

              {/* Modal Header */}
              <div className="modal-header">
                <div>
                  <span className={`modal-type-badge ${selectedPost.postType === 'Tin VIP' ? 'vip' : 'normal'}`}>
                    {selectedPost.postType === 'Tin VIP' ? 'TIN VIP NỔI BẬT' : 'TIN ĐĂNG THƯỜNG'}
                  </span>
                  <h4>Chi tiết bài đăng chờ duyệt</h4>
                </div>
                <button type="button" className="modal-close-btn" onClick={() => setShowDetailModal(false)}>
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body-scroll">

                {/* Images Gallery */}
                <div className="modal-gallery-section">
                  {selectedPost.images && selectedPost.images.length > 0 ? (
                    <div className="gallery-layout">
                      <div className="main-image-box">
                        <img
                          src={selectedPost.images[activeImageIndex]}
                          alt="Room preview main"
                          className="gallery-main-img"
                        />
                      </div>
                      {selectedPost.images.length > 1 && (
                        <div className="thumbnail-list">
                          {selectedPost.images.map((imgUrl, idx) => (
                            <img
                              key={idx}
                              src={imgUrl}
                              alt={`Room preview ${idx}`}
                              className={`gallery-thumb-img ${activeImageIndex === idx ? 'active' : ''}`}
                              onClick={() => setActiveImageIndex(idx)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-images-box">
                      <FolderOpen size={36} />
                      <p>Bài đăng này không có hình ảnh minh họa.</p>
                    </div>
                  )}
                </div>

                {/* Listing Details */}
                <div className="modal-info-grid">
                  <div className="info-main">
                    <h3 className="post-detail-title">{selectedPost.title}</h3>
                    <p className="post-detail-address">
                      <MapPin size={14} className="inline-icon" /> {selectedPost.address}
                    </p>

                    <div className="specs-row">
                      <div className="spec-item">
                        <DollarSign size={16} className="spec-icon" />
                        <div>
                          <span className="spec-label">Giá thuê</span>
                          <span className="spec-value">{formatPrice(selectedPost.price)}</span>
                        </div>
                      </div>
                      <div className="spec-item">
                        <Maximize2 size={16} className="spec-icon" />
                        <div>
                          <span className="spec-label">Diện tích</span>
                          <span className="spec-value">{selectedPost.area} m²</span>
                        </div>
                      </div>
                      <div className="spec-item">
                        <Grid size={16} className="spec-icon" />
                        <div>
                          <span className="spec-label">Danh mục</span>
                          <span className="spec-value">
                            {selectedPost.categoryID?.categoryName || 'Chưa phân loại'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-section-block">
                      <h5>Mô tả chi tiết</h5>
                      <p className="detail-description-text">{selectedPost.description || 'Chủ trọ không cung cấp mô tả chi tiết.'}</p>
                    </div>

                    <div className="detail-section-block">
                      <h5>Tiện ích sẵn có</h5>
                      {selectedPost.utilities && selectedPost.utilities.length > 0 ? (
                        <div className="detail-utils-grid">
                          {selectedPost.utilities.map((util, i) => (
                            <div key={i} className="detail-util-badge">
                              <CheckCircle2 size={12} className="check-icon" />
                              <span>{util}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="muted-text">Không có thông tin tiện ích cụ thể.</p>
                      )}
                    </div>
                  </div>

                  <div className="info-sidebar">
                    <div className="author-card">
                      <h5>Người đăng tin</h5>
                      <div className="author-info-body">
                        <div className="info-row">
                          <User size={14} className="sidebar-icon" />
                          <div>
                            <span className="label">Họ và tên</span>
                            <span className="val">{selectedPost.userID?.fullName || selectedPost.contactName || 'Ẩn danh'}</span>
                          </div>
                        </div>
                        <div className="info-row">
                          <Mail size={14} className="sidebar-icon" />
                          <div>
                            <span className="label">Email</span>
                            <span className="val">{selectedPost.userID?.email || 'Chưa cung cấp'}</span>
                          </div>
                        </div>
                        <div className="info-row">
                          <Phone size={14} className="sidebar-icon" />
                          <div>
                            <span className="label">Số điện thoại</span>
                            <span className="val">{selectedPost.contactPhone || selectedPost.userID?.phoneNumber || 'Chưa cung cấp'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="quick-decision-card">
                      <h5>Quyết định duyệt</h5>
                      <p>Duyệt bài đăng để hiển thị lên trang chủ hoặc từ chối để chủ phòng chỉnh sửa lại.</p>
                      <div className="decision-actions">
                        <button
                          type="button"
                          className="decision-btn approve-btn"
                          onClick={() => handleApprove(selectedPost._id)}
                        >
                          <Check size={14} /> Phê duyệt ngay
                        </button>
                        <button
                          type="button"
                          className="decision-btn reject-btn"
                          onClick={() => openRejectModal(selectedPost)}
                        >
                          <X size={14} /> Từ chối duyệt
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Modal: Rejection Reason */}
        {showRejectModal && rejectingPost && (
          <div className="admin-modal-overlay select-modal-overlay" onClick={() => { setShowRejectModal(false); setRejectingPost(null); }}>
            <div className="admin-modal-content reject-modal animate-scale" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-header-icon-title">
                  <AlertCircle size={22} className="warning-icon-red" />
                  <h4>Từ chối phê duyệt</h4>
                </div>
                <button type="button" className="modal-close-btn" onClick={() => { setShowRejectModal(false); setRejectingPost(null); }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRejectSubmit}>
                <div className="modal-body">
                  <p className="reject-modal-tip">
                    Vui lòng cung cấp lý do chi tiết từ chối bài viết <strong>"{rejectingPost.title}"</strong> để chủ trọ nắm rõ lý do và tiến hành khắc phục.
                  </p>

                  <div className="form-group-reject">
                    <label htmlFor="reason-textarea">Lý do từ chối <span className="required-star">*</span></label>
                    <textarea
                      id="reason-textarea"
                      placeholder="Ví dụ: Hình ảnh mờ hoặc không thực tế, thông tin giá sai lệch, số điện thoại không liên lạc được..."
                      value={rejectionReason}
                      onChange={(e) => {
                        setRejectionReason(e.target.value);
                        if (e.target.value.trim()) setRejectError('');
                      }}
                      className={`reject-textarea ${rejectError ? 'error-border' : ''}`}
                      rows={4}
                    />
                    {rejectError && (
                      <span className="reject-error-msg">
                        <AlertCircle size={12} className="inline-icon" /> {rejectError}
                      </span>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="reject-btn-cancel"
                    onClick={() => { setShowRejectModal(false); setRejectingPost(null); }}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="reject-btn-confirm">
                    Xác nhận từ chối
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
