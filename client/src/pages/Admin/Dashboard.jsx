import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import {
  Users,
  FileText,
  Clock,
  DollarSign,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';
import './Dashboard.css';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f43f5e'];

// Custom Bar Chart Component
function CustomBarChart({ data }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 100000);

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
          const heightPercent = (item.revenue / maxRevenue) * 100;
          return (
            <div key={index} className="chart-bar-column">
              <div className="bar-container">
                <div 
                  className="bar-fill" 
                  style={{ height: `${heightPercent || 1}%` }}
                >
                  <div className="bar-tooltip">
                    <span className="tooltip-month">{item.month}</span>
                    <span className="tooltip-value">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.revenue)}
                    </span>
                  </div>
                </div>
              </div>
              <span className="bar-label">{item.month.replace('Tháng ', 'T')}</span>
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

  if (total === 0) {
    return (
      <div className="chart-empty-state">
        <p>Không có dữ liệu khu vực</p>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for statistics
  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalRoomPosts: 0,
    pendingRoomPosts: 0,
    totalRevenue: 0
  });
  const [provinceData, setProvinceData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all stats concurrently
      const [overviewRes, provinceRes, revenueRes] = await Promise.all([
        fetch('http://localhost:5000/api/statistics/overview', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/statistics/posts-by-province', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/statistics/revenue-by-month', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!overviewRes.ok || !provinceRes.ok || !revenueRes.ok) {
        throw new Error('Không thể lấy đầy đủ dữ liệu thống kê từ máy chủ.');
      }

      const overviewResult = await overviewRes.json();
      const provinceResult = await provinceRes.json();
      const revenueResult = await revenueRes.json();

      if (overviewResult.success) setOverview(overviewResult.data);
      if (provinceResult.success) setProvinceData(provinceResult.data);
      if (revenueResult.success) setRevenueData(revenueResult.data);

    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thống kê:', err);
      setError(err.message || 'Lỗi kết nối máy chủ khi tải số liệu thống kê.');
      toast.error('Lỗi kết nối máy chủ khi tải số liệu thống kê.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format currency VNĐ
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  // Export report handler (Excel mockup)
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Tổng quan
      const overviewData = [
        { 'Chỉ số': 'Tổng thành viên', 'Giá trị': overview.totalUsers },
        { 'Chỉ số': 'Tổng tin đăng', 'Giá trị': overview.totalRoomPosts },
        { 'Chỉ số': 'Bài đang chờ duyệt', 'Giá trị': overview.pendingRoomPosts },
        { 'Chỉ số': 'Tổng doanh thu (VNĐ)', 'Giá trị': overview.totalRevenue }
      ];
      const wsOverview = XLSX.utils.json_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan');

      // Sheet 2: Doanh thu theo tháng
      const monthlyRevenueData = (revenueData || []).map(item => ({
        'Tháng': item.month,
        'Doanh thu (VNĐ)': item.revenue
      }));
      const wsRevenue = XLSX.utils.json_to_sheet(monthlyRevenueData);
      XLSX.utils.book_append_sheet(wb, wsRevenue, 'Doanh thu theo tháng');

      // Sheet 3: Phân bổ khu vực
      const areaData = (provinceData || []).map(entry => ({
        'Tỉnh/Thành phố': entry.name,
        'Số lượng phòng': entry.value
      }));
      const wsArea = XLSX.utils.json_to_sheet(areaData);
      XLSX.utils.book_append_sheet(wb, wsArea, 'Phân bổ khu vực');

      // Write file with date suffix
      const today = new Date();
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      const fileName = `Bao_Cao_Thong_Ke_Hethong_${day}_${month}_${year}.xlsx`;

      XLSX.writeFile(wb, fileName);
      toast.success('Xuất báo cáo Excel thành công!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Lỗi khi xuất báo cáo Excel: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading-box">
        <Loader2 size={48} className="spin-icon text-blue" />
        <p className="loading-text">Đang tổng hợp dữ liệu hệ thống...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error-box">
        <AlertCircle size={48} className="text-red" />
        <h3>Đã xảy ra lỗi</h3>
        <p>{error}</p>
        <button type="button" className="btn-retry" onClick={fetchData}>Thử lại</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="dashboard-container">
        
        {/* Header row */}
        <div className="dashboard-header-row">
          <div>
            <h1 className="dashboard-title">Tổng quan hệ thống</h1>
            <p className="dashboard-subtitle">Số liệu phân tích, tin đăng và doanh thu của FreemiumRoom</p>
          </div>
          <button 
            type="button" 
            className="btn-export-excel"
            onClick={handleExportExcel}
          >
            <Download size={16} />
            <span>Xuất báo cáo (Excel)</span>
          </button>
        </div>

        {/* Cards Grid */}
        <div className="dashboard-cards-grid">
          
          <div className="dashboard-card">
            <div className="card-icon-box bg-blue text-blue">
              <Users size={24} />
            </div>
            <div className="card-info">
              <span className="card-value">{overview.totalUsers}</span>
              <span className="card-label">Tổng thành viên</span>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon-box bg-green text-green">
              <FileText size={24} />
            </div>
            <div className="card-info">
              <span className="card-value">{overview.totalRoomPosts}</span>
              <span className="card-label">Tổng tin đăng</span>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon-box bg-yellow text-yellow">
              <Clock size={24} />
            </div>
            <div className="card-info">
              <span className="card-value">{overview.pendingRoomPosts}</span>
              <span className="card-label">Tin chờ duyệt</span>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon-box bg-purple text-purple">
              <DollarSign size={24} />
            </div>
            <div className="card-info">
              <span className="card-value">{formatCurrency(overview.totalRevenue)}</span>
              <span className="card-label">Tổng doanh thu</span>
            </div>
          </div>

        </div>

        {/* Charts Grid */}
        <div className="dashboard-charts-grid">
          
          {/* Revenue Monthly Chart (Bar Chart) */}
          <div className="chart-card col-span-2">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Doanh thu theo tháng</h3>
              <span className="chart-card-subtitle">Số liệu doanh thu tin VIP năm {new Date().getFullYear()}</span>
            </div>
            <div className="chart-container">
              <CustomBarChart data={revenueData} />
            </div>
          </div>

          {/* Room Posts By Province (Pie/Donut Chart) */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Tin đăng theo khu vực</h3>
              <span className="chart-card-subtitle">Tỷ lệ phân bổ tin theo Tỉnh/Thành phố</span>
            </div>
            <div className="chart-container">
              <CustomDonutChart data={provinceData} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
