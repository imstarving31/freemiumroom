import React, { createContext, useState, useEffect, useContext } from 'react';

// Global fetch interceptor to catch 403 Forbidden (Blocked users)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);
    if (response.status === 403) {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        sessionStorage.clear();
        
        // Redirect to login page if we are not already on it
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?blocked=true';
        }
      }
    }
    return response;
  } catch (error) {
    throw error;
  }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async (customToken = null) => {
    const activeToken = customToken || token || localStorage.getItem('token');
    if (!activeToken) return null;
    try {
      const response = await fetch('http://localhost:5000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      
      if (response.status === 403) {
        setCurrentUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        return null;
      }

      const data = await response.json();
      if (response.ok && data.success) {
        setCurrentUser(data.data);
        localStorage.setItem('currentUser', JSON.stringify(data.data));
        return data.data;
      }
    } catch (error) {
      console.error('Error fetching current user profile:', error);
    }
    return null;
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('currentUser');
      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setCurrentUser(JSON.parse(savedUser));
          // Refresh profile in background
          await fetchCurrentUser(savedToken);
        } catch (error) {
          console.error('Failed to parse user info from localStorage', error);
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = (user, tokenValue) => {
    setCurrentUser(user);
    setToken(tokenValue);
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('currentUser', JSON.stringify(user));
    fetchCurrentUser(tokenValue); // Refresh to be safe
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  };

  const updateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, loading, login, logout, updateUser, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
