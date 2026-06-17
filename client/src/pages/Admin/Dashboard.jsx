import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Users,
  FileText,
  Clock,
  DollarSign,
  Download,
  Loader2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import './Dashboard.css';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f43f5e'];

// Custom Bar Chart Component (Revenue)
function CustomBarChart({ data }) {
  if (!data || data.length === 0 || data.reduce((sum, d) => sum + (d.revenue || 0), 0) === 0) {
    return (
      <div className="chart-empty-state">
        <div className="empty-state-content">
          <AlertCircle size={24} className="text-gray" />
          <p>Không có dữ liệu doanh thu trong khoảng thời gian này</p>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue || 0), 100000);

  return (
    <div className="custom-bar-chart-wrapper">
      <div className="chart-y-axis-labels">
        {[4, 3, 2, 1, 0].map(i => {
          const val = (maxRevenue / 4) * i;
          return (
            <span key={i}>
              {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val.toLocaleString('vi-VN')}
            </span>
          );
        })}
      </div>
      
      <div className="chart-bars-area">
        {data.map((item, index) => {
          const heightPercent = ((item.revenue || 0) / maxRevenue) * 100;
          return (
            <div key={index} className="chart-bar-column">
              <div className="bar-container">
                <div 
                  className="bar-fill" 
                  style={{ height: `${heightPercent || 1}%` }}
                >
                  <div className="bar-tooltip">
                    <span className="tooltip-month">{item.time}</span>
                    <span className="tooltip-value">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.revenue || 0)}
                    </span>
                  </div>
                </div>
              </div>
              <span className="bar-label">{item.time.split(' (')[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Custom Post Time Chart Component (Room Posts Count)
function CustomPostTimeChart({ data }) {
  if (!data || data.length === 0 || data.reduce((sum, d) => sum + (d.count || 0), 0) === 0) {
    return (
      <div className="chart-empty-state">
        <div className="empty-state-content">
          <AlertCircle size={24} className="text-gray" />
          <p>Không có dữ liệu bài đăng trong khoảng thời gian này</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count || 0), 5);

  return (
    <div className="custom-bar-chart-wrapper posts-time-chart">
      <div className="chart-y-axis-labels">
        {[4, 3, 2, 1, 0].map(i => {
          const val = Math.round((maxCount / 4) * i);
          return (
            <span key={i}>{val}</span>
          );
        })}
      </div>
      
      <div className="chart-bars-area">
        {data.map((item, index) => {
          const heightPercent = ((item.count || 0) / maxCount) * 100;
          return (
            <div key={index} className="chart-bar-column">
              <div className="bar-container">
                <div 
                  className="bar-fill posts-bar-fill" 
                  style={{ height: `${heightPercent || 1}%` }}
                >
                  <div className="bar-tooltip">
                    <span className="tooltip-month">{item.time}</span>
                    <span className="tooltip-value">{item.count} bài đăng</span>
                  </div>
                </div>
              </div>
              <span className="bar-label">{item.time.split(' (')[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Custom Donut Chart Component
function CustomDonutChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16

  const [hoveredSlice, setHoveredSlice] = useState(null);

  if (total === 0 || !data || data.length === 0) {
    return (
      <div className="chart-empty-state">
        <div className="empty-state-content">
          <AlertCircle size={24} className="text-gray" />
          <p>Không có dữ liệu khu vực trong khoảng thời gian này</p>
        </div>
      </div>
    );
  }

  let accumulatedPercent = 0;

  return (
    <div className="custom-donut-chart-wrapper">
      <div className="donut-svg-container">
        <svg viewBox="0 0 140 140" className="donut-svg">
          <circle cx="70" cy="70" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
          {data.map((entry, index) => {
            const percentage = entry.value / total;
            const strokeDasharray = `${percentage * circumference} ${circumference}`;
            const rotateAngle = -90 + (accumulatedPercent * 360);
            accumulatedPercent += percentage;
            
            const color = PIE_COLORS[index % PIE_COLORS.length];
            const isHovered = hoveredSlice === index;

            return (
              <circle
                key={entry.name}
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={isHovered ? 20 : 16}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={0}
                transform={`rotate(${rotateAngle} 70 70)`}
                style={{
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredSlice(index)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            );
          })}
        </svg>
        
        {/* Tooltip in center of Donut Chart */}
        <div className="donut-center-info">
          {hoveredSlice !== null ? (
            <>
              <span className="donut-center-label">{data[hoveredSlice].name}</span>
              <span className="donut-center-value">{data[hoveredSlice].value} bài ({((data[hoveredSlice].value / total) * 100).toFixed(0)}%)</span>
            </>
          ) : (
            <>
              <span className="donut-center-label">Tổng tin đăng</span>
              <span className="donut-center-value" style={{ fontSize: '18px', fontWeight: '800' }}>{total}</span>
            </>
          )}
        </div>
      </div>
      
      {/* Legend list below */}
      <div className="pie-legend-container">
        {data.slice(0, 4).map((entry, index) => (
          <div 
            key={entry.name} 
            className={`pie-legend-item ${hoveredSlice === index ? 'active' : ''}`}
            onMouseEnter={() => setHoveredSlice(index)}
            onMouseLeave={() => setHoveredSlice(null)}
            style={{ cursor: 'pointer', transition: 'all 0.2s ease', padding: '4px 8px', borderRadius: '6px' }}
          >
            <span className="legend-dot" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
            <span className="legend-text" title={entry.name}>{entry.name}</span>
            <span className="legend-value">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function Dashboard() {
  const { token } = useAuth();
  const [timeRange, setTimeRange] = useState('month');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalRoomPosts: 0,
    pendingRoomPosts: 0,
    totalRevenue: 0
  });
  const [postsTimeData, setPostsTimeData] = useState([]);
  const [postsRegionData, setPostsRegionData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  
  // UI states
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef(null);

  // Click outside handler for export dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch all dashboard data dynamically based on timeRange
  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      let queryParams = `timeRange=${timeRange}`;
      if (timeRange === 'custom') {
        queryParams += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const [overviewRes, postsTimeRes, postsRegionRes, revenueRes] = await Promise.all([
        fetch(`http://localhost:5000/api/stats/overview?${queryParams}`, { headers }),
        fetch(`http://localhost:5000/api/stats/posts-by-time?${queryParams}`, { headers }),
        fetch(`http://localhost:5000/api/stats/posts-by-region?${queryParams}`, { headers }),
        fetch(`http://localhost:5000/api/stats/revenue?${queryParams}`, { headers })
      ]);

      if (!overviewRes.ok || !postsTimeRes.ok || !postsRegionRes.ok || !revenueRes.ok) {
        throw new Error('Không thể tải một hoặc nhiều nguồn dữ liệu thống kê.');
      }

      const [overviewData, postsTimeJson, postsRegionJson, revenueJson] = await Promise.all([
        overviewRes.json(),
        postsTimeRes.json(),
        postsRegionRes.json(),
        revenueRes.json()
      ]);

      if (overviewData.success) setOverview(overviewData.data);
      if (postsTimeJson.success) setPostsTimeData(postsTimeJson.data || []);
      if (postsRegionJson.success) setPostsRegionData(postsRegionJson.data || []);
      if (revenueJson.success) setRevenueData(revenueJson.data || []);

    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
      setError(err.message || 'Lỗi kết nối đến máy chủ.');
      toast.error(err.message || 'Lỗi khi tải dữ liệu thống kê.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange, startDate, endDate, token]);

  // Handle report export (excel or csv)
  const handleExport = async (format) => {
    if (!token) return;
    try {
      toast.info(`Đang tạo báo cáo dạng ${format.toUpperCase()}...`, { autoClose: 2000 });
      setShowExportDropdown(false);

      let queryParams = `timeRange=${timeRange}`;
      if (timeRange === 'custom') {
        queryParams += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(`http://localhost:5000/api/stats/export?${queryParams}&format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = 'Xuất báo cáo thất bại.';
        try {
          const json = JSON.parse(text);
          errorMsg = json.message || errorMsg;
        } catch (e) {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const fileExt = format === 'csv' ? 'csv' : 'xlsx';
      let timeLabel = timeRange;
      if (timeRange === 'custom') {
        timeLabel = `${startDate}_to_${endDate}`;
      } else {
        timeLabel = timeRange === 'day' ? 'hom_nay' : timeRange === 'week' ? 'tuan_nay' : timeRange === 'month' ? 'thang_nay' : 'nam_nay';
      }
      link.download = `bao_cao_thong_ke_${timeLabel}.${fileExt}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Tải xuống báo cáo thành công!');
    } catch (err) {
      console.error('Error exporting report:', err);
      toast.error(err.message || 'Đã xảy ra lỗi khi xuất báo cáo.');
    }
  };

  if (loading && !overview.totalUsers) {
    return (
      <div className="admin-dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-loading-box">
            <Loader2 className="spin-icon text-blue" size={40} />
            <p className="loading-text">Đang tải dữ liệu thống kê...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !overview.totalUsers) {
    return (
      <div className="admin-dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-error-box">
            <AlertCircle size={40} className="text-red" />
            <h3>Đã xảy ra lỗi</h3>
            <p>{error}</p>
            <button className="btn-retry" onClick={fetchData}>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="dashboard-container">
        
        {/* Topbar: Title Area */}
        <div className="dashboard-title-area">
          <h1 className="dashboard-title">Thống kê & Báo cáo</h1>
          <p className="dashboard-subtitle">Theo dõi hoạt động, tin đăng và doanh thu hệ thống</p>
        </div>
        
        {/* Controls Row below title: Tabs, Date Range, and Export Button */}
        <div className="dashboard-controls-row">
          <div className="stats-time-tabs">
            <button 
              type="button"
              className={`time-tab-btn ${timeRange === 'day' ? 'active' : ''}`}
              onClick={() => setTimeRange('day')}
            >
              Hôm nay
            </button>
            <button 
              type="button"
              className={`time-tab-btn ${timeRange === 'week' ? 'active' : ''}`}
              onClick={() => setTimeRange('week')}
            >
              Tuần này
            </button>
            <button 
              type="button"
              className={`time-tab-btn ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => setTimeRange('month')}
            >
              Tháng này
            </button>
            <button 
              type="button"
              className={`time-tab-btn ${timeRange === 'year' ? 'active' : ''}`}
              onClick={() => setTimeRange('year')}
            >
              Năm nay
            </button>
            <button 
              type="button"
              className={`time-tab-btn ${timeRange === 'custom' ? 'active' : ''}`}
              onClick={() => setTimeRange('custom')}
            >
              Tùy chọn ngày
            </button>
          </div>

          {/* Custom date range selection - only visible when timeRange is 'custom' */}
          {timeRange === 'custom' && (
            <div className="dashboard-custom-range-inline animate-fade-in">
              <div className="custom-date-inputs">
                <div className="date-input-group">
                  <label>Từ</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    max={endDate}
                  />
                </div>
                <div className="date-input-divider">|</div>
                <div className="date-input-group">
                  <label>Đến</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    min={startDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="export-dropdown-wrapper" ref={exportDropdownRef}>
            <button 
              className="btn-export-excel" 
              onClick={() => setShowExportDropdown(!showExportDropdown)}
            >
              <Download size={16} />
              <span>Xuất báo cáo</span>
              <ChevronDown size={14} />
            </button>
            {showExportDropdown && (
              <div className="export-dropdown-menu">
                <button onClick={() => handleExport('excel')}>
                  Xuất file Excel (.xlsx)
                </button>
                <button onClick={() => handleExport('csv')}>
                  Xuất file CSV (.csv)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="dashboard-cards-grid">
          <div className="dashboard-card">
            <div className="card-icon-box bg-blue">
              <Users className="text-blue" size={24} />
            </div>
            <div className="card-info">
              <span className="card-value">{overview.totalUsers.toLocaleString('vi-VN')}</span>
              <span className="card-label">Thành viên mới</span>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon-box bg-green">
              <FileText className="text-green" size={24} />
            </div>
            <div className="card-info">
              <span className="card-value">{overview.totalRoomPosts.toLocaleString('vi-VN')}</span>
              <span className="card-label">Tin đăng mới</span>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon-box bg-yellow">
              <Clock className="text-yellow" size={24} />
            </div>
            <div className="card-info">
              <span className="card-value">{overview.pendingRoomPosts.toLocaleString('vi-VN')}</span>
              <span className="card-label">Bài chờ duyệt</span>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon-box bg-purple">
              <DollarSign className="text-purple" size={24} />
            </div>
            <div className="card-info">
              <span className="card-value">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(overview.totalRevenue || 0)}
              </span>
              <span className="card-label">Doanh thu phát sinh</span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="dashboard-charts-grid">
          {/* Post quantity over time chart */}
          <div className="chart-card col-span-2">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Số lượng tin đăng mới</h3>
              <p className="chart-card-subtitle">Thống kê số lượng phòng trọ đăng tải theo thời gian</p>
            </div>
            <div className="chart-container">
              {loading ? (
                <div className="chart-loading-overlay">
                  <Loader2 className="spin-icon text-blue" size={24} />
                </div>
              ) : (
                <CustomPostTimeChart data={postsTimeData} />
              )}
            </div>
          </div>

          {/* Region distribution donut chart */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Tin đăng theo khu vực</h3>
              <p className="chart-card-subtitle">Tỷ lệ tin đăng giữa các tỉnh thành phố</p>
            </div>
            <div className="chart-container">
              {loading ? (
                <div className="chart-loading-overlay">
                  <Loader2 className="spin-icon text-blue" size={24} />
                </div>
              ) : (
                <CustomDonutChart data={postsRegionData} />
              )}
            </div>
          </div>

          {/* Revenue chart */}
          <div className="chart-card col-span-2" style={{ gridColumn: 'span 3 / span 3' }}>
            <div className="chart-card-header">
              <h3 className="chart-card-title">Biểu đồ doanh thu dịch vụ</h3>
              <p className="chart-card-subtitle">Chi tiết dòng doanh thu phát sinh từ thanh toán VIP</p>
            </div>
            <div className="chart-container">
              {loading ? (
                <div className="chart-loading-overlay">
                  <Loader2 className="spin-icon text-blue" size={24} />
                </div>
              ) : (
                <CustomBarChart data={revenueData} />
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
