import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import sendEmail from '../utils/email.js';

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

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user with that email exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    user.resetPasswordToken = hashedOtp;
    user.resetPasswordExpire = Date.now() + 2 * 60 * 1000; // 2 minutes
    await user.save();

    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">
          Your OTP Code
        </div>
        <div style="padding: 30px; background-color: #ffffff; color: #374151; line-height: 1.6;">
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for account verification is:</p>
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 4px; margin: 25px 0;">
            ${otp}
          </div>
          <p style="font-size: 14px;">This OTP is valid for <strong>2 minutes</strong>. Please do not share this code with anyone.</p>
          <p style="font-size: 14px; margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
          <p style="font-size: 14px;">Thank you for using our service!</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">
          &copy; 2026 The Balified Villa. All rights reserved.
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Your OTP Code - The Balified Villa',
      html
    });

    res.json({ message: 'OTP sent to your email!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      token: signToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, wishlist: user.wishlist || [] },
      message: 'Password reset successful!'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
