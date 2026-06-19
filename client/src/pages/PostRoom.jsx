import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import readNumberVN from '../utils/readNumberVN';
import {
  X,
  Upload,
  Link,
  MapPin,
  FileCheck,
  Award,
  PhoneCall,
  Image as ImageIcon
} from 'lucide-react';
import './PostRoom.css';

export default function PostRoom() {
  const { token, currentUser, fetchCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  // Filter categories dynamically
  const roomTypes = categories.filter(c => c.categoryType === 'Loại phòng');
  const utilitiesList = categories.filter(c => c.categoryType === 'Tiện ích');
  const [displayPrice, setDisplayPrice] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    area: '',
    categoryId: '',
    contactName: '',
    contactPhone: '',
    description: '',
    postType: 'Tin thường',
  });

  // State for dynamic address dropdowns
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');

  // State for manual image URLs
  const [imageUrls, setImageUrls] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // State for physical files
  const [localFiles, setLocalFiles] = useState([]); // Array of { id, file, preview }

  const [selectedUtilities, setSelectedUtilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Auto-fill contact info based on currentUser
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        contactName: currentUser.fullName || '',
        contactPhone: currentUser.phoneNumber || ''
      }));
    }
  }, [currentUser]);

  // Fetch provinces on mount with local storage caching
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const cached = localStorage.getItem('vietnam_provinces');
        if (cached) {
          setProvinces(JSON.parse(cached));
          return;
        }

        const response = await fetch('https://provinces.open-api.vn/api/v2/?depth=2');
        if (response.ok) {
          const data = await response.json();
          setProvinces(data);
          localStorage.setItem('vietnam_provinces', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách tỉnh thành:', err);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/categories');
        const data = await response.json();
        if (response.ok && data.success) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách danh mục:', err);
      }
    };
    fetchCategories();
  }, []);

  const handlePriceChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, price: rawVal }));
    if (rawVal) {
      setDisplayPrice(Number(rawVal).toLocaleString('vi-VN'));
    } else {
      setDisplayPrice('');
    }
  };

  const handleProvinceChange = (e) => {
    setSelectedProvince(e.target.value);
    setSelectedWard('');
  };

  const handleWardChange = (e) => {
    setSelectedWard(e.target.value);
  };

  const selectedProvObj = provinces.find(p => p.code === Number(selectedProvince));
  const wardsList = selectedProvObj ? selectedProvObj.wards : [];

  const getFullAddress = () => {
    const provinceName = selectedProvObj?.name || '';
    const wardName = wardsList.find(w => w.code === Number(selectedWard))?.name || '';

    const parts = [];
    if (houseNumber.trim()) parts.push(houseNumber.trim());
    if (street.trim()) parts.push(street.trim());
    if (wardName) parts.push(wardName);
    if (provinceName) parts.push(provinceName);

    return parts.join(', ');
  };

  // Handle inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Trigger Toast Notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type, action: null });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '', action: null });
    }, 4000);
  };

  // Add manual image URL
  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;

    if (!imageUrlInput.startsWith('http://') && !imageUrlInput.startsWith('https://')) {
      showToast('Đường dẫn ảnh phải bắt đầu bằng http:// hoặc https://', 'error');
      return;
    }

    if (imageUrls.includes(imageUrlInput.trim())) {
      showToast('Đường dẫn ảnh này đã được thêm', 'error');
      return;
    }

    setImageUrls((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  // Remove manual image URL
  const handleRemoveImageUrl = (indexToRemove) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle physical file changes
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newFiles = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      preview: URL.createObjectURL(file),
    }));

    setLocalFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  // Remove physical file
  const handleRemoveLocalFile = (idToRemove, previewUrl) => {
    URL.revokeObjectURL(previewUrl);
    setLocalFiles((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  // Toggle utilities
  const handleUtilityToggle = (utilityLabel) => {
    setSelectedUtilities((prev) =>
      prev.includes(utilityLabel)
        ? prev.filter((item) => item !== utilityLabel)
        : [...prev, utilityLabel]
    );
  };

  // Scrollspy navigation helper
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Form submission
  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast('Vui lòng nhập tiêu đề bài đăng', 'error');
      return;
    }
    const fullAddress = getFullAddress();
    if (!selectedProvince || !selectedWard) {
      showToast('Vui lòng chọn đầy đủ Tỉnh/Thành, Phường/Xã', 'error');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      showToast('Vui lòng nhập giá thuê phòng hợp lệ', 'error');
      return;
    }
    if (!formData.area || Number(formData.area) <= 0) {
      showToast('Vui lòng nhập diện tích hợp lệ', 'error');
      return;
    }
    if (!formData.categoryId) {
      showToast('Vui lòng chọn loại chuyên mục', 'error');
      return;
    }
    if (!formData.contactName.trim()) {
      showToast('Vui lòng nhập tên người liên hệ', 'error');
      return;
    }
    if (!formData.contactPhone.trim()) {
      showToast('Vui lòng nhập số điện thoại liên hệ', 'error');
      return;
    }

    if (formData.postType === 'Tin VIP' || formData.postType === 'VIP') {
      setShowConfirmModal(true);
    } else {
      submitPostApi();
    }
  };

  const submitPostApi = async () => {
    setLoading(true);
    setShowConfirmModal(false);

    const fullAddress = getFullAddress();
    const provinceName = selectedProvObj?.name || '';
    const wardName = wardsList.find(w => w.code === Number(selectedWard))?.name || '';
    const exactAddr = [houseNumber.trim(), street.trim()].filter(Boolean).join(', ');

    // Create FormData object for multipart/form-data upload
    const sendData = new FormData();
    sendData.append('categoryId', formData.categoryId);
    sendData.append('categoryID', formData.categoryId);
    sendData.append('title', formData.title.trim());
    sendData.append('address', fullAddress);
    sendData.append('province', provinceName);
    sendData.append('ward', wardName);
    sendData.append('exactAddress', exactAddr);
    sendData.append('price', formData.price);
    sendData.append('area', formData.area);
    sendData.append('contactName', formData.contactName.trim());
    sendData.append('contactPhone', formData.contactPhone.trim());
    sendData.append('description', formData.description.trim());
    sendData.append('postType', formData.postType);

    // Append utilities
    selectedUtilities.forEach((util) => {
      sendData.append('utilities', util);
    });

    // Append manual imageUrls
    imageUrls.forEach((url) => {
      sendData.append('imageUrls', url);
    });

    // Append physical files
    localFiles.forEach((item) => {
      sendData.append('images', item.file);
    });

    try {
      const response = await fetch('http://localhost:5000/api/room-posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: sendData, // Sends as multipart/form-data automatically
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Đăng tin thành công, chờ admin duyệt', 'success');

        // Refresh current user info to sync balance on Header
        if (fetchCurrentUser) {
          await fetchCurrentUser();
        }

        // Reset state
        setFormData({
          title: '',
          price: '',
          area: '',
          categoryId: '',
          contactName: currentUser?.fullName || '',
          contactPhone: currentUser?.phoneNumber || '',
          description: '',
          postType: 'Tin thường',
        });
        setDisplayPrice('');
        setSelectedProvince('');
        setSelectedWard('');
        setStreet('');
        setHouseNumber('');

        // Revoke previews
        localFiles.forEach((item) => URL.revokeObjectURL(item.preview));
        setLocalFiles([]);
        setImageUrls([]);
        setSelectedUtilities([]);

        // Redirect to post management page
        navigate('/manage-posts');
      } else {
        if (data.message && data.message.includes('Số dư không đủ')) {
          setToast({
            show: true,
            message: data.message,
            type: 'error',
            action: () => {
              setToast({ show: false, message: '', type: '', action: null });
              navigate('/wallet');
            }
          });
        } else {
          showToast(data.message || 'Đăng tin thất bại. Vui lòng thử lại!', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      if (err.message && err.message.includes('Số dư không đủ')) {
        setToast({
          show: true,
          message: 'Số dư không đủ để thực hiện giao dịch',
          type: 'error',
          action: () => {
            setToast({ show: false, message: '', type: '', action: null });
            navigate('/wallet');
          }
        });
      } else {
        showToast('Không thể kết nối đến server. Vui lòng kiểm tra lại!', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-room-page">
      <div className="post-room-card">
        {/* Sticky Sub-Header */}
        <div className="sticky-sub-header">
          <h2 className="sub-header-title">Đăng Tin Cho Thuê</h2>
          <div className="scrollspy-menu">
            <button type="button" className="nav-item" onClick={() => scrollToSection('khu-vuc')}>Khu vực</button>
            <button type="button" className="nav-item" onClick={() => scrollToSection('thong-tin-co-ban')}>Thông tin cơ bản</button>
            <button type="button" className="nav-item" onClick={() => scrollToSection('hinh-anh')}>Hình ảnh</button>
            <button type="button" className="nav-item" onClick={() => scrollToSection('thong-tin-lien-he')}>Thông tin liên hệ</button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* 1. Section: Khu vực */}
          <div id="khu-vuc" className="form-section">
            <h3 className="section-title">
              <MapPin size={18} className="section-icon" />
              Khu vực địa lý
            </h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">
                  Địa chỉ phòng trọ <span className="required">*</span>
                </label>

                <div className="address-selectors-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="select-wrapper">
                    <select
                      id="province"
                      className="form-select"
                      value={selectedProvince}
                      onChange={handleProvinceChange}
                      required
                    >
                      <option value="">-- Tỉnh/Thành phố --</option>
                      {provinces.map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="select-wrapper">
                    <select
                      id="ward"
                      className="form-select"
                      value={selectedWard}
                      onChange={handleWardChange}
                      disabled={!selectedProvince}
                      required
                    >
                      <option value="">-- Phường/Xã --</option>
                      {wardsList.map(w => (
                        <option key={w.code} value={w.code}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="address-details-row" style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Đường, phố (VD: Cầu Giấy)"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                    />
                  </div>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Số nhà, ngõ, ngách (VD: Số 10, Ngõ 20)"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                    />
                  </div>
                </div>

                {getFullAddress() && (
                  <div className="address-preview-box" style={{ marginTop: '12px' }}>
                    <div className="address-preview-text" style={{ fontSize: '13px', color: '#0284c7', display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <MapPin size={14} style={{ marginRight: '6px' }} />
                      <span><strong>Địa chỉ hoàn chỉnh:</strong> {getFullAddress()}</span>
                    </div>
                    <div className="maps-iframe-container" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <iframe
                        title="Google Maps Location"
                        width="100%"
                        height="260"
                        style={{ border: 0, display: 'block' }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(getFullAddress())}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Section: Thông tin cơ bản */}
          <div id="thong-tin-co-ban" className="form-section">
            <h3 className="section-title">
              <FileCheck size={18} className="section-icon" />
              Thông tin cơ bản
            </h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label" htmlFor="title">
                  Tiêu đề tin đăng <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    id="title"
                    type="text"
                    name="title"
                    className="form-input"
                    placeholder="Ví dụ: Căn hộ Studio cao cấp rộng rãi full tiện ích..."
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="price">
                  Giá thuê <span className="required">*</span>
                </label>
                <div className="input-wrapper price-input-wrapper" style={{ position: 'relative' }}>
                  <input
                    id="price"
                    type="text"
                    name="price"
                    className="form-input"
                    style={{ paddingRight: '105px' }}
                    placeholder="Ví dụ: 3.500.000"
                    value={displayPrice}
                    onChange={handlePriceChange}
                    required
                  />
                  <span className="price-suffix" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>đồng/tháng</span>
                </div>
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  Nhập đầy đủ số, ví dụ 1 triệu thì nhập là 1000000
                </span>
                {formData.price && (
                  <span className="text-green-600" style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', marginTop: '4px' }}>
                    {readNumberVN(formData.price)} đồng/tháng
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="area">
                  Diện tích (m²) <span className="required">*</span>
                </label>
                <div className="input-wrapper area-input-wrapper" style={{ position: 'relative' }}>
                  <input
                    id="area"
                    type="number"
                    name="area"
                    className="form-input"
                    style={{ paddingRight: '45px' }}
                    placeholder="Ví dụ: 30"
                    value={formData.area}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                  <span className="area-suffix" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>m²</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="categoryId">
                  Loại chuyên mục <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <select
                    id="categoryId"
                    name="categoryId"
                    className="form-select"
                    value={formData.categoryId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Chọn chuyên mục --</option>
                    {roomTypes.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="postType">
                  Loại tin đăng
                </label>
                <div className="input-wrapper">
                  <Award size={16} className="input-icon" />
                  <select
                    id="postType"
                    name="postType"
                    className="form-select with-icon"
                    value={formData.postType}
                    onChange={handleChange}
                  >
                    <option value="Tin thường">Tin thường</option>
                    <option value="Tin VIP">Tin VIP ⭐</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label" htmlFor="description">
                  Mô tả chi tiết phòng trọ
                </label>
                <div className="input-wrapper">
                  <textarea
                    id="description"
                    name="description"
                    className="form-textarea"
                    placeholder="Mô tả cụ thể về diện tích, nội thất, giờ giấc tự do, tiền điện/nước, chi phí dịch vụ khác..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Inner Block: Tiện ích */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
              <h4 className="section-title" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '16px' }}>
                <Award size={18} className="section-icon" />
                Tiện ích sẵn có
              </h4>
              <div className="utilities-container">
                {utilitiesList.map((util) => {
                  const isChecked = selectedUtilities.includes(util.categoryName);
                  return (
                    <div key={util._id}>
                      <input
                        id={`util-${util._id}`}
                        type="checkbox"
                        className="utility-checkbox-input"
                        checked={isChecked}
                        onChange={() => handleUtilityToggle(util.categoryName)}
                      />
                      <label htmlFor={`util-${util._id}`} className="utility-checkbox-label">
                        <span>{util.categoryName}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Section: Hình ảnh */}
          <div id="hinh-anh" className="form-section">
            <h3 className="section-title">
              <ImageIcon size={18} className="section-icon" />
              Hình ảnh mô tả
            </h3>

            <div className="images-uploader-grid">
              {/* Way 1: URL */}
              <div className="uploader-box">
                <span className="uploader-title">
                  <Link size={14} style={{ marginRight: '6px' }} />
                  Nhập link ảnh từ internet
                </span>
                <div className="image-input-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Dán link ảnh (https://...)"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                  />
                  <button type="button" className="add-image-btn" onClick={handleAddImageUrl}>
                    Thêm link
                  </button>
                </div>
              </div>

              {/* Way 2: Physical Device File */}
              <div className="uploader-box">
                <span className="uploader-title">
                  <Upload size={14} style={{ marginRight: '6px' }} />
                  Tải ảnh lên từ thiết bị
                </span>
                <div className="file-upload-zone">
                  <input
                    id="file-upload-input"
                    type="file"
                    multiple
                    accept="image/*"
                    className="file-upload-input"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-upload-input" className="file-upload-label">
                    <Upload size={20} className="upload-icon" />
                    <span>Chọn tệp hoặc kéo thả ở đây</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Gallery Previews */}
            {(imageUrls.length > 0 || localFiles.length > 0) && (
              <div className="previews-wrapper">
                <span className="previews-title">Ảnh đã chọn ({imageUrls.length + localFiles.length} ảnh):</span>
                <div className="image-previews-list">
                  {imageUrls.map((url, idx) => (
                    <div key={`url-${idx}`} className="image-preview-item text-url-item">
                      <img src={url} alt={`URL Preview ${idx + 1}`} onError={(e) => {
                        e.target.src = 'https://placehold.co/100x100?text=Lỗi+ảnh';
                      }} />
                      <span className="source-badge url-source" title="Ảnh từ Internet">Link</span>
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => handleRemoveImageUrl(idx)}
                        title="Xóa ảnh"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {localFiles.map((item) => (
                    <div key={`file-${item.id}`} className="image-preview-item local-file-item">
                      <img src={item.preview} alt="File Preview" />
                      <span className="source-badge file-source" title="Ảnh từ Máy của bạn">Tệp</span>
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => handleRemoveLocalFile(item.id, item.preview)}
                        title="Xóa ảnh"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Section: Thông tin liên hệ (moved here, under image and above submit) */}
          <div id="thong-tin-lien-he" className="form-section">
            <h3 className="section-title">
              <PhoneCall size={18} className="section-icon" />
              Thông tin liên hệ
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="contactName">
                  Tên người liên hệ <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    id="contactName"
                    type="text"
                    name="contactName"
                    className="form-input read-only-input"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={formData.contactName}
                    readOnly={true}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contactPhone">
                  Số điện thoại liên hệ <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    id="contactPhone"
                    type="tel"
                    name="contactPhone"
                    className="form-input read-only-input"
                    placeholder="Ví dụ: 0987654321"
                    value={formData.contactPhone}
                    readOnly={true}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-submit-row">
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Đang đăng tin...' : 'Đăng Tin Miễn Phí'}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
          {toast.action && (
            <button type="button" className="toast-action-btn" onClick={toast.action}>
              Nạp tiền ngay
            </button>
          )}
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="confirm-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <h4 className="confirm-modal-title">Xác nhận đăng tin VIP?</h4>
            <p className="confirm-modal-text">
              Hệ thống sẽ khấu trừ <strong>20.000đ</strong> từ tài khoản của bạn cho dịch vụ này.
            </p>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="confirm-btn-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="confirm-btn-submit"
                onClick={submitPostApi}
              >
                Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
