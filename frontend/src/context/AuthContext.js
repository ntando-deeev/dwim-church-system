import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API = process.env.REACT_APP_API_URL || '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('dwim_token'));

  // Axios interceptor
  useEffect(() => {
    const id = axios.interceptors.request.use(config => {
      const t = localStorage.getItem('dwim_token');
      if (t) config.headers.Authorization = `Bearer ${t}`;
      return config;
    });
    return () => axios.interceptors.request.eject(id);
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/auth/me`);
      setUser(data.user);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchMe();
    else setLoading(false);
  }, [token, fetchMe]);

  const login = async (emailOrToken, passwordOrUser) => {
    // Support both: login(email, password) and login(token, user) from signup
    if (typeof passwordOrUser === 'object') {
      // Called from signup with pre-issued token+user
      localStorage.setItem('dwim_token', emailOrToken);
      setToken(emailOrToken);
      setUser(passwordOrUser);
      return passwordOrUser;
    }
    const { data } = await axios.post(`${API}/api/auth/login`, { email: emailOrToken, password: passwordOrUser });
    localStorage.setItem('dwim_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('dwim_token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const API_URL = API;
