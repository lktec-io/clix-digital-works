import { createContext, useContext, useState, useCallback } from 'react';
import { API, apiFetch } from '../config/api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken]     = useState(() => sessionStorage.getItem('clix_admin_token'));
  const [username, setUsername] = useState(() => sessionStorage.getItem('clix_admin_user') || '');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(token);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(API.adminLogin, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      sessionStorage.setItem('clix_admin_token', data.token);
      sessionStorage.setItem('clix_admin_user', data.username);
      setToken(data.token);
      setUsername(data.username);
      return true;
    } catch (err) {
      setError(err.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('clix_admin_token');
    sessionStorage.removeItem('clix_admin_user');
    setToken(null);
    setUsername('');
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, username, login, logout, error, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be inside AdminAuthProvider');
  return ctx;
}
