import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, Check, MapPin, SlidersHorizontal, RefreshCw } from 'lucide-react';
import './FilterModal.css';

// Global cache for geography data to avoid fetching 2MB+ on every modal mount
let cachedGeoData = null;

const PRICE_RANGES = [
  { label: 'Dưới 1 triệu', min: 0, max: 1000000 },
  { label: '1 - 2 triệu', min: 1000000, max: 2000000 },
  { label: '2 - 3 triệu', min: 2000000, max: 3000000 },
  { label: '3 - 5 triệu', min: 3000000, max: 5000000 },
  { label: '5 - 10 triệu', min: 5000000, max: 10000000 },
  { label: 'Trên 10 triệu', min: 10000000, max: 999999999 }
];

const AREA_RANGES = [
  { label: 'Dưới 20m²', min: 0, max: 20 },
  { label: '20m² - 30m²', min: 20, max: 30 },
  { label: '30m² - 50m²', min: 30, max: 50 },
  { label: 'Trên 50m²', min: 50, max: 999 }
];

export default function FilterModal({ isOpen, onClose }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Dynamic Categories from API
  const [categories, setCategories] = useState([]);
  
  // Geography data (Provinces -> Districts -> Wards)
  const [geoData, setGeoData] = useState(cachedGeoData || []);
  const [geoLoading, setGeoLoading] = useState(!cachedGeoData);

  // Local/Temporary state for filters
  const [tempCategoryId, setTempCategoryId] = useState('');
  const [tempProvince, setTempProvince] = useState('');
  const [tempWard, setTempWard] = useState('');
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');
  const [tempMinArea, setTempMinArea] = useState('');
  const [tempMaxArea, setTempMaxArea] = useState('');
  const [tempUtilities, setTempUtilities] = useState([]);

  // Category subsets
  const roomTypes = categories.filter(c => c.categoryType === 'Loại phòng');
  const utilitiesList = categories.filter(c => c.categoryType === 'Tiện ích');

  // Fetch categories on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.data);
        }
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  // Fetch geography data once
  useEffect(() => {
    if (cachedGeoData) return;
    setGeoLoading(true);
    fetch('https://provinces.open-api.vn/api/v2/?depth=2')
      .then(res => res.json())
      .then(data => {
        cachedGeoData = data;
        setGeoData(data);
        setGeoLoading(false);
      })
      .catch(err => {
        console.error('Error fetching geography data:', err);
        setGeoLoading(false);
      });
  }, []);

  // Initialize temporary states from current searchParams whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setTempCategoryId(searchParams.get('categoryId') || '');
      setTempProvince(searchParams.get('province') || '');
      setTempWard(searchParams.get('ward') || '');
      setTempMinPrice(searchParams.get('minPrice') || '');
      setTempMaxPrice(searchParams.get('maxPrice') || '');
      setTempMinArea(searchParams.get('minArea') || '');
      setTempMaxArea(searchParams.get('maxArea') || '');
      const utilsQuery = searchParams.get('utilities') || '';
      setTempUtilities(utilsQuery ? utilsQuery.split(',').filter(Boolean) : []);
    }
  }, [isOpen, searchParams]);

  if (!isOpen) return null;

  // Find cascading objects for selection
  const activeProvinceObj = geoData.find(p => p.name === tempProvince);

  // Handlers for temporary states
  const handleCategoryClick = (id) => {
    setTempCategoryId(prev => prev === id ? '' : id);
  };

  const handleUtilityClick = (utilityName) => {
    setTempUtilities(prev => 
      prev.includes(utilityName)
        ? prev.filter(u => u !== utilityName)
        : [...prev, utilityName]
    );
  };

  const handlePriceClick = (range) => {
    if (tempMinPrice === String(range.min) && tempMaxPrice === String(range.max)) {
      setTempMinPrice('');
      setTempMaxPrice('');
    } else {
      setTempMinPrice(String(range.min));
      setTempMaxPrice(String(range.max));
    }
  };

  const handleAreaClick = (range) => {
    if (tempMinArea === String(range.min) && tempMaxArea === String(range.max)) {
      setTempMinArea('');
      setTempMaxArea('');
    } else {
      setTempMinArea(String(range.min));
      setTempMaxArea(String(range.max));
    }
  };

  const handleProvinceChange = (e) => {
    const val = e.target.value;
    setTempProvince(val === 'all' ? '' : val);
    setTempWard('');
  };

  const handleWardChange = (e) => {
    const val = e.target.value;
    setTempWard(val === 'all' ? '' : val);
  };

  const handleResetTempFilters = () => {
    setTempCategoryId('');
    setTempProvince('');
    setTempWard('');
    setTempMinPrice('');
    setTempMaxPrice('');
    setTempMinArea('');
    setTempMaxArea('');
    setTempUtilities([]);
  };

  const handleApplyFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    
    // Set or delete categoryId
    if (tempCategoryId) newParams.set('categoryId', tempCategoryId);
    else newParams.delete('categoryId');

    // Set or delete province/ward
    if (tempProvince) newParams.set('province', tempProvince);
    else newParams.delete('province');
    
    newParams.delete('district'); // Ensure legacy district parameter is cleaned up

    if (tempWard) newParams.set('ward', tempWard);
    else newParams.delete('ward');

    // Set or delete price
    if (tempMinPrice) newParams.set('minPrice', tempMinPrice);
    else newParams.delete('minPrice');
    
    if (tempMaxPrice) newParams.set('maxPrice', tempMaxPrice);
    else newParams.delete('maxPrice');

    // Set or delete area
    if (tempMinArea) newParams.set('minArea', tempMinArea);
    else newParams.delete('minArea');
    
    if (tempMaxArea) newParams.set('maxArea', tempMaxArea);
    else newParams.delete('maxArea');

    // Set or delete utilities
    if (tempUtilities.length > 0) newParams.set('utilities', tempUtilities.join(','));
    else newParams.delete('utilities');

    setSearchParams(newParams);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <SlidersHorizontal size={18} className="modal-title-icon" />
            <span>Bộ lọc nâng cao</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body">
          {/* Categories */}
          <div className="filter-section">
            <label className="filter-section-label">Danh mục cho thuê</label>
            <div className="pills-container">
              {roomTypes.map((cat) => {
                const isSelected = tempCategoryId === cat._id;
                return (
                  <button
                    key={cat._id}
                    type="button"
                    className={`pill-btn category-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(cat._id)}
                  >
                    {isSelected && <Check size={12} className="check-icon" />}
                    {cat.categoryName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Utilities */}
          <div className="filter-section">
            <label className="filter-section-label">Tiện ích</label>
            <div className="pills-container">
              {utilitiesList.map((util) => {
                const isSelected = tempUtilities.includes(util.categoryName);
                return (
                  <button
                    key={util._id}
                    type="button"
                    className={`pill-btn category-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => handleUtilityClick(util.categoryName)}
                  >
                    {isSelected && <Check size={12} className="check-icon" />}
                    {util.categoryName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Area Geography dropdowns */}
          <div className="filter-section">
            <label className="filter-section-label">Lọc theo khu vực</label>
            <div className="geo-selects-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Province */}
              <div className="select-wrapper">
                <MapPin size={14} className="select-icon-left" />
                <select
                  value={tempProvince || 'all'}
                  onChange={handleProvinceChange}
                  className="geo-select"
                  disabled={geoLoading}
                >
                  {geoLoading ? (
                    <option value="all">Đang tải tỉnh thành...</option>
                  ) : (
                    <>
                      <option value="all">Chọn Tỉnh/Thành phố</option>
                      {geoData.map((p) => (
                        <option key={p.code} value={p.name}>{p.name}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Ward */}
              <div className="select-wrapper">
                <MapPin size={14} className="select-icon-left" />
                <select
                  value={tempWard || 'all'}
                  onChange={handleWardChange}
                  className="geo-select"
                  disabled={!tempProvince || geoLoading}
                >
                  <option value="all">Chọn Phường/Xã</option>
                  {activeProvinceObj?.wards?.map((w) => (
                    <option key={w.code} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Price & Area grid */}
          <div className="filter-two-cols">
            {/* Price */}
            <div className="filter-section col-item">
              <label className="filter-section-label">Khoảng giá</label>
              <div className="pills-container">
                {PRICE_RANGES.map((range, index) => {
                  const isSelected = tempMinPrice === String(range.min) && tempMaxPrice === String(range.max);
                  return (
                    <button
                      key={`price-${index}`}
                      type="button"
                      className={`pill-btn price-pill ${isSelected ? 'active' : ''}`}
                      onClick={() => handlePriceClick(range)}
                    >
                      {isSelected && <Check size={11} className="check-icon" />}
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Area */}
            <div className="filter-section col-item">
              <label className="filter-section-label">Khoảng diện tích</label>
              <div className="pills-container">
                {AREA_RANGES.map((range, index) => {
                  const isSelected = tempMinArea === String(range.min) && tempMaxArea === String(range.max);
                  return (
                    <button
                      key={`area-${index}`}
                      type="button"
                      className={`pill-btn area-pill ${isSelected ? 'active' : ''}`}
                      onClick={() => handleAreaClick(range)}
                    >
                      {isSelected && <Check size={11} className="check-icon" />}
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="modal-reset-btn" onClick={handleResetTempFilters}>
            <RefreshCw size={13} style={{ marginRight: '6px' }} />
            Xóa bộ lọc
          </button>
          <button type="button" className="modal-apply-btn" onClick={handleApplyFilters}>
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
