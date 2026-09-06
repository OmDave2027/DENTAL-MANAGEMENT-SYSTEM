import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';

const AuthContext = createContext();
const SESSION_KEY = 'dms_session';
const TOKEN_KEY = 'dms_access_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw && localStorage.getItem(TOKEN_KEY)) {
        setUser(JSON.parse(raw));
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const account = response.user;
      const nameParts = (account.full_name || '').trim().split(/\s+/);
      const sessionUser = {
        id: account.id,
        Firstname: nameParts[0] || '',
        Lastname: nameParts.slice(1).join(' '),
        email: account.email,
        phone: account.phone,
        role: account.role === 'ADMIN' ? 'ADMIN' : 'USER',
      };

      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const signup = async ({ Firstname, Lastname, email, password }) => {
    try {
      const response = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          full_name: `${Firstname} ${Lastname}`.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      toast.success(response.message || 'Account created! Please log in.');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const logout = async () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        accessToken: localStorage.getItem(TOKEN_KEY),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
