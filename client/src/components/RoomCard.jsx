import React from 'react';
import { MapPin, Maximize2, Heart } from 'lucide-react';
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
  // Get first image or a placeholder
  const coverImage = post.images && post.images.length > 0
    ? post.images[0]
    : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop';

  const displayAreaText = post.area ? `${post.area} m²` : 'Đang cập nhật';
  const displayType = post.categoryId?.categoryName || post.categoryID?.categoryName || 'Chưa phân loại';

  return (
    <div className="feed-room-card" onClick={onViewDetail}>
      <div className="card-media-wrapper">
        <img 
          src={coverImage} 
          alt={post.title} 
          className="card-media-img" 
          onError={(e) => {
            e.target.src = 'https://placehold.co/400x300?text=Hình+ảnh+phòng';
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
        
        {/* Price tag */}
        <span className="card-price-tag">{formatPrice(post.price)}</span>
      </div>

      <div className="card-details-info">
        <h4 className="card-title-text" title={post.title}>
          {post.title}
        </h4>

        <div className="card-location-row">
          <MapPin size={14} className="location-pin-icon" />
          <span>{post.address}</span>
        </div>

        <div className="card-specs-row">
          <div className="spec-item-cell">
            <Maximize2 size={13} className="spec-item-icon" />
            <span>{displayAreaText}</span>
          </div>
          <div className="spec-item-divider"></div>
          <div className="spec-item-cell">
            <span>{displayType}</span>
          </div>
        </div>

        <button 
          className="card-action-view-btn"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail();
          }}
        >
          Xem chi tiết phòng
        </button>
      </div>
    </div>
  );
}
