import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChatbotBubble.css';

const INITIAL_MESSAGES = [
  {
    sender: 'bot',
    text: 'Xin chào! 👋 Tôi là trợ lý ảo tư vấn phòng trọ. Tôi có thể giúp gì cho bạn?'
  }
];

// Helper to safely format basic markdown formatting (bold, italic, links, line breaks) from AI response
const formatMessageText = (text) => {
  if (!text) return '';
  
  // Escape HTML to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
    
  // Parse bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Parse italic (*text*)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Parse markdown links [Text](URL)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="chatbot-link">$1</a>');
  
  // Parse line breaks
  html = html.replace(/\n/g, '<br />');
  
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

const ChatbotBubble = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(() => {
    const saved = sessionStorage.getItem('chatbot_is_open');
    return saved === 'true';
  });
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('chatbot_messages');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  // Save messages to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('chatbot_messages', JSON.stringify(messages));
  }, [messages]);

  // Save open state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('chatbot_is_open', String(isOpen));
  }, [isOpen]);

  // Listen to external open-chatbot event
  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-chatbot', handleOpenChatbot);
    return () => {
      window.removeEventListener('open-chatbot', handleOpenChatbot);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleBodyClick = (e) => {
    // Check if clicked element is a chatbot link
    const link = e.target.closest('.chatbot-link');
    if (link) {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href) {
        navigate(href);
      }
    }
  };

  const handleSendMessage = async (customMessage) => {
    const trimmed = typeof customMessage === 'string' ? customMessage.trim() : inputValue.trim();
    if (!trimmed || isLoading) return;

    // 1. Push user message
    const userMessage = { sender: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    if (typeof customMessage !== 'string') {
      setInputValue('');
    }
    setIsLoading(true);

    try {
      // 2. Call chatbot API with optional user authorization token
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: trimmed })
      });

      const data = await response.json();

      if (data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: data.reply }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: data.reply || 'Xin lỗi, tôi không thể xử lý yêu cầu này. Vui lòng thử lại!'
          }
        ]);
      }
    } catch (error) {
      console.error('Chatbot API error:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Xin lỗi, đã có lỗi kết nối. Vui lòng thử lại sau!'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* ---- Chat Window ---- */}
      {isOpen && (
        <div className="chatbot-window" id="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-header-avatar">🤖</div>
              <div className="chatbot-header-text">
                <span className="chatbot-header-title">Trợ lý FreemiumRoom</span>
                <span className="chatbot-header-subtitle">
                  Tư vấn phòng trọ 24/7
                </span>
              </div>
            </div>
            <button
              className="chatbot-close-btn"
              onClick={handleToggle}
              aria-label="Đóng cửa sổ chat"
              id="chatbot-close-btn"
            >
              ✕
            </button>
          </div>

          {/* Messages Body */}
          <div className="chatbot-body" id="chatbot-body" onClick={handleBodyClick}>
            {messages.map((msg, index) => (
              <React.Fragment key={index}>
                <div className={`chatbot-msg-row ${msg.sender}`}>
                  <div className="chatbot-msg-bubble">{formatMessageText(msg.text)}</div>
                </div>

                {/* Render Welcome Cards right after the first bot greeting message, ONLY if no other messages exist */}
                {index === 0 && messages.length === 1 && (
                  <div className="chatbot-welcome-menu">
                    <button 
                      className="welcome-menu-card"
                      onClick={() => handleSendMessage('Làm thế nào để đăng tin phòng trọ?')}
                      disabled={isLoading}
                    >
                      <span className="card-icon">📝</span>
                      <div className="card-details">
                        <span className="card-title">Đăng tin phòng trọ</span>
                        <span className="card-desc">Tìm hiểu cách đăng phòng trọ mới lên hệ thống</span>
                      </div>
                    </button>
                    <button 
                      className="welcome-menu-card"
                      onClick={() => handleSendMessage('Phí nâng cấp tin đăng VIP là bao nhiêu?')}
                      disabled={isLoading}
                    >
                      <span className="card-icon">💎</span>
                      <div className="card-details">
                        <span className="card-title">Nâng cấp tin VIP</span>
                        <span className="card-desc">Xem bảng giá dịch vụ và quyền lợi tin VIP</span>
                      </div>
                    </button>
                    <button 
                      className="welcome-menu-card"
                      onClick={() => handleSendMessage('Làm sao để liên hệ hỗ trợ kỹ thuật?')}
                      disabled={isLoading}
                    >
                      <span className="card-icon">📞</span>
                      <div className="card-details">
                        <span className="card-title">Hỗ trợ kỹ thuật</span>
                        <span className="card-desc">Liên hệ email của tôi: 2iamduy@gmail.com</span>
                      </div>
                    </button>
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="chatbot-msg-row bot">
                <div className="chatbot-typing-indicator">
                  <span className="chatbot-typing-dot"></span>
                  <span className="chatbot-typing-dot"></span>
                  <span className="chatbot-typing-dot"></span>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer / Input */}
          <div className="chatbot-footer">
            <input
              ref={inputRef}
              className="chatbot-input"
              type="text"
              placeholder="Nhập tin nhắn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              id="chatbot-input"
            />
            <button
              className="chatbot-send-btn"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Gửi tin nhắn"
              id="chatbot-send-btn"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ---- Floating Bubble ---- */}
      <button
        className={`chatbot-bubble-btn ${isOpen ? 'is-open' : ''}`}
        onClick={handleToggle}
        aria-label={isOpen ? 'Đóng chatbot' : 'Mở chatbot'}
        id="chatbot-bubble-btn"
      >
        <span className="chatbot-bubble-icon">
          {isOpen ? '✕' : '💬'}
        </span>
      </button>
    </>
  );
};

export default ChatbotBubble;
