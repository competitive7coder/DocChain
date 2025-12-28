import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchUser = async () => {
    if (token) {
      try {
        const userData = await authAPI.getMe();
        setUser(userData);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };
  fetchUser();
}, [token]);

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authAPI.register(userData);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

