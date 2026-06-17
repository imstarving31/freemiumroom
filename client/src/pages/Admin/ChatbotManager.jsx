import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Search, Loader2, AlertCircle, Plus, Edit2, Trash2, Calendar, User, MessageSquare } from 'lucide-react';
import './ChatbotManager.css';

export default function ChatbotManager() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('faq');
  const [loading, setLoading] = useState(false);

  // FAQ Tab States
  const [faqs, setFaqs] = useState([]);
  const [search, setSearch] = useState('');
  const [faqPage, setFaqPage] = useState(1);
  const [faqTotalPages, setFaqTotalPages] = useState(1);
  const [faqLimit] = useState(8);

  // Chat Session Tab States
  const [sessions, setSessions] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLimit] = useState(8);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' | 'edit'
  const [selectedFaqId, setSelectedFaqId] = useState(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [modalError, setModalError] = useState('');

  // Fetch FAQ list
  const fetchFAQs = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const url = `http://localhost:5000/api/admin/chatbot/faq?page=${faqPage}&limit=${faqLimit}&search=${encodeURIComponent(search)}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setFaqs(result.data || []);
        setFaqTotalPages(result.pagination.totalPages || 1);
      } else {
        toast.error(result.message || 'Không thể tải danh sách FAQ.');
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      toast.error('Lỗi kết nối máy chủ khi tải FAQs.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Chat Sessions
  const fetchSessions = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const url = `http://localhost:5000/api/admin/chatbot/sessions?page=${historyPage}&limit=${historyLimit}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setSessions(result.data || []);
        setHistoryTotalPages(result.pagination.totalPages || 1);
      } else {
        toast.error(result.message || 'Không thể tải lịch sử trò chuyện.');
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      toast.error('Lỗi kết nối máy chủ khi tải lịch sử.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on dependency updates
  useEffect(() => {
    if (activeTab === 'faq') {
      fetchFAQs();
    } else {
      fetchSessions();
    }
  }, [activeTab, faqPage, historyPage, search, token]);

  // Handle Delete FAQ
  const handleDelete = async (id) => {
    if (!token) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi FAQ này không?')) {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/admin/chatbot/faq/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (response.ok && result.success) {
          toast.success('Xóa câu hỏi FAQ thành công!');
          fetchFAQs();
        } else {
          toast.error(result.message || 'Xóa FAQ thất bại.');
        }
      } catch (err) {
        console.error('Error deleting FAQ:', err);
        toast.error('Lỗi kết nối máy chủ khi xóa FAQ.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Modal Open Handlers
  const openCreateModal = () => {
    setModalType('create');
    setSelectedFaqId(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setModalError('');
    setShowModal(true);
  };

  const openEditModal = (faq) => {
    setModalType('edit');
    setSelectedFaqId(faq._id);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setModalError('');
    setShowModal(true);
  };

  // Handle Form Submit (Create / Edit FAQ)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      setModalError('Vui lòng nhập đầy đủ câu hỏi và câu trả lời để Chatbot có cơ sở dữ liệu tư vấn');
      return;
    }

    try {
      setLoading(true);
      const isEdit = modalType === 'edit';
      const url = isEdit
        ? `http://localhost:5000/api/admin/chatbot/faq/${selectedFaqId}`
        : 'http://localhost:5000/api/admin/chatbot/faq';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: faqQuestion,
          answer: faqAnswer
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(isEdit ? 'Cập nhật FAQ thành công!' : 'Thêm mới FAQ thành công!');
        setShowModal(false);
        fetchFAQs();
      } else {
        setModalError(result.message || 'Lưu thông tin thất bại.');
      }
    } catch (err) {
      console.error('Error saving FAQ:', err);
      setModalError('Lỗi kết nối máy chủ khi lưu FAQ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-manager-page">
      <div className="chatbot-manager-container">
        
        {/* Header */}
        <div className="chatbot-header-row">
          <div>
            <h1 className="chatbot-title">Quản lý Chatbot AI</h1>
            <p className="chatbot-subtitle">Huấn luyện cơ sở dữ liệu FAQ (RAG) và theo dõi lịch sử chat của khách hàng</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="chatbot-tabs-bar">
          <button
            className={`chatbot-tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            <MessageSquare size={16} />
            <span>Quản lý FAQ</span>
          </button>
          <button
            className={`chatbot-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Calendar size={16} />
            <span>Lịch sử trò chuyện</span>
          </button>
        </div>

        {/* Tab 1 Content: FAQ Management */}
        {activeTab === 'faq' && (
          <div className="chatbot-tab-content">
            
            {/* Action controls: Search & Create */}
            <div className="chatbot-controls-row">
              <div className="chatbot-search-wrapper">
                <Search size={18} className="chatbot-search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm câu hỏi thường gặp..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setFaqPage(1);
                  }}
                  className="chatbot-search-input"
                />
              </div>
              <button className="btn-chatbot-add" onClick={openCreateModal}>
                <Plus size={16} />
                <span>Thêm câu hỏi mới</span>
              </button>
            </div>

            {/* Table */}
            <div className="chatbot-table-card">
              <div className="chatbot-table-wrapper">
                <table className="chatbot-manager-table">
                  <thead>
                    <tr>
                      <th className="faq-question-col">Câu hỏi</th>
                      <th className="faq-answer-col">Câu trả lời của AI</th>
                      <th className="faq-actions-col">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faqs.length > 0 ? (
                      faqs.map((faq) => (
                        <tr key={faq._id}>
                          <td className="faq-question-cell font-semibold">{faq.question}</td>
                          <td className="faq-answer-cell">{faq.answer}</td>
                          <td>
                            <div className="chatbot-table-actions">
                              <button
                                className="btn-edit"
                                onClick={() => openEditModal(faq)}
                                title="Chỉnh sửa"
                              >
                                <Edit2 size={14} />
                                <span>Sửa</span>
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => handleDelete(faq._id)}
                                title="Xóa"
                              >
                                <Trash2 size={14} />
                                <span>Xóa</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="chatbot-empty-row">
                          {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy câu hỏi FAQ nào khớp với bộ lọc.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {faqTotalPages > 1 && (
                <div className="chatbot-pagination-row">
                  <button
                    disabled={faqPage <= 1}
                    onClick={() => setFaqPage((p) => Math.max(1, p - 1))}
                    className="btn-chatbot-page"
                  >
                    Trước
                  </button>
                  <span className="chatbot-page-indicator">Trang {faqPage} / {faqTotalPages}</span>
                  <button
                    disabled={faqPage >= faqTotalPages}
                    onClick={() => setFaqPage((p) => Math.min(faqTotalPages, p + 1))}
                    className="btn-chatbot-page"
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2 Content: Chat Sessions History */}
        {activeTab === 'history' && (
          <div className="chatbot-tab-content">
            <div className="chatbot-table-card">
              <div className="chatbot-table-wrapper">
                <table className="chatbot-manager-table history-table">
                  <thead>
                    <tr>
                      <th className="history-time-col">Thời gian</th>
                      <th className="history-user-col">Người hỏi</th>
                      <th className="history-query-col">Câu hỏi của khách</th>
                      <th className="history-reply-col">Câu trả lời của AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.length > 0 ? (
                      sessions.map((session) => (
                        <tr key={session._id}>
                          <td className="history-time-cell">
                            {new Date(session.createdAt).toLocaleString('vi-VN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="history-user-cell font-semibold">
                            {session.userId ? (
                              <div className="user-profile-badge">
                                <User size={14} className="user-icon" />
                                <span>{session.userId.fullName}</span>
                              </div>
                            ) : (
                              <span className="guest-label">Khách vãng lai</span>
                            )}
                          </td>
                          <td className="history-query-cell">{session.userMessage}</td>
                          <td className="history-reply-cell">{session.botReply}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="chatbot-empty-row">
                          {loading ? 'Đang tải dữ liệu...' : 'Không có lịch sử trò chuyện nào.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="chatbot-pagination-row">
                  <button
                    disabled={historyPage <= 1}
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    className="btn-chatbot-page"
                  >
                    Trước
                  </button>
                  <span className="chatbot-page-indicator">Trang {historyPage} / {historyTotalPages}</span>
                  <button
                    disabled={historyPage >= historyTotalPages}
                    onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                    className="btn-chatbot-page"
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create / Edit FAQ Modal Overlay */}
        {showModal && (
          <div className="chatbot-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="chatbot-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="chatbot-modal-header">
                <h2>{modalType === 'edit' ? 'Chỉnh sửa câu hỏi FAQ' : 'Thêm câu hỏi FAQ mới'}</h2>
                <button className="btn-close-modal" onClick={() => setShowModal(false)}>&times;</button>
              </div>
              
              <form onSubmit={handleSubmit} className="chatbot-modal-form">
                {modalError && (
                  <div className="chatbot-form-error">
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="faq-question">Câu hỏi thường gặp <span className="required-star">*</span></label>
                  <textarea
                    id="faq-question"
                    rows="3"
                    placeholder="Nhập câu hỏi ví dụ khách hàng thường hỏi..."
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="faq-answer">Câu trả lời phản hồi mẫu <span className="required-star">*</span></label>
                  <textarea
                    id="faq-answer"
                    rows="6"
                    placeholder="Nhập nội dung câu trả lời chuẩn xác để AI tham khảo làm dữ liệu RAG..."
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-buttons">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn-save-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="spin-icon" size={14} />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      'Lưu thông tin'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
