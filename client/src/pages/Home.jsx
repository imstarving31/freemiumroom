import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  MessageSquare,
  CheckCircle,
  PhoneCall,
  ShieldCheck,
  MapPin,
  Maximize2,
  ChevronDown,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import RoomCard from '../components/RoomCard';
import './Home.css';

export default function Home() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [vipSuggestions, setVipSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingVip, setLoadingVip] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (currentUser && currentUser.role === 'Admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  // Check if any filters are active
  const hasActiveFilters =
    searchParams.get('searchTerm') ||
    searchParams.get('categoryId') ||
    searchParams.get('province') ||
    searchParams.get('district') ||
    searchParams.get('ward') ||
    searchParams.get('minPrice') ||
    searchParams.get('maxPrice') ||
    searchParams.get('minArea') ||
    searchParams.get('maxArea') ||
    searchParams.get('utilities');

  // Fetch posts from backend matching current searchParams
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const queryString = searchParams.toString();
        const url = queryString
          ? `http://localhost:5000/api/room-posts?${queryString}`
          : 'http://localhost:5000/api/room-posts';

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Không thể lấy danh sách tin đăng');
        }
        const data = await response.json();
        if (data.success) {
          setPosts(data.data);
        } else {
          throw new Error(data.message || 'Lỗi không xác định');
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [searchParams]);

  // Fetch VIP Suggestions if search results are empty
  useEffect(() => {
    if (!loading && posts.length === 0) {
      const fetchVipSuggestions = async () => {
        try {
          setLoadingVip(true);
          const response = await fetch('http://localhost:5000/api/room-posts?postType=Tin+VIP');
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setVipSuggestions(data.data);
            }
          }
        } catch (err) {
          console.error('Error fetching VIP suggestions:', err);
        } finally {
          setLoadingVip(false);
        }
      };
      fetchVipSuggestions();
    }
  }, [posts, loading]);

  // Format price helper (e.g., 4500000 -> 4.5 triệu/tháng)
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
    <div className="home-page">

      {/* 3. Listings Section */}
      <section className="listings-section" id="listings-section">
        <div className="section-header-row">
          <div className="title-block">
            <span className="small-cap-title">
              {hasActiveFilters ? 'SEARCH RESULTS' : 'LATEST LISTINGS'}
            </span>
            <h2 className="main-section-heading">
              {hasActiveFilters ? `Kết quả tìm kiếm (${posts.length} phòng)` : 'Phòng mới nhất dành cho bạn'}
            </h2>
          </div>
          {!hasActiveFilters && (
            <a href="#tat-ca" className="see-all-link">
              Xem tất cả phòng
              <ArrowRight size={16} style={{ marginLeft: '4px' }} />
            </a>
          )}
        </div>

        {loading ? (
          <div className="listings-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải danh sách phòng trọ...</p>
          </div>
        ) : error ? (
          <div className="listings-error">
            <ShieldAlert size={36} className="error-icon" />
            <p>Không thể tải dữ liệu: {error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-results-wrapper">
            <div className="listings-empty" style={{ marginBottom: '40px' }}>
              <Info size={36} className="empty-icon" style={{ color: '#0284c7' }} />
              <h3 style={{ fontSize: '20px', color: '#0f172a', margin: '12px 0 6px 0' }}>Không tìm thấy phòng trọ phù hợp</h3>
              <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '400px', margin: '0 auto 16px auto' }}>
                Chúng tôi không tìm thấy kết quả phù hợp với các tiêu chí tìm kiếm của bạn. Hãy thử thay đổi bộ lọc hoặc xem danh sách gợi ý tin VIP bên dưới.
              </p>
            </div>

            {/* VIP Suggestions inside Empty State */}
            {vipSuggestions.length > 0 && (
              <div className="vip-suggestions-container">
                <div className="section-header-row" style={{ marginTop: '20px', marginBottom: '24px' }}>
                  <div className="title-block">
                    <span className="small-cap-title" style={{ color: '#ef4444' }}>TIN VIP NỔI BẬT</span>
                    <h2 className="main-section-heading" style={{ fontSize: '22px' }}>Phòng trọ VIP nổi bật đề xuất cho bạn</h2>
                  </div>
                </div>
                <div className="listings-feed-container">
                  {vipSuggestions.map((post, index) => (
                    <RoomCard 
                      key={post._id}
                      post={post}
                      index={index}
                      formatPrice={formatPrice}
                      onViewDetail={() => navigate(`/room/${post._id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
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
      </section>


      {/* 4. How It Works Section */}
      <section className="how-it-works-section">
        <span className="small-cap-center">QUY TRÌNH ĐƠN GIẢN</span>
        <h2 className="center-section-heading">Cách thức hoạt động</h2>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-icon-wrapper search-step">
              <Search size={22} className="step-icon" />
            </div>
            <h4 className="step-title">1. Tìm kiếm</h4>
            <p className="step-description">
              Sử dụng bộ lọc thông minh để tìm thấy căn phòng phù hợp với ngân sách và vị trí mong muốn.
            </p>
          </div>

          <div className="step-card">
            <div className="step-icon-wrapper chat-step">
              <MessageSquare size={22} className="step-icon" />
            </div>
            <h4 className="step-title">2. Liên hệ</h4>
            <p className="step-description">
              Kết nối trực tiếp với chủ nhà qua hệ thống tin nhắn hoặc gọi điện để xác nhận thông tin.
            </p>
          </div>

          <div className="step-card">
            <div className="step-icon-wrapper rent-step">
              <CheckCircle size={22} className="step-icon" />
            </div>
            <h4 className="step-title">3. Thuê phòng</h4>
            <p className="step-description">
              Tiến hành xem phòng thực tế và ký kết hợp đồng thuê nhà một cách an toàn, minh bạch.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Banner & Stats Section */}
      <section className="banner-stats-section">
        <div className="banner-stats-grid">
          {/* Main Visual Banner */}
          <div className="promo-banner-card">
            <div className="banner-image-overlay"></div>
            <div className="banner-text-content">
              <h3 className="banner-promo-title">
                Trải nghiệm sống đẳng<br />cấp tại các căn hộ dịch<br />vụ
              </h3>
              <p className="banner-promo-desc">
                Khám phá danh sách các căn hộ full nội thất, dịch vụ dọn dẹp chuyên nghiệp với mức giá ưu đãi nhất
              </p>
              <button className="banner-action-btn">Khám phá ngay</button>
            </div>
          </div>

          {/* Right Cards Stack */}
          <div className="stats-stack">
            {/* Support 24/7 Card */}
            <div className="stat-card support-card">
              <div className="stat-icon-circle">
                <PhoneCall size={20} />
              </div>
              <h4 className="stat-card-title">Hỗ trợ 24/7</h4>
              <p className="stat-card-desc">
                Đội ngũ chuyên viên luôn sẵn sàng giải đáp mọi thắc mắc của bạn trong quá trình tìm thuê.
              </p>
            </div>

            {/* Verification 100% Card */}
            <div className="stat-card verify-card">
              <div className="stat-icon-circle">
                <ShieldCheck size={20} />
              </div>
              <h4 className="stat-card-title">Xác thực 100%</h4>
              <p className="stat-card-desc">
                Mọi tin đăng đều được kiểm duyệt kỹ lưỡng để đảm bảo tính xác thực và an toàn.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
