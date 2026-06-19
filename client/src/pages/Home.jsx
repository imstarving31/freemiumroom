import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  MessageSquare,
  CheckCircle,
  ShieldAlert,
  Info
} from 'lucide-react';
import RoomCard from '../components/RoomCard';
import Pagination from '../components/Pagination';
import './Home.css';

export default function Home() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [totalRooms, setTotalRooms] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [vipSuggestions, setVipSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingVip, setLoadingVip] = useState(false);
  const [error, setError] = useState(null);
  const pageChangeTriggeredRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const hasActiveFilters =
    searchParams.get('searchTerm') ||
    searchParams.get('categoryId') ||
    searchParams.get('province') ||
    searchParams.get('ward') ||
    searchParams.get('minPrice') ||
    searchParams.get('maxPrice') ||
    searchParams.get('minArea') ||
    searchParams.get('maxArea') ||
    searchParams.get('utilities');

  useEffect(() => {
    if (currentUser && currentUser.role === 'Admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  // Fetch posts from backend matching current searchParams
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams(searchParams);
        if (!params.has('limit')) {
          params.set('limit', '6');
        }
        if (!params.has('page')) {
          params.set('page', '1');
        }

        const queryString = params.toString();
        const url = `http://localhost:5000/api/room-posts?${queryString}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Không thể lấy danh sách tin đăng');
        }
        const data = await response.json();
        if (data.success) {
          setPosts(data.data);
          setTotalRooms(data.totalRooms || data.data.length);
          setTotalPages(data.totalPages || 1);
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
          const response = await fetch('http://localhost:5000/api/room-posts?postType=Tin+VIP&limit=3');
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

  // Handle smooth scroll after new page posts are loaded and rendered in the DOM
  useEffect(() => {
    if (pageChangeTriggeredRef.current) {
      const timer = setTimeout(() => {
        const element = document.getElementById('listings-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      pageChangeTriggeredRef.current = false;
      return () => clearTimeout(timer);
    }
  }, [posts]);

  const handlePageChange = (newPage) => {
    pageChangeTriggeredRef.current = true;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    navigate(`/?${newParams.toString()}`);
  };

  // Format price helper (e.g., 4.5 triệu/tháng)
  const formatPrice = (price) => {
    if (!price) return 'Liên hệ';
    const num = Number(price);
    if (num >= 1000000) {
      const million = num / 1000000;
      return `${million.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu/tháng`;
    }
    return `${num.toLocaleString('vi-VN')} đ/tháng`;
  };

  return (
    <div className="home-page">

      {/* 3. Listings Section */}
      <section className="listings-section" id="listings-section">
        <div className="section-header-row">
          <div className="title-block">
            <span className="small-cap-title">
              {hasActiveFilters ? 'SEARCH RESULTS' : 'TIN ĐĂNG DÀNH CHO BẠN'}
            </span>
            <h2 className="main-section-heading">
              {hasActiveFilters ? `Kết quả tìm kiếm (${totalRooms} phòng)` : 'Phòng trọ nổi bật & mới nhất'}
            </h2>
          </div>
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
          <>
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
            <Pagination
              currentPage={parseInt(searchParams.get('page')) || 1}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>


      {/* 4. How It Works Section */}
      <section className="how-it-works-section">
        <span className="small-cap-center">QUY TRÌNH ĐƠN GIẢN</span>
        <h2 className="center-section-heading">Cách thức hoạt động</h2>

        <div className="steps-container">
          <div className="step-card">
            <span className="step-number-bg">01</span>
            <div className="step-icon-wrapper search-step">
              <Search size={24} className="step-icon" />
            </div>
            <h4 className="step-title">1. Tìm kiếm</h4>
            <p className="step-description">
              Sử dụng bộ lọc thông minh để tìm thấy căn phòng phù hợp với ngân sách và vị trí mong muốn.
            </p>
          </div>

          <div className="step-card">
            <span className="step-number-bg">02</span>
            <div className="step-icon-wrapper chat-step">
              <MessageSquare size={24} className="step-icon" />
            </div>
            <h4 className="step-title">2. Liên hệ</h4>
            <p className="step-description">
              Kết nối trực tiếp với chủ nhà qua hệ thống tin nhắn hoặc gọi điện để xác nhận thông tin.
            </p>
          </div>

          <div className="step-card">
            <span className="step-number-bg">03</span>
            <div className="step-icon-wrapper rent-step">
              <CheckCircle size={24} className="step-icon" />
            </div>
            <h4 className="step-title">3. Thuê phòng</h4>
            <p className="step-description">
              Tiến hành xem phòng thực tế và ký kết hợp đồng thuê nhà một cách an toàn, minh bạch.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
