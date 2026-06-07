import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  AlertCircle,
  FolderOpen,
  Tag,
  MapPin,
  Sparkles,
  Loader2
} from 'lucide-react';
import './ManageCategories.css';

export default function ManageCategories() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form values state
  const [editingCategory, setEditingCategory] = useState(null); // null means adding
  const [formData, setFormData] = useState({
    categoryName: '',
    categoryType: 'Loại phòng'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Delete state
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/categories');
      const result = await response.json();
      
      if (!response.ok) {
        const errorObj = new Error(result.message || 'Không thể tải danh sách danh mục.');
        errorObj.response = { data: result };
        throw errorObj;
      }

      setCategories(result.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on search
  const filteredCategories = categories.filter(cat =>
    cat.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.categoryType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats for cards
  const totalCount = categories.length;
  const roomTypeCount = categories.filter(c => c.categoryType === 'Loại phòng').length;
  const utilityCount = categories.filter(c => c.categoryType === 'Tiện ích').length;

  // Open Form Modal (Add mode)
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      categoryName: '',
      categoryType: 'Loại phòng'
    });
    setFormError('');
    setShowFormModal(true);
  };

  // Open Form Modal (Edit mode)
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      categoryName: category.categoryName,
      categoryType: category.categoryType
    });
    setFormError('');
    setShowFormModal(true);
  };

  // Handle Form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formError) setFormError('');
  };

  // Form Submit Handler (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryName.trim()) {
      setFormError('Tên danh mục là bắt buộc và không được để trống.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      
      const url = editingCategory 
        ? `http://localhost:5000/api/categories/${editingCategory._id}`
        : 'http://localhost:5000/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryName: formData.categoryName.trim(),
          categoryType: formData.categoryType
        })
      });

      const result = await response.json();

      if (!response.ok) {
        const errorObj = new Error(result.message || 'Thao tác không thành công.');
        errorObj.response = { data: result };
        throw errorObj;
      }

      toast.success(result.message || (editingCategory ? 'Cập nhật thành công!' : 'Thêm mới thành công!'));
      setShowFormModal(false);
      fetchCategories(); // Reload data
    } catch (err) {
      console.error('Error submitting category form:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ.';
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (category) => {
    setDeletingCategory(category);
    setShowDeleteModal(true);
  };

  // Delete Confirm Handler
  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;

    try {
      setDeleting(true);
      const response = await fetch(`http://localhost:5000/api/categories/${deletingCategory._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        const errorObj = new Error(result.message || 'Không thể xóa danh mục.');
        errorObj.response = { data: result };
        throw errorObj;
      }

      toast.success(result.message || 'Xóa danh mục thành công!');
      setShowDeleteModal(false);
      setDeletingCategory(null);
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi kết nối khi gửi yêu cầu xóa.';
      toast.error(errorMessage);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-categories-page">
      <div className="admin-categories-container">
        
        {/* Title row */}
        <div className="admin-title-row">
          <div>
            <h1 className="admin-page-title">Quản lý Danh mục</h1>
            <p className="admin-page-subtitle">Quản lý phân loại phòng trọ và các tiện ích hệ thống.</p>
          </div>
          <button 
            type="button" 
            className="btn-primary-add"
            onClick={handleOpenAdd}
          >
            <Plus size={18} />
            <span>Thêm danh mục mới</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          
          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-blue">
              <FolderOpen className="text-blue" size={20} />
            </div>
            <div className="stat-data">
              <span className="stat-value">{totalCount}</span>
              <span className="stat-label">Tổng số danh mục</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-amber">
              <Tag className="text-amber" size={20} />
            </div>
            <div className="stat-data">
              <span className="stat-value">{roomTypeCount}</span>
              <span className="stat-label">Loại phòng</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-purple">
              <Sparkles className="text-purple" size={20} />
            </div>
            <div className="stat-data">
              <span className="stat-value">{utilityCount}</span>
              <span className="stat-label">Tiện ích</span>
            </div>
          </div>

        </div>

        {/* Search & Actions Bar */}
        <div className="table-actions-bar">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm danh mục..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Categories Table Card */}
        <div className="categories-table-card">
          {loading ? (
            <div className="table-loading-container">
              <Loader2 size={36} className="spinner-icon animate-spin" />
              <p>Đang tải dữ liệu danh mục...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="empty-table-state">
              <FolderOpen size={48} className="empty-icon" />
              <h3>Chưa có danh mục nào</h3>
              <p>Hệ thống hiện tại chưa có danh mục. Hãy nhấp vào nút "Thêm danh mục mới" ở trên để khởi tạo!</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="empty-table-state">
              <FolderOpen size={48} className="empty-icon" />
              <h3>Không tìm thấy danh mục</h3>
              <p>Không có danh mục nào khớp với từ khóa tìm kiếm "{searchQuery}". Vui lòng thử lại.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="categories-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Tên danh mục</th>
                    <th style={{ width: '25%' }}>Loại danh mục</th>
                    <th style={{ width: '20%' }}>Ngày tạo</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <tr key={category._id}>
                      <td className="col-cat-name">{category.categoryName}</td>
                      <td>
                        <span className={`badge-type type-${
                          category.categoryType === 'Loại phòng' ? 'room' :
                          category.categoryType === 'Khu vực' ? 'area' : 'utility'
                        }`}>
                          {category.categoryType}
                        </span>
                      </td>
                      <td className="col-cat-date">
                        {category.createdAt 
                          ? new Date(category.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : '---'
                        }
                      </td>
                      <td>
                        <div className="actions-btn-group">
                          <button 
                            type="button" 
                            className="btn-action edit"
                            title="Sửa danh mục"
                            onClick={() => handleOpenEdit(category)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            type="button" 
                            className="btn-action delete"
                            title="Xóa danh mục"
                            onClick={() => handleOpenDelete(category)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Add / Edit Form Modal */}
      {showFormModal && (
        <div className="modal-backdrop-overlay">
          <div className="modal-content-card">
            
            {/* Modal Header */}
            <div className="modal-card-header">
              <h3>{editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</h3>
              <button 
                type="button" 
                className="btn-close-modal"
                onClick={() => setShowFormModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit}>
              <div className="modal-card-body">
                
                {formError && (
                  <div className="alert-message alert-error">
                    <AlertCircle size={18} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group-item">
                  <label htmlFor="categoryName">Tên danh mục <span className="text-red">*</span></label>
                  <input 
                    type="text" 
                    id="categoryName"
                    name="categoryName"
                    value={formData.categoryName}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Điều hòa, Máy giặt, Căn hộ..."
                    className={`form-input-control ${formError && !formData.categoryName.trim() ? 'input-error' : ''}`}
                    disabled={submitting}
                    autoFocus
                  />
                </div>

                <div className="form-group-item">
                  <label htmlFor="categoryType">Loại danh mục <span className="text-red">*</span></label>
                  <select 
                    id="categoryType"
                    name="categoryType"
                    value={formData.categoryType}
                    onChange={handleInputChange}
                    className="form-select-control"
                    disabled={submitting}
                  >
                    <option value="Loại phòng">Loại phòng</option>
                    <option value="Tiện ích">Tiện ích</option>
                  </select>
                  <p className="form-help-text">Phân loại giúp hiển thị danh mục ở đúng bộ lọc trên trang tìm kiếm.</p>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="modal-card-footer">
                <button 
                  type="button" 
                  className="btn-secondary-cancel"
                  onClick={() => setShowFormModal(false)}
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn-primary-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu thông tin</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop-overlay">
          <div className="modal-content-card modal-delete-confirm">
            
            <div className="modal-card-header text-red-header">
              <h3>Xác nhận xóa danh mục</h3>
              <button 
                type="button" 
                className="btn-close-modal"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingCategory(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-card-body">
              <p>Bạn có chắc chắn muốn xóa danh mục <strong>{deletingCategory?.categoryName}</strong>?</p>
              <div className="alert-message alert-warning mt-3">
                <AlertCircle size={18} />
                <span>Thao tác xóa sẽ bị chặn nếu có bất kỳ tin đăng nào đang sử dụng danh mục này để đảm bảo toàn vẹn dữ liệu.</span>
              </div>
            </div>

            <div className="modal-card-footer">
              <button 
                type="button" 
                className="btn-secondary-cancel"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingCategory(null);
                }}
                disabled={deleting}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="btn-danger-confirm"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Đồng ý xóa</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
