import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('admin_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData, token) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  const updateUserData = (userData) => {
    localStorage.setItem('admin_user', JSON.stringify(userData));
    setUser(userData);
  };

  const toggleUserWishlist = async (roomId) => {
    if (!user) {
      toast.error('Please log in to manage your wishlist');
      return false;
    }
    try {
      const res = await api.post('/auth/wishlist/toggle', { roomId });
      const updatedWishlist = res.data.wishlist || [];
      const updatedUser = { ...user, wishlist: updatedWishlist };
      updateUserData(updatedUser);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle wishlist');
      console.error(err);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserData, toggleUserWishlist, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
