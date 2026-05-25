import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, phone });
    res.status(201).json({
      token: signToken(user._id),
      user: { id: user._id, name, email, role: user.role, wishlist: user.wishlist || [] },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({
      token: signToken(user._id),
      user: { id: user._id, name: user.name, email, role: user.role, wishlist: user.wishlist || [] },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMe = (req, res) => {
  res.json({ user: req.user });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Validate email uniqueness if changed
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email is already in use by another user' });
      user.email = email;
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;

    if (password) {
      user.password = password;
    }

    const updatedUser = await user.save();
    
    res.json({
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        wishlist: updatedUser.wishlist || []
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ message: 'Room ID is required' });
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.wishlist) user.wishlist = [];

    const index = user.wishlist.indexOf(roomId);
    if (index === -1) {
      user.wishlist.push(roomId);
    } else {
      user.wishlist.splice(index, 1);
    }

    await user.save();
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: { path: 'category' } // populated category in nested populated fields
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.wishlist || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
