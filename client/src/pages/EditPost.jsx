import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import readNumberVN from '../utils/readNumberVN';
import {
  X,
  Upload,
  Link as LinkIcon,
  MapPin,
  FileCheck,
  Award,
  PhoneCall,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react';
import './EditPost.css';
import './PostRoom.css';

export default function EditPost() {
  const { id } = useParams();
  const { token, currentUser, fetchCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postData, setPostData] = useState(null);
  const [isDataFilled, setIsDataFilled] = useState(false);

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

  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');

  // Existing images from the post
  const [existingImages, setExistingImages] = useState([]);

  // New image URLs
  const [imageUrls, setImageUrls] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // New physical files
  const [localFiles, setLocalFiles] = useState([]);

  const [selectedUtilities, setSelectedUtilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [originalPostType, setOriginalPostType] = useState('');

  // Fetch provinces with local storage caching
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const cached = localStorage.getItem('vietnam_provinces');
        if (cached) {
          setProvinces(JSON.parse(cached));
          return;
        }

        const response = await fetch('https://provinces.open-api.vn/api/?depth=3');
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

  // Fetch categories
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

  // Fetch post details immediately on mount in parallel
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/room-posts/${id}`);
        const data = await response.json();
        if (response.ok && data.success) {
          setPostData(data.data);
        } else {
          showToast('Không tìm thấy bài đăng', 'error');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        showToast('Lỗi khi tải dữ liệu bài đăng', 'error');
      }
    };
    if (id) {
      fetchPost();
    }
  }, [id]);

  // Pre-fill form fields once all parallel requests complete
  useEffect(() => {
    if (!postData || !provinces.length || !categories.length || isDataFilled) return;

    const post = postData;
    const catId = post.categoryId?._id || post.categoryID?._id || '';
    setFormData({
      title: post.title || '',
      price: post.price ? String(post.price) : '',
      area: post.area ? String(post.area) : '',
      categoryId: catId,
      contactName: post.contactName || '',
      contactPhone: post.contactPhone || '',
      description: post.description || '',
      postType: post.postType || 'Tin thường',
    });
    setOriginalPostType(post.postType || 'Tin thường');

    if (post.price) {
      setDisplayPrice(Number(post.price).toLocaleString('vi-VN'));
    }

    // Set existing images
    if (post.images && post.images.length > 0) {
      setExistingImages(post.images);
    }

    // Set utilities
    if (post.utilities && post.utilities.length > 0) {
      setSelectedUtilities(post.utilities);
    }

    // Map address names back to province/district/ward codes
    if (post.province) {
      const provObj = provinces.find(p => p.name === post.province);
      if (provObj) {
        setSelectedProvince(String(provObj.code));
        if (post.district) {
          const distObj = provObj.districts?.find(d => d.name === post.district);
          if (distObj) {
            setSelectedDistrict(String(distObj.code));
            if (post.ward) {
              const wardObj = distObj.wards?.find(w => w.name === post.ward);
              if (wardObj) {
                setSelectedWard(String(wardObj.code));
              }
            }
          }
        }
      }
    }

    // Parse exactAddress into houseNumber and street
    if (post.exactAddress) {
      const parts = post.exactAddress.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        setHouseNumber(parts[0]);
        setStreet(parts.slice(1).join(', '));
      } else if (parts.length === 1) {
        setHouseNumber(parts[0]);
      }
    }

    setIsDataFilled(true);
    setIsLoading(false);
  }, [postData, provinces, categories, isDataFilled]);

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
    setSelectedDistrict('');
    setSelectedWard('');
  };

  const handleDistrictChange = (e) => {
    setSelectedDistrict(e.target.value);
    setSelectedWard('');
  };

  const handleWardChange = (e) => {
    setSelectedWard(e.target.value);
  };

  const selectedProvObj = provinces.find(p => p.code === Number(selectedProvince));
  const districtsList = selectedProvObj ? selectedProvObj.districts : [];
  const selectedDistObj = districtsList.find(d => d.code === Number(selectedDistrict));
  const wardsList = selectedDistObj ? selectedDistObj.wards : [];

  const getFullAddress = () => {
    const provinceName = selectedProvObj?.name || '';
    const districtName = selectedDistObj?.name || '';
    const wardName = wardsList.find(w => w.code === Number(selectedWard))?.name || '';

    const parts = [];
    if (houseNumber.trim()) parts.push(houseNumber.trim());
    if (street.trim()) parts.push(street.trim());
    if (wardName) parts.push(wardName);
    if (districtName) parts.push(districtName);
    if (provinceName) parts.push(provinceName);

    return parts.join(', ');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type, action: null });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '', action: null });
    }, 4000);
  };

  // Remove existing image
  const handleRemoveExistingImage = (indexToRemove) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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

  const handleRemoveImageUrl = (indexToRemove) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

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

  const handleRemoveLocalFile = (idToRemove, previewUrl) => {
    URL.revokeObjectURL(previewUrl);
    setLocalFiles((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  const handleUtilityToggle = (utilityLabel) => {
    setSelectedUtilities((prev) =>
      prev.includes(utilityLabel)
        ? prev.filter((item) => item !== utilityLabel)
        : [...prev, utilityLabel]
    );
  };

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast('Vui lòng nhập tiêu đề bài đăng', 'error');
      return;
    }
    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      showToast('Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã', 'error');
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

    // Show VIP confirm modal if upgrading from normal to VIP
    if (originalPostType !== 'Tin VIP' && formData.postType === 'Tin VIP') {
      setShowConfirmModal(true);
    } else {
      submitUpdateApi();
    }
  };

  const submitUpdateApi = async () => {
    setLoading(true);
    setShowConfirmModal(false);

    const fullAddress = getFullAddress();
    const provinceName = selectedProvObj?.name || '';
    const districtName = selectedDistObj?.name || '';
    const wardName = wardsList.find(w => w.code === Number(selectedWard))?.name || '';
    const exactAddr = [houseNumber.trim(), street.trim()].filter(Boolean).join(', ');

    const sendData = new FormData();
    sendData.append('categoryId', formData.categoryId);
    sendData.append('categoryID', formData.categoryId);
    sendData.append('title', formData.title.trim());
    sendData.append('address', fullAddress);
    sendData.append('province', provinceName);
    sendData.append('district', districtName);
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

    // Append existing images kept
    existingImages.forEach((url) => {
      sendData.append('existingImages', url);
    });

    // Append new manual image URLs
    imageUrls.forEach((url) => {
      sendData.append('imageUrls', url);
    });

    // Append new physical files
    localFiles.forEach((item) => {
      sendData.append('images', item.file);
    });

    try {
      const response = await fetch(`http://localhost:5000/api/room-posts/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: sendData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Cập nhật tin đăng thành công!', 'success');

        if (fetchCurrentUser) {
          await fetchCurrentUser();
        }

        // Revoke previews
        localFiles.forEach((item) => URL.revokeObjectURL(item.preview));

        setTimeout(() => {
          navigate('/manage-posts');
        }, 1500);
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
          showToast(data.message || 'Cập nhật thất bại. Vui lòng thử lại!', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Không thể kết nối đến server. Vui lòng kiểm tra lại!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Total images count
  const totalImages = existingImages.length + imageUrls.length + localFiles.length;

  if (isLoading) {
    return (
      <div className="edit-post-page">
        <div className="edit-post-card">
          <div className="edit-post-loading">
            <div className="edit-loading-spinner"></div>
            <span>Đang tải dữ liệu bài đăng...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-post-page post-room-page">
      <div className="edit-post-card post-room-card">
        {/* Back link */}
        <Link to="/manage-posts" className="back-link">
          <ArrowLeft size={16} />
          Quay lại quản lý tin đăng
        </Link>

        {/* Sticky Sub-Header */}
        <div className="sticky-sub-header">
          <h2 className="sub-header-title">Chỉnh sửa Tin đăng</h2>
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
              Khu vực
            </h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Tỉnh / Thành phố <span className="required">*</span></label>
                <div className="address-selectors-row">
                  <select className="form-select" value={selectedProvince} onChange={handleProvinceChange}>
                    <option value="">-- Chọn Tỉnh / Thành phố --</option>
                    {provinces.map((prov) => (
                      <option key={prov.code} value={prov.code}>{prov.name}</option>
                    ))}
                  </select>
                  <select className="form-select" value={selectedDistrict} onChange={handleDistrictChange} disabled={!selectedProvince}>
                    <option value="">-- Chọn Quận / Huyện --</option>
                    {districtsList.map((dist) => (
                      <option key={dist.code} value={dist.code}>{dist.name}</option>
                    ))}
                  </select>
                  <select className="form-select" value={selectedWard} onChange={handleWardChange} disabled={!selectedDistrict}>
                    <option value="">-- Chọn Phường / Xã --</option>
                    {wardsList.map((w) => (
                      <option key={w.code} value={w.code}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tên đường</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Đường Nguyễn Trãi"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số nhà</label>
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
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      getFullAddress()
                        ? getFullAddress().replace(/\b(số|so|no\.?)\s+/gi, '').replace(/^(\d+),\s*/, '$1 ')
                        : ''
                    )}&t=&z=15&ie=UTF8&iwloc=addr&output=embed`}
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* 2. Section: Thông tin cơ bản */}
          <div id="thong-tin-co-ban" className="form-section">
            <h3 className="section-title">
              <FileCheck size={18} className="section-icon" />
              Thông tin cơ bản
            </h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Tiêu đề <span className="required">*</span></label>
                <input
                  type="text"
                  name="title"
                  className="form-input"
                  placeholder="VD: Cho thuê phòng trọ đẹp, giá rẻ"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Giá thuê (VNĐ/tháng) <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: 3000000"
                  value={displayPrice}
                  onChange={handlePriceChange}
                />
                {formData.price && (
                  <small style={{ color: '#64748b', marginTop: '4px', fontSize: '12px' }}>
                    {readNumberVN(Number(formData.price))} đồng
                  </small>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Diện tích (m²) <span className="required">*</span></label>
                <input
                  type="number"
                  name="area"
                  className="form-input"
                  placeholder="VD: 25"
                  value={formData.area}
                  onChange={handleChange}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Chuyên mục <span className="required">*</span></label>
                <select
                  name="categoryId"
                  className="form-select"
                  value={formData.categoryId}
                  onChange={handleChange}
                >
                  <option value="">-- Chọn chuyên mục --</option>
                  {roomTypes.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Loại tin đăng</label>
                <select
                  name="postType"
                  className="form-select"
                  value={formData.postType}
                  onChange={handleChange}
                >
                  <option value="Tin thường">Tin thường (miễn phí)</option>
                  <option value="Tin VIP">Tin VIP (20.000đ)</option>
                </select>
                {originalPostType !== 'Tin VIP' && formData.postType === 'Tin VIP' && (
                  <small style={{ color: '#f59e0b', marginTop: '4px', fontSize: '12px', fontWeight: 600 }}>
                    ⚠ Nâng cấp VIP sẽ trừ 20.000đ từ tài khoản
                  </small>
                )}
              </div>

              <div className="form-group full-width">
                <label className="form-label">Mô tả chi tiết</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  placeholder="Mô tả chi tiết về phòng trọ..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                />
              </div>

              {/* Utilities */}
              {utilitiesList.length > 0 && (
                <div className="form-group full-width">
                  <label className="form-label">Tiện ích</label>
                  <div className="utilities-container">
                    {utilitiesList.map((util) => (
                      <React.Fragment key={util._id}>
                        <input
                          type="checkbox"
                          id={`util-edit-${util._id}`}
                          className="utility-checkbox-input"
                          checked={selectedUtilities.includes(util.categoryName)}
                          onChange={() => handleUtilityToggle(util.categoryName)}
                        />
                        <label htmlFor={`util-edit-${util._id}`} className="utility-checkbox-label">
                          {util.categoryName}
                        </label>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Section: Hình ảnh */}
          <div id="hinh-anh" className="form-section">
            <h3 className="section-title">
              <ImageIcon size={18} className="section-icon" />
              Hình ảnh ({totalImages})
            </h3>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="existing-images-section">
                <span className="existing-images-title">Ảnh hiện tại ({existingImages.length})</span>
                <div className="existing-images-grid">
                  {existingImages.map((url, idx) => (
                    <div key={idx} className="existing-image-item">
                      <img src={url} alt={`existing-${idx}`} />
                      <button
                        type="button"
                        className="remove-existing-btn"
                        onClick={() => handleRemoveExistingImage(idx)}
                        title="Xóa ảnh"
                      >
                        <X size={12} />
                      </button>
                      <span className="existing-badge">Cũ</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload new images */}
            <div className="images-uploader-grid">
              {/* URL input */}
              <div className="uploader-box">
                <span className="uploader-title">
                  <LinkIcon size={14} style={{ marginRight: '6px' }} />
                  Thêm ảnh từ URL
                </span>
                <div className="image-input-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://example.com/photo.jpg"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddImageUrl(e); }}
                  />
                  <button type="button" className="add-image-btn" onClick={handleAddImageUrl}>Thêm</button>
                </div>
              </div>

              {/* File upload */}
              <div className="uploader-box">
                <span className="uploader-title">
                  <Upload size={14} style={{ marginRight: '6px' }} />
                  Tải ảnh từ thiết bị
                </span>
                <input
                  type="file"
                  id="edit-file-upload"
                  className="file-upload-input"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <label htmlFor="edit-file-upload" className="file-upload-label">
                  <Upload size={20} className="upload-icon" />
                  Bấm để chọn ảnh
                </label>
              </div>
            </div>

            {/* Preview new images */}
            {(imageUrls.length > 0 || localFiles.length > 0) && (
              <div className="previews-wrapper">
                <span className="previews-title">Ảnh mới thêm ({imageUrls.length + localFiles.length})</span>
                <div className="image-previews-list">
                  {imageUrls.map((url, idx) => (
                    <div key={`url-${idx}`} className="image-preview-item">
                      <img src={url} alt={`url-${idx}`} />
                      <button type="button" className="remove-image-btn" onClick={() => handleRemoveImageUrl(idx)}>
                        <X size={10} />
                      </button>
                      <span className="source-badge url-source">URL</span>
                    </div>
                  ))}
                  {localFiles.map((item) => (
                    <div key={item.id} className="image-preview-item">
                      <img src={item.preview} alt={`file-${item.id}`} />
                      <button type="button" className="remove-image-btn" onClick={() => handleRemoveLocalFile(item.id, item.preview)}>
                        <X size={10} />
                      </button>
                      <span className="source-badge file-source">File</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Section: Thông tin liên hệ */}
          <div id="thong-tin-lien-he" className="form-section">
            <h3 className="section-title">
              <PhoneCall size={18} className="section-icon" />
              Thông tin liên hệ
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Tên liên hệ <span className="required">*</span></label>
                <input
                  type="text"
                  name="contactName"
                  className="form-input"
                  placeholder="Tên người liên hệ"
                  value={formData.contactName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại <span className="required">*</span></label>
                <input
                  type="text"
                  name="contactPhone"
                  className="form-input"
                  placeholder="Số điện thoại"
                  value={formData.contactPhone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="form-submit-row">
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>

        {/* VIP Confirm Modal */}
        {showConfirmModal && (
          <div className="confirm-modal-overlay">
            <div className="confirm-modal-content">
              <h3 className="confirm-modal-title">Xác nhận nâng cấp VIP</h3>
              <p className="confirm-modal-text">
                Bạn muốn nâng cấp tin đăng lên <strong>Tin VIP</strong>. Hệ thống sẽ trừ <strong>20.000đ</strong> từ tài khoản của bạn.
                <br /><br />
                Số dư hiện tại: <strong>{currentUser?.balance ? Number(currentUser.balance).toLocaleString('vi-VN') : '0'} đ</strong>
              </p>
              <div className="confirm-modal-actions">
                <button className="confirm-btn-cancel" onClick={() => setShowConfirmModal(false)}>Hủy bỏ</button>
                <button className="confirm-btn-submit" onClick={submitUpdateApi}>Xác nhận</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
          {toast.action && (
            <button className="toast-action-btn" onClick={toast.action}>Nạp tiền</button>
          )}
        </div>
      )}
    </div>
  );
}
