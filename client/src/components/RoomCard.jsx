import React from 'react';
import { MapPin, Maximize2, Heart, User, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './RoomCard.css';

export default function RoomCard({ post, index, formatPrice, onViewDetail }) {
  const { currentUser, token, updateUser } = useAuth();
  const navigate = useNavigate();

  const favoritePosts = currentUser?.favoritePosts || [];
  const isSaved = favoritePosts.includes(post._id);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để sử dụng chức năng lưu tin');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/favorites/${post._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(data.message);
        const updatedUser = { ...currentUser, favoritePosts: data.favoritePosts };
        updateUser(updatedUser);
      } else {
        toast.error(data.message || 'Có lỗi xảy ra khi xử lý lưu tin');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
    }
  };

  const formatPriceLocal = (price) => {
    if (!price) return 'Liên hệ';
    const num = Number(price);
    if (num >= 1000000) {
      const million = num / 1000000;
      return `${million.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu/tháng`;
    }
    return `${num.toLocaleString('vi-VN')} đ/tháng`;
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Vừa xong';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    const months = Math.floor(days / 30);
    return `${months} tháng trước`;
  };

  // Get first image or a placeholder
  const coverImage = post.images && post.images.length > 0
    ? post.images[0]
    : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop';

  const displayArea = post.area || (20 + (index * 5));
  const displayType = post.categoryId?.categoryName || post.categoryID?.categoryName || (index % 2 === 0 ? '1 PN' : 'Ở ghép');
  const priceText = formatPrice ? formatPrice(post.price) : formatPriceLocal(post.price);
  const contactPhone = post.userID?.phoneNumber || post.contactPhone || '';

  return (
    <div className={`feed-room-card ${post.postType === 'Tin VIP' ? 'vip-suggested-card' : 'regular-room-card'}`} onClick={onViewDetail}>
      <div className="card-media-wrapper">
        <img
          src={coverImage}
          alt={post.title}
          className="card-media-img"
          onError={(e) => {
            e.target.onerror = null; // Ngăn ngừa lặp vô hạn nếu ảnh thay thế cũng lỗi
            e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="600" font-size="14" fill="%2394a3b8">Hình ảnh phòng</text></svg>';
          }}
        />

        {/* VIP badge or regular badge */}
        {post.postType === 'Tin VIP' ? (
          <span className="card-vip-badge">TIN VIP</span>
        ) : (
          <span className="card-regular-badge">Tin thường</span>
        )}

        {/* Heart button */}
        <button
          className={`card-heart-btn ${isSaved ? 'saved' : ''}`}
          onClick={handleFavoriteClick}
          title={isSaved ? 'Bỏ lưu tin' : 'Lưu tin'}
        >
          <Heart size={18} fill={isSaved ? "#ef4444" : "none"} color={isSaved ? "#ef4444" : "currentColor"} />
        </button>
      </div>

      <div className="card-details-info">
        {/* Dòng 1 & Dòng 2: Tiêu đề + Giá */}
        <div className="card-header-row">
          <h4 className="card-title-text" title={post.title}>
            {post.title}
          </h4>
          <span className="card-price-text">{priceText}</span>
        </div>

        {/* Dòng 3 (Thông tin phụ): Diện tích + Loại phòng */}
        <div className="card-specs-row">
          <div className="spec-item-cell">
            <Maximize2 size={13} className="spec-item-icon" />
            <span>{displayArea} m²</span>
          </div>
          <div className="spec-item-divider"></div>
          <div className="spec-item-cell">
            <span>{displayType}</span>
          </div>
        </div>

        {/* Dòng 4: Địa chỉ */}
        <div className="card-location-row">
          <MapPin size={14} className="location-pin-icon" />
          <span>{post.address}</span>
        </div>

        {/* Đường chia ngang */}
        <div className="card-divider"></div>

        {/* Footer */}
        <div className="card-footer-row">
          <div className="footer-contact-info">
            <User size={13} className="footer-icon" />
            <span>{post.userID?.fullName || post.contactName || 'Chủ nhà'}</span>
            {contactPhone && (
              <span className="contact-phone-badge">{contactPhone}</span>
            )}
          </div>
          <div className="footer-time-info">
            <Clock size={13} className="footer-icon" />
            <span>{formatTimeAgo(post.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
