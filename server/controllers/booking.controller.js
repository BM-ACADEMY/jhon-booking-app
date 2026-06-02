import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import sendEmail from '../utils/email.js';
import { getGuestBookingEmailTemplate, getAdminBookingEmailTemplate } from '../templates/bookingConfirmation.js';

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

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

// Helper to check if a combination of rooms can accommodate the guests
const canAccommodateCombination = (roomsList, adults, children) => {
  const n = roomsList.length;
  if (adults < n) return false;

  function backtrack(index, remainingAdults, remainingChildren) {
    if (index === n) {
      return remainingAdults === 0 && remainingChildren === 0;
    }

    const room = roomsList[index];
    const maxAd = (room.maxAdults !== undefined && room.maxAdults !== null) ? room.maxAdults : (room.guests || 2);
    const maxCh = (room.maxChildren !== undefined && room.maxChildren !== null) ? room.maxChildren : 0;
    const maxTotalGuests = (room.guests !== undefined && room.guests !== null) ? room.guests : (maxAd + maxCh);

    const upperA = Math.min(maxAd, remainingAdults);
    for (let a = 1; a <= upperA; a++) {
      if (a > maxTotalGuests) continue;
      const maxChForThisRoom = maxCh + (maxAd - a);
      const upperC = Math.min(maxChForThisRoom, maxTotalGuests - a, remainingChildren);
      for (let c = 0; c <= upperC; c++) {
        if (backtrack(index + 1, remainingAdults - a, remainingChildren - c)) {
          return true;
        }
      }
    }
    return false;
  }

  return backtrack(0, adults, children);
};


// Helper to verify if room is available
const checkRoomAvailability = async (roomId, checkIn, checkOut, adults, children, roomsCount = 1) => {
  if (!roomId) return { isAvailable: true };
  const primaryRoom = await Room.findById(roomId);
  if (!primaryRoom) return { isAvailable: false, message: 'Room not found.' };

  // Check if primary room itself is date-available
  if (checkIn && checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const requestedDates = getDatesInRange(start, end);

    const hasOverlap = primaryRoom.unavailableDates && primaryRoom.unavailableDates.some(unDate => {
      const uDate = new Date(unDate);
      return requestedDates.some(reqDate => uDate.toDateString() === reqDate.toDateString());
    });

    if (hasOverlap) {
      return { isAvailable: false, message: 'Primary room is already booked for the selected dates!' };
    }
  }

  // If roomsCount is 1, check if primary room can accommodate the guests
  if (roomsCount === 1) {
    if (canAccommodateCombination([primaryRoom], adults !== undefined ? Number(adults) : 1, children !== undefined ? Number(children) : 0)) {
      return { isAvailable: true, rooms: [primaryRoom._id] };
    } else {
      return { isAvailable: false, message: 'Room capacity exceeded for the selected guest combination.' };
    }
  }

  // If roomsCount > 1, we need to find roomsCount - 1 other available rooms
  // that, together with the primary room, can satisfy the guest count (adults and children).
  // Fetch all other published rooms
  const allRooms = await Room.find({ status: 'published', _id: { $ne: roomId } });

  // Filter other rooms to only those that are available on the selected dates
  const availableOtherRooms = [];
  if (checkIn && checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const requestedDates = getDatesInRange(start, end);

    for (const r of allRooms) {
      const hasOverlap = r.unavailableDates && r.unavailableDates.some(unDate => {
        const uDate = new Date(unDate);
        return requestedDates.some(reqDate => uDate.toDateString() === reqDate.toDateString());
      });
      if (!hasOverlap) {
        availableOtherRooms.push(r);
      }
    }
  } else {
    availableOtherRooms.push(...allRooms);
  }

  // We need to find if there is a subset of size (roomsCount - 1) from availableOtherRooms
  // that, together with primaryRoom, can accommodate adults and children.
  const requiredOtherCount = roomsCount - 1;
  let foundCombination = null;

  function findCombination(startIndex, currentSubset) {
    if (foundCombination) return;
    if (currentSubset.length === requiredOtherCount) {
      const combination = [primaryRoom, ...currentSubset];
      if (canAccommodateCombination(combination, Number(adults), Number(children))) {
        foundCombination = combination.map(r => r._id);
      }
      return;
    }

    for (let i = startIndex; i < availableOtherRooms.length; i++) {
      currentSubset.push(availableOtherRooms[i]);
      findCombination(i + 1, currentSubset);
      currentSubset.pop();
    }
  }

  findCombination(0, []);

  if (!foundCombination) {
    return { isAvailable: false, message: 'No valid combination of available rooms can accommodate your request.' };
  }

  return { isAvailable: true, rooms: foundCombination };
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
      const matchingReview = reviews.find(r => r.booking?.toString() === b._id.toString());
      bObj.isReviewed = !!matchingReview;
      bObj.review = matchingReview || null;
      return bObj;
    });

    res.json(bookingsWithReviewStatus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', roomId, checkIn, checkOut, adults, children, roomsCount } = req.body;

    // Check room availability first
    if (roomId && checkIn && checkOut) {
      const availability = await checkRoomAvailability(roomId, checkIn, checkOut, adults, children, roomsCount || 1);
      if (!availability.isAvailable) {
        return res.status(400).json({ message: availability.message });
      }
    }

    const options = {
      amount: amount * 100, // amount in the smallest currency unit (paise)
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const razorpay = getRazorpayInstance();
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

    if (!bookingData) {
      return res.status(400).json({ message: 'Booking data is required for verification!' });
    }

    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      return res.status(400).json({ message: 'Transaction not legitimate!' });
    }

    // Double check availability before creating booking
    const availability = await checkRoomAvailability(
      bookingData.room, 
      bookingData.checkIn, 
      bookingData.checkOut, 
      bookingData.adults, 
      bookingData.children,
      bookingData.roomsCount || 1
    );
    if (!availability.isAvailable) {
      return res.status(400).json({ message: availability.message });
    }

    // Payment is verified, create the booking
    const booking = await Booking.create({
      ...bookingData,
      user: req.user._id,
      rooms: availability.rooms || [bookingData.room],
      roomsCount: availability.rooms ? availability.rooms.length : 1,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'paid',
      status: 'confirmed'
    });

    // Block the booked dates in the Room database for all rooms in combination
    const bookedDates = getDatesInRange(bookingData.checkIn, bookingData.checkOut);
    const roomsToBlock = availability.rooms || [bookingData.room];
    await Room.updateMany(
      { _id: { $in: roomsToBlock } },
      { $addToSet: { unavailableDates: { $each: bookedDates } } }
    );

    // Send confirmation emails in the background
    User.findById(req.user._id)
      .then(user => {
        return Room.findById(bookingData.room).then(primaryRoomDetails => {
          const emailHtmlUser = getGuestBookingEmailTemplate(user, booking, primaryRoomDetails);

          // Send to User
          sendEmail({
            email: user.email,
            subject: 'Booking Confirmation - The Balified Villa',
            html: emailHtmlUser,
          }).catch(err => console.error('Error sending guest email:', err));

          // Send to Admin
          const adminEmail = 'thebalifiedvilla@gmail.com';
          const emailHtmlAdmin = getAdminBookingEmailTemplate(user, booking, primaryRoomDetails);
          sendEmail({
            email: adminEmail,
            subject: `New Booking Received - ${user.name}`,
            html: emailHtmlAdmin,
          }).catch(err => console.error('Error sending admin email:', err));
        });
      })
      .catch(emailErr => {
        console.error('Failed to send confirmation emails in background:', emailErr);
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
    const { room, checkIn, checkOut, adults, children, roomsCount } = req.body;

    // Check availability
    const availability = await checkRoomAvailability(room, checkIn, checkOut, adults, children, roomsCount || 1);
    if (!availability.isAvailable) {
      return res.status(400).json({ message: availability.message });
    }

    const booking = await Booking.create({
      ...req.body,
      user: req.user._id,
      rooms: availability.rooms || [room],
      roomsCount: availability.rooms ? availability.rooms.length : 1
    });

    // Block dates for all rooms in combination
    const bookedDates = getDatesInRange(checkIn, checkOut);
    const roomsToBlock = availability.rooms || [room];
    await Room.updateMany(
      { _id: { $in: roomsToBlock } },
      { $addToSet: { unavailableDates: { $each: bookedDates } } }
    );

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    // If status changed to cancelled, release the blocked dates for all rooms in the booking
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      const bookedDates = getDatesInRange(booking.checkIn, booking.checkOut);
      const roomsToUnblock = booking.rooms && booking.rooms.length > 0 ? booking.rooms : [booking.room];
      await Room.updateMany(
        { _id: { $in: roomsToUnblock } },
        { $pull: { unavailableDates: { $in: bookedDates } } }
      );
    }
    // If status changed from cancelled back to confirmed/completed, re-block dates
    else if ((status === 'confirmed' || status === 'completed') && oldStatus === 'cancelled') {
      const bookedDates = getDatesInRange(booking.checkIn, booking.checkOut);
      const roomsToBlock = booking.rooms && booking.rooms.length > 0 ? booking.rooms : [booking.room];
      await Room.updateMany(
        { _id: { $in: roomsToBlock } },
        { $addToSet: { unavailableDates: { $each: bookedDates } } }
      );
    }

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
    // Total guests from bookings (sum of adults + children or guests field in non-cancelled bookings)
    const guestsAgg = await Booking.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: {
                if: { $gt: ["$adults", null] },
                then: { $add: ["$adults", { $ifNull: ["$children", 0] }] },
                else: { $ifNull: ["$guests", 1] }
              }
            }
          }
        }
      }
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

    const occupiedRoomIds = [...new Set(activeBookings.filter(b => b && b.room).map(b => b.room.toString()))];
    const occupiedRoomsCount = occupiedRoomIds.length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRoomsCount / totalRooms) * 100) : 0;

    const pendingBookings   = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

    // Check-ins / check-outs today
    const todayCheckIns = await Booking.countDocuments({
      checkIn: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' }
    });

    const todayCheckOuts = await Booking.countDocuments({
      checkOut: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' }
    });

    // Recent bookings for dashboard table (paginated client-side)
    const recentBookings = await Booking.find()
      .populate('user', 'name')
      .populate('room', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    const formattedRecent = recentBookings.map(b => ({
      id: b._id,
      guest: b.user?.name || 'Deleted User',
      room: b.room?.name || 'Deleted Room',
      checkIn: b.checkIn ? new Date(b.checkIn).toISOString().split('T')[0] : 'N/A',
      checkOut: b.checkOut ? new Date(b.checkOut).toISOString().split('T')[0] : 'N/A',
      amount: `₹${b.totalAmount?.toLocaleString('en-IN')}`,
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
      d.setDate(1); // Prevent day-of-month overflow (e.g., Feb 30th -> March 2nd)
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
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      todayCheckIns,
      todayCheckOuts,
      recentBookings: formattedRecent,
      monthlyStats: last6Months
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
