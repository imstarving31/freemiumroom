import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import PostRoom from './pages/PostRoom';
import Login from './pages/Login';
import Register from './pages/Register';
import RoomDetail from './pages/RoomDetail';
import FavoritePosts from './pages/FavoritePosts';
import Wallet from './pages/Wallet';
import ManagePosts from './pages/ManagePosts';
import EditPost from './pages/EditPost';
import AccountManager from './pages/AccountManager';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import ApprovePosts from './pages/Admin/ApprovePosts';
import ManageCategories from './pages/Admin/ManageCategories';
import ManageUsers from './pages/Admin/ManageUsers';
import ManageTransactions from './pages/Admin/ManageTransactions';
import ChatbotManager from './pages/Admin/ChatbotManager';
import socket from './utils/socket';
import { useAuth } from './context/AuthContext';
import ChatbotBubble from './components/ChatbotBubble';
import './App.css';

function App() {
  const currentUser = useAuth()?.currentUser;
  const currentUserId = currentUser?._id;

  React.useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    return () => {
      socket.off('connect');
      socket.disconnect();
    };
  }, []);

  React.useEffect(() => {
    socket.on('force-logout', (data) => {
      if (data.userId === currentUserId) {
        localStorage.clear();
        alert('Tài khoản của bạn đã bị quản trị viên khóa!');
        window.location.href = '/login';
      }
    });

    return () => {
      socket.off('force-logout');
    };
  }, [currentUserId]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dang-tin" element={<PostRoom />} />
            <Route path="/favorites" element={<FavoritePosts />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/manage-posts" element={<ManagePosts />} />
            <Route path="/edit-post/:id" element={<EditPost />} />
            <Route path="/profile" element={<AccountManager />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/room/:id" element={<RoomDetail />} />
        </Route>

        {/* Admin Protected Routes with AdminLayout */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/approve-posts" element={<ApprovePosts />} />
            <Route path="/admin/categories" element={<ManageCategories />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/transactions" element={<ManageTransactions />} />
            <Route path="/admin/chatbot" element={<ChatbotManager />} />
          </Route>
        </Route>
      </Routes>
      <ChatbotBubble />
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </BrowserRouter>
  );
}

export default App;
