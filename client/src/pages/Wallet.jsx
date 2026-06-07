import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { CreditCard, History, DollarSign, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import './Wallet.css';

export default function Wallet() {
  const { currentUser, token, fetchCurrentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const quickAmounts = [50000, 100000, 200000, 500000];

  // Fetch transaction history
  const fetchHistory = async () => {
    if (!token) return;
    try {
      setHistoryLoading(true);
      const response = await fetch('http://localhost:5000/api/payments/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setHistory(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load history on mount or when tab changes to history
  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token, activeTab]);

  // Handle VNPay Callback parameters on mount
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      if (status === 'success') {
        toast.success('Nạp tiền thành công! Số dư tài khoản của bạn đã được cập nhật.');
        // Refresh profile & history
        fetchCurrentUser();
        fetchHistory();
      } else if (status === 'failed') {
        toast.error('Giao dịch nạp tiền thất bại hoặc đã bị hủy.');
      } else if (status === 'invalid') {
        toast.error('Giao dịch không hợp lệ hoặc lỗi chữ ký bảo mật.');
      }
      // Clear URL params
      navigate('/wallet', { replace: true });
    }
  }, [searchParams]);

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount < 10000) {
      toast.error('Vui lòng nạp tối thiểu 10.000đ');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/payments/create_payment_url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parsedAmount })
      });
      const data = await response.json();
      if (response.ok && data.success && data.paymentUrl) {
        toast.info('Đang chuyển hướng sang cổng thanh toán VNPAY...');
        window.location.href = data.paymentUrl;
      } else {
        toast.error(data.message || 'Không thể tạo yêu cầu thanh toán');
      }
    } catch (error) {
      console.error('Error creating payment url:', error);
      toast.error('Đã xảy ra lỗi khi kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '0đ';
    return val.toLocaleString('vi-VN') + 'đ';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="wallet-page">
      <div className="wallet-container">
        
        {/* Balance Card Section */}
        <div className="balance-overview-card">
          <div className="balance-info-block">
            <span className="balance-label-tag">Số dư khả dụng</span>
            <h2 className="balance-amount-display">{formatCurrency(currentUser?.balance || 0)}</h2>
            <p className="wallet-user-info">Tài khoản: {currentUser?.fullName}</p>
          </div>
          <div className="balance-card-icon">
            <DollarSign size={48} className="dollar-badge-icon" />
          </div>
        </div>

        {/* Tab Selection */}
        <div className="wallet-tabs-header">
          <button 
            className={`wallet-tab-btn ${activeTab === 'deposit' ? 'active' : ''}`}
            onClick={() => setActiveTab('deposit')}
          >
            <CreditCard size={18} />
            <span>Nạp tiền</span>
          </button>
          <button 
            className={`wallet-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            <span>Lịch sử giao dịch</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="wallet-tab-body">
          {activeTab === 'deposit' ? (
            <div className="deposit-section animate-fade">
              <h3 className="section-title">Nạp tiền vào tài khoản</h3>
              <p className="section-subtitle">Phương thức thanh toán qua ATM / Internet Banking VNPay cực kỳ an toàn</p>

              {/* Quick Select Buttons */}
              <div className="quick-amount-grid">
                {quickAmounts.map((amt) => (
                  <button 
                    key={amt}
                    type="button" 
                    className={`quick-amount-btn ${Number(amount) === amt ? 'selected' : ''}`}
                    onClick={() => setAmount(amt.toString())}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleDepositSubmit} className="deposit-form">
                <div className="form-group-wallet">
                  <label htmlFor="amount-input">Hoặc nhập số tiền mong muốn (đổi tiền VNĐ)</label>
                  <div className="amount-input-wrapper">
                    <input 
                      type="number" 
                      id="amount-input"
                      placeholder="Tối thiểu 10.000đ"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="10000"
                      className="amount-text-input"
                    />
                    <span className="amount-suffix">VND</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="confirm-deposit-btn" 
                  disabled={loading || !amount}
                >
                  {loading ? 'Đang khởi tạo giao dịch...' : 'Xác nhận nạp qua VNPAY'}
                  {!loading && <ArrowRight size={18} style={{ marginLeft: '6px' }} />}
                </button>
              </form>
            </div>
          ) : (
            <div className="history-section animate-fade">
              <div className="history-section-header">
                <h3 className="section-title">Lịch sử giao dịch</h3>
                <button onClick={fetchHistory} className="refresh-history-btn" disabled={historyLoading}>
                  <RefreshCw size={14} className={historyLoading ? 'spin-refresh' : ''} />
                  Làm mới
                </button>
              </div>

              {historyLoading && history.length === 0 ? (
                <div className="history-loading-placeholder">
                  <div className="spinner-wallet"></div>
                  <p>Đang tải dữ liệu giao dịch...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="history-empty-placeholder">
                  <AlertCircle size={36} className="empty-history-icon" />
                  <h4>Chưa có giao dịch nào</h4>
                  <p>Lịch sử nạp tiền hoặc thanh toán của bạn sẽ hiển thị ở đây.</p>
                </div>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="transaction-history-table">
                    <thead>
                      <tr>
                        <th>Mã giao dịch</th>
                        <th>Loại GD</th>
                        <th>Số tiền</th>
                        <th>Trạng thái</th>
                        <th>Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((tx) => {
                        const isSuccess = tx.status === 'Success';
                        const isFailed = tx.status === 'Failed';
                        return (
                          <tr key={tx._id}>
                            <td className="tx-code-cell" title={tx._id}>#{tx._id.slice(-8).toUpperCase()}</td>
                            <td className="tx-type-cell">
                              <span className={`badge-type ${tx.transactionType === 'Deposit' ? 'deposit' : 'payment'}`}>
                                {tx.transactionType === 'Deposit' ? 'Nạp tiền' : 'Trừ tiền'}
                              </span>
                            </td>
                            <td className="tx-amount-cell">
                              <span className={tx.transactionType === 'Deposit' ? 'text-green' : 'text-red'}>
                                {tx.transactionType === 'Deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                              </span>
                            </td>
                            <td className="tx-status-cell">
                              <div className={`status-badge-wrapper ${tx.status.toLowerCase()}`}>
                                {isSuccess && <CheckCircle2 size={13} />}
                                {isFailed && <XCircle size={13} />}
                                <span>
                                  {tx.status === 'Pending' && 'Đang chờ'}
                                  {tx.status === 'Success' && 'Thành công'}
                                  {tx.status === 'Failed' && 'Thất bại'}
                                </span>
                              </div>
                            </td>
                            <td className="tx-date-cell">{formatDate(tx.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
