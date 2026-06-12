import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dsims_token');
    const savedUser = localStorage.getItem('dsims_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify with backend
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('dsims_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('dsims_token');
          localStorage.removeItem('dsims_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('dsims_token', res.data.token);
    localStorage.setItem('dsims_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('dsims_token');
    localStorage.removeItem('dsims_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);