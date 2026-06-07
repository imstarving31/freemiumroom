import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoomCard from '../components/RoomCard';
import { Heart, ArrowLeft, Info, ShieldAlert } from 'lucide-react';
import './FavoritePosts.css';

export default function FavoritePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://localhost:5000/api/users/favorites', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setPosts(result.data || []);
        } else {
          setError(result.message || 'Không thể tải danh sách tin đã lưu.');
        }
      } catch (err) {
        console.error('Error fetching favorite posts:', err);
        setError('Đã xảy ra lỗi khi kết nối đến máy chủ.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchFavorites();
    }
  }, [token]);

  const formatPrice = (price) => {
    if (!price) return 'Liên hệ';
    const num = Number(price);
    if (num >= 1000000) {
      const million = num / 1000000;
      return `${million.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr/th`;
    }
    return `${num.toLocaleString('vi-VN')} đ/th`;
  };

  return (
    <div className="favorites-page">
      <div className="favorites-container">
        <div className="favorites-header">
          <Link to="/" className="back-btn">
            <ArrowLeft size={16} />
            <span>Quay lại trang chủ</span>
          </Link>
          <div className="title-block">
            <div className="title-row">
              <Heart size={24} className="heart-icon-title" fill="#ef4444" color="#ef4444" />
              <h1 className="favorites-title">Tin đã lưu</h1>
            </div>
            <p className="favorites-subtitle">Danh sách các phòng trọ bạn đã lưu và quan tâm</p>
          </div>
        </div>

        {loading ? (
          <div className="favorites-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải danh sách tin đã lưu...</p>
          </div>
        ) : error ? (
          <div className="favorites-error">
            <ShieldAlert size={36} className="error-icon" />
            <p>Không thể tải dữ liệu: {error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="favorites-empty">
            <Info size={40} className="empty-icon" />
            <h3>Bạn chưa lưu tin nào</h3>
            <p>Hãy khám phá các phòng trọ hấp dẫn tại trang chủ và lưu lại tin đăng bạn ưng ý.</p>
            <Link to="/" className="explore-btn">
              Khám phá phòng trọ
            </Link>
          </div>
        ) : (
          <div className="listings-feed-container">
            {posts.map((post, index) => (
              <RoomCard
                key={post._id}
                post={post}
                index={index}
                formatPrice={formatPrice}
                onViewDetail={() => navigate(`/room/${post._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
