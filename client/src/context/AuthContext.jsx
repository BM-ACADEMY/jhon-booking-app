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
      setAuthModal('login');
      return false;
    }
    
    // Save original state for potential rollback
    const originalUser = { ...user };
    const originalWishlist = user.wishlist || [];
    
    // Calculate optimistic wishlist
    let optimisticWishlist;
    if (originalWishlist.includes(roomId)) {
      optimisticWishlist = originalWishlist.filter(id => id !== roomId);
    } else {
      optimisticWishlist = [...originalWishlist, roomId];
    }
    
    const optimisticUser = { ...user, wishlist: optimisticWishlist };
    
    // Instantly update global state & local storage
    setUser(optimisticUser);
    localStorage.setItem('admin_user', JSON.stringify(optimisticUser));
    
    try {
      const res = await api.post('/auth/wishlist/toggle', { roomId });
      const finalWishlist = res.data.wishlist || [];
      const finalUser = { ...user, wishlist: finalWishlist };
      
      // Update with final server data (in case of server-side adjustments)
      setUser(finalUser);
      localStorage.setItem('admin_user', JSON.stringify(finalUser));
      return true;
    } catch (err) {
      // Rollback to original state on failure
      setUser(originalUser);
      localStorage.setItem('admin_user', JSON.stringify(originalUser));
      
      toast.error(err.response?.data?.message || 'Failed to toggle wishlist');
      console.error(err);
      return false;
    }
  };

  const [authModal, setAuthModal] = useState(null); // null, 'login', 'register'

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserData, toggleUserWishlist, isAdmin: user?.role === 'admin', authModal, setAuthModal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
