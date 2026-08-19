import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import sendEmail from '../utils/email.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

export const requestAuthOtp = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const email = req.body.email?.toLowerCase()?.trim();
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    let user = await User.findOne({ email });
    
    // If user doesn't exist, this is a signup attempt. Ensure name and phone are provided if we want to create later, or just send OTP and require them during verification.
    // Let's require them during request if it's a new user, or we can handle it in the verify step.
    // The safest is to just send the OTP to the email. If the user doesn't exist, they will be created during verifyOtp.

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    if (user) {
      user.loginOtp = hashedOtp;
      user.loginOtpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
      await user.save();
    } else {
      // Create a temporary unverified user or just allow verifyOtp to create the user?
      // Better to create the user but mark as inactive or just store the OTP. 
      // Actually, we can create the user here but if they don't verify, it's a dead account.
      // Let's create the user right away if name and phone are provided.
      if (!name || !phone) {
        return res.status(400).json({ message: 'Name and phone are required for new users' });
      }
      user = await User.create({
        name,
        email,
        phone,
        loginOtp: hashedOtp,
        loginOtpExpire: Date.now() + 5 * 60 * 1000
      });
    }

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
          <p style="font-size: 14px;">This OTP is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.</p>
          <p style="font-size: 14px; margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
          <p style="font-size: 14px;">Thank you for using our service!</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">
          &copy; ${new Date().getFullYear()} The Balified Villa. All rights reserved.
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Your Login OTP - The Balified Villa',
      html
    });

    res.json({ message: 'OTP sent to your email!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyAuthOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const cleanEmail = email?.toLowerCase()?.trim();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email: cleanEmail,
      loginOtp: hashedOtp,
      loginOtpExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP
    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;
    await user.save();

    res.json({
      token: signToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, wishlist: user.wishlist || [] },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Admin login ONLY
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can use password login' });
    }

    res.json({
      token: signToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, wishlist: user.wishlist || [] },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User account no longer exists' });
  }
  res.json({ user: req.user });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
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
