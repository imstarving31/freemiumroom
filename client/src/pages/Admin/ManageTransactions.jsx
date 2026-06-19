import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Search,
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  DollarSign,
  Calendar,
  Loader2,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Edit3,
  X
} from 'lucide-react';
import './ManageTransactions.css';

export default function ManageTransactions() {
  const { token } = useAuth();

  // Transaction states
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queryLoadingId, setQueryLoadingId] = useState(null);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal states for admin note
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [tempNoteText, setTempNoteText] = useState('');
  const [noteSubmitLoading, setNoteSubmitLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Stats state
  const [stats, setStats] = useState({
    totalCount: 0,
    successCount: 0,
    pendingCount: 0,
    totalDepositSuccess: 0
  });

  // Fetch all transactions from API
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Không thể tải danh sách giao dịch.');
      }

      const list = result.data || [];
      setTransactions(list);

      // Compute statistics based on the full list of transactions
      const totalCount = list.length;
      const successCount = list.filter(t => t.status === 'Success').length;
      const pendingCount = list.filter(t => t.status === 'Pending').length;
      const totalDepositSuccess = list
        .filter(t => t.status === 'Success' && t.transactionType === 'Deposit')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      setStats({
        totalCount,
        successCount,
        pendingCount,
        totalDepositSuccess
      });
    } catch (err) {
      console.error('Error fetching transactions:', err);
      toast.error(err.message || 'Lỗi kết nối máy chủ khi tải danh sách giao dịch.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  // Format date and time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Handle QueryDR / Đối soát transaction
  const handleQueryDR = async (transactionId) => {
    try {
      setQueryLoadingId(transactionId);
      toast.info('Đang gửi truy vấn đối soát tới VNPay...', { autoClose: 2000 });

      // 1. Call query-status API
      const queryResponse = await fetch('http://localhost:5000/api/payments/query-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactionId })
      });

      const queryResult = await queryResponse.json();

      if (!queryResponse.ok) {
        throw new Error(queryResult.message || 'Không thể đối soát giao dịch từ VNPay.');
      }

      const vnpayData = queryResult.data;

      // Extract transaction status code from VNPAY response
      // vnp_TransactionStatus === '00' is Success
      if (vnpayData && vnpayData.vnp_TransactionStatus === '00') {
        toast.success('VNPay xác nhận: Giao dịch thành công! Đang tiến hành cập nhật hệ thống...');

        // 2. Call update-status API to mark transaction as Success and credit user
        const updateResponse = await fetch('http://localhost:5000/api/payments/update-status', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ transactionId })
        });

        const updateResult = await updateResponse.json();

        if (!updateResponse.ok) {
          throw new Error(updateResult.message || 'Lỗi cập nhật trạng thái giao dịch.');
        }

        toast.success(updateResult.message || 'Cập nhật trạng thái giao dịch thành công và đã cộng tiền ví.');
        fetchTransactions(); // Reload data
      } else {
        // Handle other codes
        const statusMsg = vnpayData ? getTransactionStatusMessage(vnpayData.vnp_TransactionStatus) : 'Không rõ trạng thái';
        const responseMsg = vnpayData ? getResponseCodeMessage(vnpayData.vnp_ResponseCode) : '';
        toast.warn(`Đối soát hoàn tất. VNPay báo: ${statusMsg}. ${responseMsg}`);
      }
    } catch (err) {
      console.error('Error in handleQueryDR:', err);
      toast.error(err.message || 'Lỗi xảy ra trong quá trình đối soát giao dịch.');
    } finally {
      setQueryLoadingId(null);
    }
  };

  // Open modal and prepopulate note
  const openNoteModal = (txn) => {
    setSelectedTxn(txn);
    setTempNoteText(txn.adminNote || '');
    setShowNoteModal(true);
  };

  // Close modal
  const closeNoteModal = () => {
    setShowNoteModal(false);
    setSelectedTxn(null);
    setTempNoteText('');
  };

  // Handle note submission to API
  const handleUpdateNote = async () => {
    if (!selectedTxn) return;
    try {
      setNoteSubmitLoading(true);
      const response = await fetch(`http://localhost:5000/api/admin/transactions/${selectedTxn._id}/note`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminNote: tempNoteText })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Không thể cập nhật ghi chú giao dịch.');
      }

      toast.success(result.message || 'Cập nhật ghi chú giao dịch thành công!');

      // Update local state directly
      setTransactions(prev =>
        prev.map(t => t._id === selectedTxn._id ? { ...t, adminNote: tempNoteText } : t)
      );
      closeNoteModal();
    } catch (err) {
      console.error('Error updating note:', err);
      toast.error(err.message || 'Lỗi xảy ra khi cập nhật ghi chú giao dịch.');
    } finally {
      setNoteSubmitLoading(false);
    }
  };

  // VNPAY Transaction Status mapper helper
  const getTransactionStatusMessage = (statusCode) => {
    const statusCodes = {
      '00': 'Giao dịch thành công',
      '01': 'Giao dịch chưa hoàn tất',
      '02': 'Giao dịch bị lỗi',
      '04': 'Giao dịch đảo (Khách hàng đã bị trừ tiền nhưng GD bị hủy ở merchant)',
      '05': 'VNPAY đang xử lý giao dịch này (Hoàn tiền)',
      '06': 'VNPAY đã gửi yêu cầu hoàn tiền sang Ngân hàng',
      '07': 'Giao dịch nghi ngờ gian lận',
      '09': 'Giao dịch hoàn trả bị từ chối'
    };
    return statusCodes[statusCode] || `Mã trạng thái: ${statusCode}`;
  };

  // VNPAY Response Code mapper helper
  const getResponseCodeMessage = (code) => {
    const codes = {
      '00': 'Thành công',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
      '10': 'Khách hàng xác thực thông tin thẻ/tài khoản không chính xác quá 3 lần',
      '11': 'Đã hết hạn chờ thanh toán',
      '12': 'Tài khoản của khách hàng không đủ số dư',
      '24': 'Khách hàng hủy giao dịch',
      '91': 'Không tìm thấy giao dịch yêu cầu đối soát',
      '94': 'Yêu cầu trùng lặp trong thời gian giới hạn',
      '97': 'Chữ ký không hợp lệ'
    };
    return codes[code] ? `(Chi tiết: ${codes[code]})` : '';
  };

  // Filtering logic
  const filteredTransactions = transactions.filter(t => {
    // 1. Search Query
    const userFullName = t.userID?.fullName || '';
    const userEmail = t.userID?.email || '';
    const txnId = t._id || '';
    const matchesSearch =
      userFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txnId.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Status Filter
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;

    // 3. Type Filter
    const matchesType = typeFilter === '' || t.transactionType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page changes
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  return (
    <div className="admin-txns-page">
      <div className="admin-txns-container">

        {/* Title row */}
        <div className="admin-title-row">
          <div>
            <h1 className="admin-page-title">Quản lý giao dịch</h1>
            <p className="admin-page-subtitle">Theo dõi, đối soát trạng thái nạp tiền và thanh toán của toàn bộ thành viên</p>
          </div>
          <button
            type="button"
            className="refresh-data-btn"
            onClick={fetchTransactions}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="admin-stats-grid">

          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-blue text-blue">
              <CreditCard size={22} />
            </div>
            <div className="stat-data">
              <span className="stat-value">{stats.totalCount}</span>
              <span className="stat-label-text">Tổng số giao dịch</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-green text-green">
              <CheckCircle size={22} />
            </div>
            <div className="stat-data">
              <span className="stat-value">{stats.successCount}</span>
              <span className="stat-label-text">Giao dịch thành công</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-yellow text-yellow">
              <Clock size={22} />
            </div>
            <div className="stat-data">
              <span className="stat-value">{stats.pendingCount}</span>
              <span className="stat-label-text">Giao dịch đang chờ</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-circle bg-purple text-purple">
              <DollarSign size={22} />
            </div>
            <div className="stat-data">
              <span className="stat-value">{formatCurrency(stats.totalDepositSuccess)}</span>
              <span className="stat-label-text">Tổng tiền nạp thành công</span>
            </div>
          </div>

        </div>

        {/* Filter Toolbar Card */}
        <div className="admin-filter-card">
          <div className="filter-search-box">
            <Search size={18} className="search-icon-svg" />
            <input
              type="text"
              placeholder="Tìm theo Mã GD, tên hoặc email người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-search-input"
            />
          </div>

          <div className="filter-select-group">
            <div className="select-wrapper">
              <label className="select-label">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select-dropdown"
              >
                <option value="All">Tất cả trạng thái</option>
                <option value="Pending">Đang chờ</option>
                <option value="Success">Thành công</option>
                <option value="Failed">Thất bại</option>
              </select>
            </div>

            <div className="select-wrapper">
              <label className="select-label">Loại giao dịch</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-select-dropdown"
              >
                <option value="">Tất cả loại GD</option>
                <option value="Deposit">Nạp tiền</option>
                <option value="Payment">Thanh toán</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="admin-table-card">
          {loading ? (
            <div className="table-loading-spinner-box">
              <Loader2 size={44} className="spin-icon text-blue" />
              <p className="loading-spinner-text">Đang tải danh sách giao dịch từ hệ thống...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="table-empty-box">
              <XCircle size={48} className="empty-box-icon" />
              <h3>Không tìm thấy giao dịch nào</h3>
              <p>Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Mã giao dịch</th>
                    <th>Thành viên</th>
                    <th>Số tiền</th>
                    <th>Loại GD</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((txn) => {
                    const isQueryLoading = queryLoadingId === txn._id;
                    return (
                      <tr key={txn._id} className="table-row-hover">
                        <td className="font-mono-code text-sm text-gray" title={txn._id}>
                          {txn._id.slice(-8).toUpperCase()}...
                        </td>
                        <td>
                          <div className="user-profile-cell">
                            <div className="user-avatar-circle">
                              {txn.userID?.fullName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="user-info-text">
                              <span className="user-fullname-span">{txn.userID?.fullName || 'Người dùng ẩn'}</span>
                              <span className="user-email-span">{txn.userID?.email || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="amount-value-td">
                          <span className={txn.transactionType === 'Deposit' ? 'amount-deposit' : 'amount-withdraw'}>
                            {txn.transactionType === 'Deposit' ? '+' : '-'} {formatCurrency(txn.amount)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-type ${txn.transactionType.toLowerCase()}`}>
                            {txn.transactionType === 'Deposit' ? 'Nạp tiền' : txn.transactionType === 'Withdraw' ? 'Rút tiền' : 'Thanh toán'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-status ${txn.status.toLowerCase()}`}>
                            <span className="badge-dot-indicator"></span>
                            {txn.status === 'Success' ? 'Thành công' : txn.status === 'Pending' ? 'Đang chờ' : 'Thất bại'}
                          </span>
                        </td>
                        <td className="text-sm text-gray">
                          <div className="time-display-cell">
                            <Calendar size={13} className="time-calendar-icon" />
                            <span>{formatDateTime(txn.createdAt)}</span>
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="action-buttons-cell">
                            {txn.status === 'Pending' ? (
                              <button
                                type="button"
                                onClick={() => handleQueryDR(txn._id)}
                                disabled={queryLoadingId !== null}
                                className="btn-action-querydr"
                                title="Kiểm tra trạng thái thực tế từ VNPay để xác nhận giao dịch"
                              >
                                {isQueryLoading ? (
                                  <>
                                    <Loader2 size={13} className="spin-icon button-action-spinner" />
                                    <span>Đang check...</span>
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw size={13} />
                                    <span>Đối soát</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-muted-gray text-xs">Đã hoàn thành</span>
                            )}
                            <button
                              type="button"
                              onClick={() => openNoteModal(txn)}
                              className={`btn-action-note ${txn.adminNote ? 'has-note' : ''}`}
                              title={txn.adminNote ? `Ghi chú: ${txn.adminNote}` : 'Thêm ghi chú của admin'}
                            >
                              <Edit3 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && filteredTransactions.length > 0 && (
            <div className="table-pagination-footer">
              <span className="pagination-info-text">
                Hiển thị <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredTransactions.length)}</strong> trong tổng số <strong>{filteredTransactions.length}</strong> giao dịch
              </span>

              <div className="pagination-button-controls">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="pagination-arrow-btn"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="pagination-numbers-container">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index + 1}
                      type="button"
                      onClick={() => setCurrentPage(index + 1)}
                      className={`pagination-number-btn ${currentPage === index + 1 ? 'active' : ''}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="pagination-arrow-btn"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Note Modal */}
        {showNoteModal && (
          <div className="note-modal-overlay" onClick={closeNoteModal}>
            <div className="note-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="note-modal-header">
                <h3 className="note-modal-title">Ghi chú giao dịch</h3>
                <button type="button" className="note-modal-close-btn" onClick={closeNoteModal}>
                  <X size={18} />
                </button>
              </div>
              <div className="note-modal-body">
                <span className="note-modal-label">Nội dung ghi chú đối soát:</span>
                <textarea
                  className="note-modal-textarea"
                  placeholder="Nhập ghi chú cho giao dịch này"
                  value={tempNoteText}
                  onChange={(e) => setTempNoteText(e.target.value)}
                />
              </div>
              <div className="note-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={closeNoteModal}
                  disabled={noteSubmitLoading}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn-modal-save"
                  onClick={handleUpdateNote}
                  disabled={noteSubmitLoading}
                >
                  {noteSubmitLoading ? 'Đang lưu...' : 'Lưu ghi chú'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
