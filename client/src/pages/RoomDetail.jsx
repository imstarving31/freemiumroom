import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Wifi,
  Wind,
  WashingMachine,
  Tv,
  Flame,
  Car,
  Key,
  Triangle,
  ShowerHead,
  Shirt,
  Home as HomeIcon,
  MapPin,
  Star,
  Share2,
  Heart,
  ShieldCheck,
  ChevronRight,
  PhoneCall,
  MessageSquare
} from 'lucide-react';
import './RoomDetail.css';

// Map utility labels to Lucide Icons
const UTILITY_MAP = {
  'Wifi': Wifi,
  'Điều hòa': Wind,
  'Máy giặt': WashingMachine,
  'Tủ lạnh': Tv,
  'Nóng lạnh': Flame,
  'Bãi đỗ xe': Car,
  'Tự do đi lại': Key,
  'Gác lửng': Triangle,
  'Khép kín': ShowerHead,
  'Tủ quần áo': Shirt
};

export default function RoomDetail() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const openLightbox = (index) => {
    setPhotoIndex(index);
    setLightboxOpen(true);
  };

  const handleShareClick = () => {
    const detailUrl = window.location.href;
    navigator.clipboard.writeText(detailUrl)
      .then(() => {
        setCopied(true);
        toast.success('Đã sao chép đường dẫn bài đăng vào bộ nhớ tạm!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
        toast.error('Không thể sao chép liên kết.');
      });
  };

  const { currentUser, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const favoritePosts = currentUser?.favoritePosts || [];
  const isSaved = room ? favoritePosts.includes(room._id) : false;

  const handleFavoriteClick = async () => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để sử dụng chức năng lưu tin');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/favorites/${room._id}`, {
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
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
    }
  };

  // Fetch room post detail on mount / id change
  useEffect(() => {
    const fetchRoomDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/room-posts/${id}`);
        const result = await response.json();

        if (response.ok && result.success) {
          setRoom(result.data);
        } else {
          setError(result.message || 'Không thể tìm thấy thông tin phòng trọ.');
        }
      } catch (err) {
        console.error('Error fetching room detail:', err);
        setError('Đã xảy ra lỗi khi kết nối đến máy chủ.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRoomDetail();
    }
  }, [id]);

  const formatPriceShort = (price) => {
    if (!price) return '0đ';
    if (price >= 1000000) {
      const million = price / 1000000;
      return `${million.toFixed(1).replace('.0', '')}Tr`;
    }
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0đ';
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  // Loading UI State
  if (loading) {
    return (
      <div className="room-detail-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #0284c7',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500' }}>Đang tải thông tin phòng trọ...</p>
        </div>
      </div>
    );
  }

  // Error/404 UI State
  if (error || !room) {
    return (
      <div className="room-detail-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '32px 24px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#ef4444', fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Không tìm thấy phòng</h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
            {error || 'Bài đăng này không tồn tại hoặc đã bị gỡ bỏ.'}
          </p>
          <Link to="/" style={{
            display: 'inline-block',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            padding: '10px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}>
            Quay lại Trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Safe image array parsing
  const images = room.images && room.images.length > 0 ? room.images : [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop'
  ];

  const ratingMock = 4.92;
  const reviewsMockCount = 120;

  // Extract host details safely
  const hostName = room.userID?.fullName || room.contactName || 'Chủ nhà';
  const hostAvatar = room.userID?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop';
  const hostPhone = room.contactPhone || room.userID?.phoneNumber || 'Chưa cung cấp';

  return (
    <div className="room-detail-page">
      <div className="room-detail-container">

        {/* 1. Header Title Block */}
        <div className="room-title-block">
          {room.postType === 'Tin VIP' && (
            <div style={{ marginBottom: '8px' }}>
              <span
                style={{
                  backgroundColor: '#ef4444',
                  color: '#fde047',
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  display: 'inline-block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                TIN VIP NỔI BẬT
              </span>
            </div>
          )}
          <h1 className="room-detail-title">{room.title}</h1>
          <div className="room-meta-row">
            <div className="meta-left">
              <span className="meta-item location-meta">
                <MapPin size={13} />
                {room.address}
              </span>
            </div>

            <div className="meta-right">
              <button 
                className={`meta-action-btn ${copied ? 'copied' : ''}`}
                onClick={handleShareClick}
              >
                <Share2 size={14} />
                <span>{copied ? 'Đã copy link!' : 'Chia sẻ'}</span>
              </button>
              <button
                className={`meta-action-btn ${isSaved ? 'saved' : ''}`}
                onClick={handleFavoriteClick}
              >
                <Heart size={14} fill={isSaved ? "#ef4444" : "none"} color={isSaved ? "#ef4444" : "currentColor"} />
                <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Image Gallery Grid */}
        {images.length === 1 ? (
          <div className="room-gallery-grid single-image">
            <div className="gallery-main-col" style={{ cursor: 'pointer' }} onClick={() => openLightbox(0)}>
              <img src={images[0]} alt="Room Preview" className="img-gallery-main" onError={(e) => {
                e.target.src = 'https://placehold.co/1200x800?text=Hình+ảnh+phòng+trọ';
              }} />
            </div>
            <button className="show-all-photos-btn" onClick={() => openLightbox(0)}>
              <span>Hiển thị tất cả {images.length} ảnh</span>
            </button>
          </div>
        ) : images.length === 2 ? (
          <div className="room-gallery-grid two-images">
            <div className="gallery-main-col" style={{ cursor: 'pointer' }} onClick={() => openLightbox(0)}>
              <img src={images[0]} alt="Room Preview 1" className="img-gallery-main" onError={(e) => {
                e.target.src = 'https://placehold.co/1200x800?text=Hình+ảnh+phòng+trọ';
              }} />
            </div>
            <div className="gallery-main-col" style={{ cursor: 'pointer' }} onClick={() => openLightbox(1)}>
              <img src={images[1]} alt="Room Preview 2" className="img-gallery-main" onError={(e) => {
                e.target.src = 'https://placehold.co/1200x800?text=Hình+ảnh+phòng+trọ';
              }} />
            </div>
            <button className="show-all-photos-btn" onClick={() => openLightbox(0)}>
              <span>Hiển thị tất cả {images.length} ảnh</span>
            </button>
          </div>
        ) : (
          <div className="room-gallery-grid">
            <div className="gallery-main-col" style={{ cursor: 'pointer' }} onClick={() => openLightbox(0)}>
              <img src={images[0]} alt="Room Preview Main" className="img-gallery-main" onError={(e) => {
                e.target.src = 'https://placehold.co/1200x800?text=Hình+ảnh+phòng+trọ';
              }} />
            </div>
            <div className="gallery-side-col">
              <img src={images[1]} alt="Room Preview Sub 1" className="img-gallery-side" style={{ cursor: 'pointer' }} onClick={() => openLightbox(1)} onError={(e) => {
                e.target.src = 'https://placehold.co/600x400?text=Hình+ảnh+phòng+trọ';
              }} />
              <div className="sub-image-wrapper" style={{ cursor: 'pointer' }} onClick={() => openLightbox(2)}>
                <img src={images[2]} alt="Room Preview Sub 2" className="img-gallery-side" onError={(e) => {
                  e.target.src = 'https://placehold.co/600x400?text=Hình+ảnh+phòng+trọ';
                }} />
                {images.length > 3 && (
                  <div className="gallery-overlay">
                    <span>+{images.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
            <button className="show-all-photos-btn" onClick={() => openLightbox(0)}>
              <span>Hiển thị tất cả {images.length} ảnh</span>
            </button>
          </div>
        )}

        {/* 3. Main Content Split Layout */}
        <div className="room-content-split">

          {/* Left Column: Details */}
          <div className="content-left-col">

            {/* Owner Section */}
            <div className="room-owner-summary">
              <div className="owner-text">
                <h2>{room.categoryId?.categoryName || room.categoryID?.categoryName || 'Phòng cho thuê'} bởi {hostName}</h2>
                <p>Diện tích: {room.area} m²</p>
              </div>
              <img src={hostAvatar} alt={hostName} className="owner-avatar-img" onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop';
              }} />
            </div>

            {/* Amenities Section */}
            <div className="room-section-block amenities-section">
              <h3 className="block-title">Tiện ích phòng trọ sẵn có</h3>
              <div className="amenities-grid">
                {room.utilities && room.utilities.length > 0 ? (
                  room.utilities.map((item, index) => {
                    const Icon = UTILITY_MAP[item] || HomeIcon;
                    return (
                      <div key={index} className="amenity-card">
                        <div className="amenity-icon-box">
                          <Icon size={18} />
                        </div>
                        <span className="amenity-label">{item}</span>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: '#64748b', fontSize: '14.5px', gridColumn: 'span 2' }}>Không có thông tin tiện ích cụ thể.</p>
                )}
              </div>
            </div>

            {/* Description Section */}
            <div className="room-section-block description-section">
              <h3 className="block-title">Mô tả chi tiết</h3>
              <div className={`description-content ${showFullDesc ? 'expanded' : ''}`}>
                <p style={{ whiteSpace: 'pre-wrap' }}>
                  {room.description || 'Không có mô tả chi tiết từ chủ nhà.'}
                </p>
              </div>
              {room.description && room.description.length > 200 && (
                <button
                  className="read-more-desc-btn"
                  onClick={() => setShowFullDesc(!showFullDesc)}
                >
                  {showFullDesc ? 'Ẩn bớt' : 'Xem thêm'}
                  <ChevronRight size={14} className={`caret-icon ${showFullDesc ? 'rotated' : ''}`} />
                </button>
              )}
            </div>

            {/* Maps Section */}
            <div className="room-section-block maps-section">
              <h3 className="block-title">Bản đồ vị trí</h3>
              <div className="mock-map-container" style={{ height: '320px' }}>
                <iframe
                  title="Google Maps Location"
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(room.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Pricing Sidebar */}
          <div className="content-right-col">
            <div className="sticky-sidebar-card">

              {/* Card Header Price */}
              <div className="sidebar-card-header">
                <div className="sidebar-price">
                  <span className="price-num">{formatCurrency(room.price)}</span>
                  <span className="price-unit">/tháng</span>
                </div>
              </div>

              {/* Host Quick Box */}
              <div className="host-quick-box">
                <img src={hostAvatar} alt={hostName} className="host-quick-avatar" onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop';
                }} />
                <div className="host-quick-text">
                  <span className="host-badge-label">LIÊN HỆ CHỦ NHÀ</span>
                  <h4 className="host-quick-name">{hostName}</h4>
                </div>
              </div>

              {/* Actions */}
              <div className="sidebar-actions-stack">
                <a href={`tel:${hostPhone}`} className="contact-host-btn">
                  <PhoneCall size={16} />
                  <span>Gọi {hostPhone}</span>
                </a>

                <button
                  className={`save-post-sidebar-btn ${isSaved ? 'active' : ''}`}
                  onClick={handleFavoriteClick}
                >
                  <Heart size={16} fill={isSaved ? "#ef4444" : "none"} />
                  <span>{isSaved ? 'Đã lưu tin' : 'Lưu tin'}</span>
                </button>
              </div>

              <p className="sidebar-muted-tip">Bảo mật thông tin thanh toán & an toàn giao dịch</p>

            </div>

            {/* Verification Under Sidebar */}
            <div className="sidebar-verification-card">
              <ShieldCheck size={20} className="shield-icon" />
              <p className="verify-text">
                Chủ nhà đã xác minh. Hãy luôn liên hệ qua các kênh chính thức của FreemiumRoom để bảo vệ quyền lợi của bạn.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="room-lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <button className="lightbox-close-btn" onClick={() => setLightboxOpen(false)}>
            &times;
          </button>
          
          <button 
            className="lightbox-arrow-btn prev" 
            onClick={(e) => {
              e.stopPropagation();
              setPhotoIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
            }}
          >
            &#8249;
          </button>
          
          <div className="lightbox-image-container" onClick={(e) => e.stopPropagation()}>
            <img 
              src={images[photoIndex]} 
              alt={`Room Photo ${photoIndex + 1}`} 
              className="lightbox-main-img" 
              onError={(e) => {
                e.target.src = 'https://placehold.co/1200x800?text=Hình+ảnh+phòng+trọ';
              }}
            />
            <div className="lightbox-counter">
              Ảnh {photoIndex + 1} / {images.length}
            </div>
          </div>
          
          <button 
            className="lightbox-arrow-btn next" 
            onClick={(e) => {
              e.stopPropagation();
              setPhotoIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            }}
          >
            &#8250;
          </button>
        </div>
      )}
    </div>
  );
}
