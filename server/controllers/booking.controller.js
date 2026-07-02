import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import sendEmail from '../utils/email.js';
import Setting from '../models/Setting.js';
import { 
  getGuestBookingEmailTemplate, 
  getAdminBookingEmailTemplate,
  getCancelBookingEmailTemplate,
  getRefundEmailTemplate
} from '../templates/bookingConfirmation.js';

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
  while (date < end) {
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
const checkRoomAvailability = async (roomId, checkIn, checkOut, adults, children, roomsCount = 1, infants = 0, selectedRoomIds = []) => {
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

    const hasBlockedOverlap = primaryRoom.blockedDates && primaryRoom.blockedDates.some(block => {
      const bStart = new Date(block.startDate);
      // Set hours to cover the whole day
      bStart.setHours(0, 0, 0, 0);
      const bEnd = new Date(block.endDate);
      bEnd.setHours(23, 59, 59, 999);
      return requestedDates.some(reqDate => reqDate >= bStart && reqDate <= bEnd);
    });

    if (hasOverlap || hasBlockedOverlap) {
      return { isAvailable: false, message: 'Primary room is already booked or blocked for the selected dates!' };
    }
  }

  // Verify custom selectedRoomIds combination if provided and matches roomsCount
  if (selectedRoomIds && Array.isArray(selectedRoomIds) && selectedRoomIds.length === roomsCount) {
    if (!selectedRoomIds.map(id => id.toString()).includes(roomId.toString())) {
      return { isAvailable: false, message: 'Primary room must be part of the booking combination.' };
    }

    const selectedRooms = await Room.find({ _id: { $in: selectedRoomIds } });
    if (selectedRooms.length !== roomsCount) {
      return { isAvailable: false, message: 'One or more selected rooms were not found.' };
    }

    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const requestedDates = getDatesInRange(start, end);

      for (const r of selectedRooms) {
        const hasOverlap = r.unavailableDates && r.unavailableDates.some(unDate => {
          const uDate = new Date(unDate);
          return requestedDates.some(reqDate => uDate.toDateString() === reqDate.toDateString());
        });
        const hasBlockedOverlap = r.blockedDates && r.blockedDates.some(block => {
          const bStart = new Date(block.startDate);
          bStart.setHours(0, 0, 0, 0);
          const bEnd = new Date(block.endDate);
          bEnd.setHours(23, 59, 59, 999);
          return requestedDates.some(reqDate => reqDate >= bStart && reqDate <= bEnd);
        });
        if (hasOverlap || hasBlockedOverlap) {
          return { isAvailable: false, message: `Room "${r.name}" is already booked or blocked for the selected dates.` };
        }
      }
    }

    if (canAccommodateCombination(selectedRooms, Number(adults), Number(children))) {
      return { isAvailable: true, rooms: selectedRoomIds };
    } else {
      return { isAvailable: false, message: 'Selected room combination cannot accommodate the guests.' };
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
      const hasBlockedOverlap = r.blockedDates && r.blockedDates.some(block => {
        const bStart = new Date(block.startDate);
        bStart.setHours(0, 0, 0, 0);
        const bEnd = new Date(block.endDate);
        bEnd.setHours(23, 59, 59, 999);
        return requestedDates.some(reqDate => reqDate >= bStart && reqDate <= bEnd);
      });
      if (!hasOverlap && !hasBlockedOverlap) {
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
      .populate('rooms', 'name category price')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('room')
      .populate('rooms')
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
    const { amount, currency = 'INR', roomId, checkIn, checkOut, adults, children, roomsCount, infants, selectedRoomIds } = req.body;

    // Check room availability first
    if (roomId && checkIn && checkOut) {
      const availability = await checkRoomAvailability(roomId, checkIn, checkOut, adults, children, roomsCount || 1, infants || 0, selectedRoomIds || []);
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
      bookingData.roomsCount || 1,
      bookingData.infants || 0,
      bookingData.selectedRoomIds || []
    );
    if (!availability.isAvailable) {
      return res.status(400).json({ message: availability.message });
    }

    // Payment is verified, create the booking
    const isAdvance = bookingData.paymentType === 'advance';
    const totalAmount = bookingData.totalAmount;
    const paidAmount = bookingData.paidAmount || totalAmount;
    const dueAmount = totalAmount - paidAmount;
    const paymentStatus = isAdvance ? 'partially_paid' : 'paid';

    const booking = await Booking.create({
      ...bookingData,
      user: req.user._id,
      rooms: availability.rooms || [bookingData.room],
      roomsCount: availability.rooms ? availability.rooms.length : 1,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentType: bookingData.paymentType || 'full',
      advanceAmount: isAdvance ? paidAmount : 0,
      paidAmount,
      dueAmount,
      paymentStatus,
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
    const { room, checkIn, checkOut, adults, children, roomsCount, infants, selectedRoomIds } = req.body;

    // Check availability
    const availability = await checkRoomAvailability(room, checkIn, checkOut, adults, children, roomsCount || 1, infants || 0, selectedRoomIds || []);
    if (!availability.isAvailable) {
      return res.status(400).json({ message: availability.message });
    }

    const totalAmount = req.body.totalAmount || 0;
    const paidAmount = req.body.paidAmount !== undefined ? req.body.paidAmount : totalAmount;
    const dueAmount = totalAmount - paidAmount;
    const paymentStatus = req.body.paymentStatus || (dueAmount === 0 ? 'paid' : (paidAmount > 0 ? 'partially_paid' : 'unpaid'));
    const paymentType = req.body.paymentType || (paidAmount < totalAmount && paidAmount > 0 ? 'advance' : 'full');
    const advanceAmount = paymentType === 'advance' ? paidAmount : 0;

    const booking = await Booking.create({
      ...req.body,
      user: req.user._id,
      rooms: availability.rooms || [room],
      roomsCount: availability.rooms ? availability.rooms.length : 1,
      paymentType,
      advanceAmount,
      paidAmount,
      dueAmount,
      paymentStatus
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

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    // Ensure user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to cancel this booking.' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Completed stays cannot be cancelled.' });
    }

    // Dynamic cancellation duration validation
    const setting = await Setting.findOne() || { cancelDurationHrs: 24, checkInTime: '14:00' };
    const cancelDurationHrs = setting.cancelDurationHrs ?? 24;

    const checkInDate = new Date(booking.checkIn);
    const [hours, minutes] = (setting.checkInTime || '14:00').split(':');
    checkInDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const cancelDeadline = new Date(checkInDate.getTime() - cancelDurationHrs * 60 * 60 * 1000);

    if (new Date() >= cancelDeadline) {
      return res.status(400).json({ 
        message: `Cancellation window has expired. Bookings can only be cancelled up to ${cancelDurationHrs} hours before the check-in time.` 
      });
    }

    // Cancel booking status
    booking.status = 'cancelled';
    await booking.save();

    // Release dates
    const bookedDates = getDatesInRange(booking.checkIn, booking.checkOut);
    const roomsToUnblock = booking.rooms && booking.rooms.length > 0 ? booking.rooms : [booking.room];
    await Room.updateMany(
      { _id: { $in: roomsToUnblock } },
      { $pull: { unavailableDates: { $in: bookedDates } } }
    );

    // Send cancellation email in background
    User.findById(req.user._id)
      .then(user => {
        if (user) {
          const emailHtml = getCancelBookingEmailTemplate(user, booking, booking.room);
          sendEmail({
            email: user.email,
            subject: 'Booking Cancellation - The Balified Villa',
            html: emailHtml
          }).catch(err => console.error('Error sending cancel email:', err));
        }
      })
      .catch(err => console.error('Error fetching user for cancellation email:', err));

    res.json({ message: 'Booking cancelled successfully.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const processRefund = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    if (booking.status !== 'cancelled') {
      return res.status(400).json({ message: 'Only cancelled bookings can be refunded.' });
    }
    if (booking.paymentStatus === 'refunded') {
      return res.status(400).json({ message: 'Refund has already been processed.' });
    }

    booking.paymentStatus = 'refunded';
    await booking.save();

    // Send refund processed email
    User.findById(booking.user)
      .then(user => {
        if (user) {
          const emailHtml = getRefundEmailTemplate(user, booking, booking.room);
          sendEmail({
            email: user.email,
            subject: 'Refund Processed - The Balified Villa',
            html: emailHtml
          }).catch(err => console.error('Error sending refund email:', err));
        }
      })
      .catch(err => console.error('Error fetching user for refund email:', err));

    res.json({ message: 'Refund processed and confirmation mail sent successfully.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePaymentNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.paymentNotes = notes || '';
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markPaymentComplete = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.paymentStatus = 'paid';
    booking.paidAmount = booking.totalAmount;
    booking.dueAmount = 0;
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createBalanceRazorpayOrder = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const totalAmount = Number(booking.totalAmount) || 0;
    const paidAmount = booking.paidAmount !== undefined ? Number(booking.paidAmount) : (booking.paymentStatus === 'paid' ? totalAmount : 0);
    const dueAmount = booking.dueAmount !== undefined ? Number(booking.dueAmount) : (totalAmount - paidAmount);

    if (dueAmount <= 0) return res.status(400).json({ message: 'No pending balance for this booking' });

    const options = {
      amount: Math.round(dueAmount * 100), // paise
      currency: 'INR',
      receipt: `bal_${String(booking._id).slice(-8)}_${String(Date.now()).slice(-8)}`,
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyBalanceRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      return res.status(400).json({ message: 'Transaction not legitimate!' });
    }

    // Update booking payment info
    booking.razorpayOrderId = razorpay_order_id;
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.paymentStatus = 'paid';
    booking.paidAmount = booking.totalAmount;
    booking.dueAmount = 0;
    await booking.save();

    res.json({ message: 'Balance payment verified successfully', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

