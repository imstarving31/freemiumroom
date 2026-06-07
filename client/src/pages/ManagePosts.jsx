import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Trash2, 
  Edit, 
  FolderOpen, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Eye
} from 'lucide-react';
import './ManagePosts.css';

export default function ManagePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { token } = useAuth();
  const navigate = useNavigate();

  // Helper to trigger custom toasts
  const showCustomToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Fetch posts from API
  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/room-posts/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setPosts(result.data || []);
      } else {
        setError(result.message || 'Không thể tải danh sách tin đăng.');
      }
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setError('Đã xảy ra lỗi khi kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyPosts();
    }
  }, [token]);

  // Handle Toggle Availability
  const handleToggleAvailability = async (postId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/room-posts/${postId}/availability`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        // Update local state
        setPosts((prevPosts) => 
          prevPosts.map((post) => 
            post._id === postId ? { ...post, isAvailable: result.data.isAvailable } : post
          )
        );
        showCustomToast(result.message || 'Cập nhật trạng thái phòng thành công!', 'success');
      } else {
        showCustomToast(result.message || 'Không thể cập nhật trạng thái phòng.', 'error');
      }
    } catch (err) {
      console.error('Error toggling availability:', err);
      showCustomToast('Lỗi kết nối. Vui lòng thử lại sau!', 'error');
    }
  };

  // Prompt delete modal
  const promptDelete = (post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (!postToDelete) return;
    try {
      setDeleting(true);
      const response = await fetch(`http://localhost:5000/api/room-posts/${postToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        // Remove item from state
        setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postToDelete._id));
        showCustomToast('Xóa tin đăng thành công!', 'success');
        setShowDeleteModal(false);
        setPostToDelete(null);
      } else {
        showCustomToast(result.message || 'Không thể xóa tin đăng.', 'error');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      showCustomToast('Lỗi kết nối. Vui lòng thử lại sau!', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Render post status badge with color
  const renderStatusBadge = (status) => {
    if (status === 'Hoạt động' || status === 'Approved') {
      return (
        <span className="status-badge active">
          <CheckCircle2 size={13} />
          Đang hiển thị
        </span>
      );
    } else if (status === 'Bị từ chối' || status === 'Rejected') {
      return (
        <span className="status-badge rejected">
          <XCircle size={13} />
          Bị từ chối
        </span>
      );
    } else {
      return (
        <span className="status-badge pending">
          <Clock size={13} />
          Chờ duyệt
        </span>
      );
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Liên hệ';
    const num = Number(price);
    if (num >= 1000000) {
      return `${(num / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr/th`;
    }
    return `${num.toLocaleString('vi-VN')} đ/th`;
  };

  return (
    <div className="manage-posts-page">
      <div className="manage-posts-container">
        
        {/* Header Section */}
        <div className="manage-header-row">
          <div className="header-left">
            <Link to="/" className="back-link">
              <ArrowLeft size={16} />
              <span>Về trang chủ</span>
            </Link>
            <h1 className="page-title">Quản lý tin đăng</h1>
            <p className="page-subtitle">Quản lý và cập nhật trạng thái các phòng trọ bạn đang cho thuê</p>
          </div>
          <button 
            type="button" 
            className="add-new-post-btn"
            onClick={() => navigate('/dang-tin')}
          >
            <Plus size={18} />
            <span>Đăng tin mới</span>
          </button>
        </div>

        {/* Loading and Error States */}
        {loading ? (
          <div className="manage-loading-state">
            <div className="spinner"></div>
            <p>Đang tải danh sách bài viết...</p>
          </div>
        ) : error ? (
          <div className="manage-error-state">
            <AlertCircle size={36} className="error-icon" />
            <p>Lỗi: {error}</p>
            <button onClick={fetchMyPosts} className="retry-btn">Tải lại</button>
          </div>
        ) : posts.length === 0 ? (
          // Empty State UI
          <div className="manage-empty-state">
            <div className="empty-icon-circle">
              <FolderOpen size={48} className="empty-icon" />
            </div>
            <h3>Bạn chưa có tin đăng nào</h3>
            <p>Đăng tin phòng trọ để bắt đầu tiếp cận hàng nghìn khách hàng tiềm năng trên hệ thống.</p>
            <button 
              type="button" 
              className="empty-action-btn"
              onClick={() => navigate('/dang-tin')}
            >
              Đăng tin ngay
            </button>
          </div>
        ) : (
          // Table Layout
          <div className="posts-table-wrapper">
            <table className="posts-table">
              <thead>
                <tr>
                  <th>Thông tin phòng</th>
                  <th className="text-center">Trạng thái duyệt</th>
                  <th className="text-center">Trạng thái phòng</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => {
                  const thumbnail = post.images && post.images.length > 0
                    ? post.images[0]
                    : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=200&auto=format&fit=crop';
                  
                  return (
                    <tr key={post._id} className="post-row-item">
                      {/* Room Details */}
                      <td className="col-info">
                        <div className="room-info-cell">
                          <img 
                            src={thumbnail} 
                            alt={post.title} 
                            className="room-thumbnail"
                            onError={(e) => { e.target.src = 'https://placehold.co/120x80?text=Hình+ảnh'; }}
                          />
                          <div className="room-text-details">
                            <h4 className="room-title" title={post.title}>{post.title}</h4>
                            <div className="room-meta-row">
                              <span className="room-price">{formatPrice(post.price)}</span>
                              <span className="bullet-dot">•</span>
                              <span className="room-area">{post.area} m²</span>
                              <span className="bullet-dot">•</span>
                              {post.postType === 'Tin VIP' ? (
                                <span className="type-badge vip">VIP</span>
                              ) : (
                                <span className="type-badge regular">Thường</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="col-status text-center">
                        {renderStatusBadge(post.status)}
                      </td>

                      {/* Room Availability Switch */}
                      <td className="col-availability text-center">
                        <div className="toggle-switch-wrapper">
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={post.isAvailable}
                              onChange={() => handleToggleAvailability(post._id, post.isAvailable)}
                            />
                            <span className="slider round"></span>
                          </label>
                          <span className={`availability-text ${post.isAvailable ? 'available' : 'rented'}`}>
                            {post.isAvailable ? 'Còn trống' : 'Đã cho thuê'}
                          </span>
                        </div>
                      </td>

                      {/* Operations */}
                      <td className="col-actions text-right">
                        <div className="action-buttons-group">
                          <button 
                            type="button" 
                            className="action-btn view" 
                            title="Xem chi tiết"
                            onClick={() => navigate(`/room/${post._id}`)}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            type="button" 
                            className="action-btn edit" 
                            title="Chỉnh sửa tin đăng"
                            onClick={() => navigate(`/edit-post/${post._id}`)}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            type="button" 
                            className="action-btn delete" 
                            title="Xóa tin đăng"
                            onClick={() => promptDelete(post)}
                          >
                            <Trash2 size={16} />
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

        {/* Custom Toast Alert */}
        {toast.show && (
          <div className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="delete-modal-header">
                <AlertCircle size={28} className="warning-icon" />
                <h4>Xóa bài đăng này?</h4>
              </div>
              <p className="delete-modal-text">
                Bạn có chắc chắn muốn xóa tin đăng <strong>"{postToDelete?.title}"</strong>? 
                Hành động này không thể hoàn tác và bài viết sẽ bị gỡ khỏi hệ thống.
              </p>
              <div className="delete-modal-actions">
                <button 
                  type="button" 
                  className="delete-btn-cancel" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  className="delete-btn-confirm" 
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Đang xóa...' : 'Đồng ý xóa'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
