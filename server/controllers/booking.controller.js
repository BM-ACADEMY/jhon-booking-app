import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Note: Some versions of razorpay in ESM might need a different import style
// but usually this works if keys are provided.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// Helper to calculate dates between check-in and check-out
const getDatesInRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const date = new Date(start.getTime());
  const dates = [];
  while (date <= end) {
    dates.push(new Date(date.getTime()));
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

// Helper to verify if room is available
const checkRoomAvailability = async (roomId, checkIn, checkOut) => {
  if (!roomId || !checkIn || !checkOut) return true; // skip validation if params missing
  const room = await Room.findById(roomId);
  if (!room) return false;
  
  if (!room.unavailableDates || room.unavailableDates.length === 0) return true;
  
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const requestedDates = getDatesInRange(start, end);
  
  const hasOverlap = requestedDates.some(reqDate => {
    return room.unavailableDates.some(unDate => {
      const uDate = new Date(unDate);
      return uDate.toDateString() === reqDate.toDateString();
    });
  });
  
  return !hasOverlap;
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email phone')
      .populate('room', 'name category price')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('room', 'name category price images')
      .sort({ createdAt: -1 });

    const reviews = await Review.find({ user: req.user._id });
    const reviewedBookingIds = reviews.map(r => r.booking?.toString()).filter(Boolean);

    const bookingsWithReviewStatus = bookings.map(b => {
      const bObj = b.toObject();
      bObj.isReviewed = reviewedBookingIds.includes(b._id.toString());
      return bObj;
    });

    res.json(bookingsWithReviewStatus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', roomId, checkIn, checkOut } = req.body;
    
    // Check room availability first
    if (roomId && checkIn && checkOut) {
      const isAvailable = await checkRoomAvailability(roomId, checkIn, checkOut);
      if (!isAvailable) {
        return res.status(400).json({ message: 'Room is already booked for the selected dates!' });
      }
    }

    const options = {
      amount: amount * 100, // amount in the smallest currency unit (paise)
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      bookingData 
    } = req.body;

    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      return res.status(400).json({ message: 'Transaction not legitimate!' });
    }

    // Double check availability before creating booking
    const isAvailable = await checkRoomAvailability(bookingData.room, bookingData.checkIn, bookingData.checkOut);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Room was booked by someone else during checkout!' });
    }

    // Payment is verified, create the booking
    const booking = await Booking.create({
      ...bookingData,
      user: req.user._id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'paid',
      status: 'confirmed'
    });

    // Block the booked dates in the Room database
    const bookedDates = getDatesInRange(bookingData.checkIn, bookingData.checkOut);
    await Room.findByIdAndUpdate(bookingData.room, {
      $addToSet: { unavailableDates: { $each: bookedDates } }
    });

    res.status(201).json({ 
      message: 'Payment verified and booking created successfully', 
      booking 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { room, checkIn, checkOut } = req.body;
    
    // Check availability
    const isAvailable = await checkRoomAvailability(room, checkIn, checkOut);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Room is not available for the selected dates!' });
    }

    const booking = await Booking.create({ ...req.body, user: req.user._id });

    // Block dates
    const bookedDates = getDatesInRange(checkIn, checkOut);
    await Room.findByIdAndUpdate(room, {
      $addToSet: { unavailableDates: { $each: bookedDates } }
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    
    // Sum totalAmount of all bookings except cancelled ones
    const revenueResult = await Booking.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const totalRooms = await Room.countDocuments();
    // Total guests from bookings (sum of guests field in non-cancelled bookings)
    const guestsAgg = await Booking.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$guests' } } }
    ]);
    const totalGuests = guestsAgg[0]?.total || 0;

    // Calculate Occupancy today
    // Use UTC start of day for accurate occupancy calculation across timezones
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const activeBookings = await Booking.find({
      status: { $in: ['confirmed', 'completed'] },
      checkIn: { $lte: today },
      checkOut: { $gte: today }
    });
    
    const occupiedRoomIds = [...new Set(activeBookings.map(b => b.room.toString()))];
    const occupiedRoomsCount = occupiedRoomIds.length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRoomsCount / totalRooms) * 100) : 0;

    const pendingBookings = await Booking.countDocuments({ status: 'pending' });

    // Check-ins / check-outs today
    const todayCheckIns = await Booking.countDocuments({
      checkIn: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' }
    });
    
    const todayCheckOuts = await Booking.countDocuments({
      checkOut: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' }
    });

    // Recent bookings (last 5)
    const recentBookings = await Booking.find()
      .populate('user', 'name')
      .populate('room', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const formattedRecent = recentBookings.map(b => ({
      id: b._id,
      guest: b.user?.name || 'Deleted User',
      room: b.room?.name || 'Deleted Room',
      checkIn: b.checkIn ? new Date(b.checkIn).toISOString().split('T')[0] : 'N/A',
      checkOut: b.checkOut ? new Date(b.checkOut).toISOString().split('T')[0] : 'N/A',
      amount: `$${b.totalAmount}`,
      status: b.status || 'pending'
    }));

    // Calculate monthly stats for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyStatsAgg = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const label = `${monthNames[monthIndex]} ${year}`;
      
      const match = monthlyStatsAgg.find(item => item._id.year === year && item._id.month === (monthIndex + 1));
      
      last6Months.push({
        name: label,
        revenue: match ? match.revenue : 0,
        bookings: match ? match.bookings : 0
      });
    }

    res.json({
      totalBookings,
      totalRevenue,
      totalRooms,
      totalGuests,
      occupancyRate,
      occupiedRoomsCount,
      pendingBookings,
      todayCheckIns,
      todayCheckOuts,
      recentBookings: formattedRecent,
      monthlyStats: last6Months
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
