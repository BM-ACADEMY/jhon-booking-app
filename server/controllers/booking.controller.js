import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
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
    const maxOccupancy = room.maxOccupancy !== undefined && room.maxOccupancy !== null ? room.maxOccupancy : (room.guests || 2);

    const upperA = Math.min(maxOccupancy, remainingAdults);
    for (let a = 1; a <= upperA; a++) {
      const upperC = Math.min(maxOccupancy - a, remainingChildren);
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


// Helper to dynamically sync unavailableDates array on Room model with active bookings in DB
export const syncRoomUnavailableDates = async () => {
  try {
    const activeBookings = await Booking.find({ status: { $in: ['confirmed', 'completed'] } });
    const roomDateCounts = {};

    for (const b of activeBookings) {
      if (!b.checkIn || !b.checkOut) continue;
      const dates = getDatesInRange(b.checkIn, b.checkOut);
      const rooms = b.rooms && b.rooms.length > 0 ? b.rooms : [b.room];

      for (const roomId of rooms) {
        if (!roomId) continue;
        const rStr = roomId.toString();
        if (!roomDateCounts[rStr]) roomDateCounts[rStr] = {};
        dates.forEach(d => {
          const dStr = d.toISOString().split('T')[0];
          roomDateCounts[rStr][dStr] = (roomDateCounts[rStr][dStr] || 0) + 1;
        });
      }
    }

    const rooms = await Room.find({});
    for (const r of rooms) {
      const maxInv = r.maxInventory || 1;
      const counts = roomDateCounts[r._id.toString()] || {};
      const validDates = [];
      Object.keys(counts).forEach(dStr => {
        if (counts[dStr] >= maxInv) {
          validDates.push(new Date(dStr));
        }
      });
      await Room.findByIdAndUpdate(r._id, { unavailableDates: validDates });
    }
  } catch (err) {
    console.error('Error syncing room unavailable dates:', err);
  }
};

// Helper to validate occupancy rules for a single room
const validateOccupancy = (room, adults, children, infants) => {
  const maxOccupancy = room.maxOccupancy !== undefined && room.maxOccupancy !== null ? room.maxOccupancy : (room.guests || 2);
  const occupiedGuests = Number(adults) + Number(children);

  if (occupiedGuests > maxOccupancy) {
    return { isAllowed: false, message: `Maximum ${maxOccupancy} guests (Adults + Children) allowed for this room.` };
  }
  return { isAllowed: true };
};

// Helper to verify if room is available
const checkRoomAvailability = async (roomId, checkIn, checkOut, adults, children, roomsCount = 1, infants = 0, selectedRoomIds = []) => {
  await syncRoomUnavailableDates();
  if (!roomId) return { isAvailable: true, remainingRooms: 1 };
  const primaryRoom = await Room.findById(roomId);
  if (!primaryRoom) return { isAvailable: false, message: 'Room not found.', remainingRooms: 0 };

  let remainingRooms = primaryRoom.maxInventory || 1;

  // Check if primary room itself is date-available
  if (checkIn && checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    // Count overlapping confirmed/completed bookings for this room type
    const overlappingBookings = await Booking.countDocuments({
      status: { $in: ['confirmed', 'completed'] },
      $or: [
        { room: roomId },
        { rooms: roomId }
      ],
      checkIn: { $lt: end },
      checkOut: { $gt: start }
    });

    remainingRooms = Math.max(0, (primaryRoom.maxInventory || 1) - overlappingBookings);

    if (remainingRooms < roomsCount) {
      const cInStr = start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const cOutStr = end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      return { 
        isAvailable: false, 
        message: remainingRooms === 0 
          ? `Sold Out: This room is already booked for ${cInStr} - ${cOutStr}. Please select available dates.` 
          : `Only ${remainingRooms} room(s) left for ${cInStr} - ${cOutStr}.`,
        remainingRooms 
      };
    }

    // Check blocked dates overlap
    const requestedDates = getDatesInRange(start, end);
    const hasBlockedOverlap = primaryRoom.blockedDates && primaryRoom.blockedDates.some(block => {
      const bStart = new Date(block.startDate);
      bStart.setHours(0, 0, 0, 0);
      const bEnd = new Date(block.endDate);
      bEnd.setHours(23, 59, 59, 999);
      return requestedDates.some(reqDate => reqDate >= bStart && reqDate <= bEnd);
    });

    if (hasBlockedOverlap) {
      return { isAvailable: false, message: 'Room is blocked for maintenance.', remainingRooms: 0 };
    }
  }

  // If roomsCount is 1, check if primary room can accommodate the guests
  if (roomsCount === 1) {
    const validation = validateOccupancy(primaryRoom, Number(adults), Number(children), Number(infants));
    if (!validation.isAllowed) {
      return { isAvailable: false, message: validation.message, remainingRooms };
    }
    return { isAvailable: true, rooms: [primaryRoom._id], remainingRooms };
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

  const maxInf = (primaryRoom.maxInfants !== undefined && primaryRoom.maxInfants !== null) ? primaryRoom.maxInfants : 2;
  if (Number(infants) > roomsCount * maxInf) {
    return { isAvailable: false, message: `Maximum ${roomsCount * maxInf} infants allowed for ${roomsCount} rooms.`, remainingRooms };
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
      .populate('user', 'name email phone role')
      .populate('adminUser', 'name email phone')
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
    const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : '';
    const userPhone = req.user.phone ? req.user.phone.trim() : '';

    const filterConditions = [{ user: req.user._id }];
    if (userEmail) filterConditions.push({ guestEmail: userEmail });
    if (userPhone) filterConditions.push({ guestPhone: userPhone });

    const bookings = await Booking.find({ $or: filterConditions })
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

export const checkGuestAccount = async (req, res) => {
  try {
    if (req.user) {
      return res.json({ status: 'loggedIn' });
    }

    const email = req.body.email?.toLowerCase()?.trim();
    const phone = (req.body.phone || '').trim();

    if (!email || phone.length < 6) {
      return res.status(400).json({ message: 'A valid email and phone number are required' });
    }

    const userByEmail = await User.findOne({ email });
    const userByPhone = await User.findOne({ phone });

    if (userByEmail && userByPhone && userByEmail._id.toString() === userByPhone._id.toString()) {
      return res.json({ status: 'existing' });
    }

    if (userByEmail || userByPhone) {
      return res.status(400).json({
        message: userByEmail
          ? 'Email already used with a different phone number.'
          : 'Phone number already used with a different email.'
      });
    }

    return res.json({ status: 'new' });
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

    // Resolve booking user
    let bookingUser = null;
    let createdCredentials = null;

    if (req.user) {
      bookingUser = req.user;
      const guestDetails = bookingData.guestDetails || {};
      const guestPhone = (guestDetails.phone || '').trim();
      if (guestPhone && !bookingUser.phone) {
        bookingUser.phone = guestPhone;
        await bookingUser.save();
      }
    } else {
      const guestDetails = bookingData.guestDetails || {};
      const email = guestDetails.email?.toLowerCase()?.trim();
      const phone = (guestDetails.phone || '').trim();
      if (!email) {
        return res.status(400).json({ message: 'Email address is required for guest booking' });
      }
      if (phone.length < 6) {
        return res.status(400).json({ message: 'Phone number must be at least 6 digits (it will also act as your account password)' });
      }

      const userByEmail = await User.findOne({ email });
      const userByPhone = await User.findOne({ phone });

      if (userByEmail && userByPhone && userByEmail._id.toString() === userByPhone._id.toString()) {
        // Same existing user, reuse the account without re-sending credentials
        bookingUser = userByEmail;
      } else if (userByEmail || userByPhone) {
        // Email/phone belong to different accounts - reject to avoid duplicate/mismatched accounts
        return res.status(400).json({
          message: userByEmail
            ? 'Email already used with a different phone number.'
            : 'Phone number already used with a different email.'
        });
      } else {
        // Brand new guest - create account
        const firstName = guestDetails.firstName || 'Guest';
        const lastName = guestDetails.lastName || '';
        bookingUser = await User.create({
          name: `${firstName} ${lastName}`.trim(),
          email,
          phone,
          password: phone,
        });
        createdCredentials = {
          email,
          password: phone
        };
      }
    }

    // Payment is verified, create the booking
    const isAdvance = bookingData.paymentType === 'advance';
    const totalAmount = bookingData.totalAmount;
    const paidAmount = bookingData.paidAmount || totalAmount;
    const dueAmount = totalAmount - paidAmount;
    const paymentStatus = isAdvance ? 'partially_paid' : 'paid';

    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      session = null;
    }

    const options = session ? { session } : {};
    const [booking] = await Booking.create([{
      ...bookingData,
      user: bookingUser._id,
      gstNumber: bookingData.guestDetails?.gstNumber || '',
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
    }], options);

    if (session) {
      await session.commitTransaction();
      await session.endSession();
    }

    // Dynamic availability sync
    await syncRoomUnavailableDates();

    // Send confirmation emails in the background
    Room.findById(bookingData.room)
      .then(primaryRoomDetails => {
        if (!primaryRoomDetails) return;
        const emailHtmlUser = getGuestBookingEmailTemplate(bookingUser, booking, primaryRoomDetails, createdCredentials);

        // Send to User
        sendEmail({
          email: bookingUser.email,
          subject: 'Booking Confirmation - The Balified Villa',
          html: emailHtmlUser,
        }).catch(err => console.error('Error sending guest email:', err));

        // Send to Admin
        const adminEmail = 'thebalifiedvilla@gmail.com';
        const emailHtmlAdmin = getAdminBookingEmailTemplate(bookingUser, booking, primaryRoomDetails);
        sendEmail({
          email: adminEmail,
          subject: `New Booking Received - ${bookingUser.name}`,
          html: emailHtmlAdmin,
        }).catch(err => console.error('Error sending admin email:', err));
      })
      .catch(emailErr => {
        console.error('Failed to send confirmation emails in background:', emailErr);
      });

    const token = jwt.sign({ id: bookingUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });

    res.status(201).json({
      message: 'Payment verified and booking created successfully',
      booking,
      token,
      user: {
        id: bookingUser._id,
        name: bookingUser.name,
        email: bookingUser.email,
        phone: bookingUser.phone,
        role: bookingUser.role,
        wishlist: bookingUser.wishlist || []
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createBooking = async (req, res) => {
  let session = null;
  try {
    const { room, checkIn, checkOut, adults, children, roomsCount, infants, selectedRoomIds } = req.body;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      session = null;
    }

    // Check availability
    const availability = await checkRoomAvailability(room, checkIn, checkOut, adults, children, roomsCount || 1, infants || 0, selectedRoomIds || []);
    if (!availability.isAvailable) {
      if (session) {
        await session.abortTransaction();
        await session.endSession();
      }
      return res.status(400).json({ message: availability.message });
    }

    const totalAmount = req.body.totalAmount || 0;
    const paidAmount = req.body.paidAmount !== undefined ? req.body.paidAmount : totalAmount;
    const dueAmount = totalAmount - paidAmount;
    const paymentStatus = req.body.paymentStatus || (dueAmount === 0 ? 'paid' : (paidAmount > 0 ? 'partially_paid' : 'unpaid'));
    const paymentType = req.body.paymentType || (paidAmount < totalAmount && paidAmount > 0 ? 'advance' : 'full');
    const advanceAmount = paymentType === 'advance' ? paidAmount : 0;

    const options = session ? { session } : {};
    const [booking] = await Booking.create([{
      ...req.body,
      user: req.user._id,
      rooms: availability.rooms || [room],
      roomsCount: availability.rooms ? availability.rooms.length : 1,
      paymentType,
      advanceAmount,
      paidAmount,
      dueAmount,
      paymentStatus
    }], options);

    if (session) {
      await session.commitTransaction();
      await session.endSession();
    }

    await syncRoomUnavailableDates();

    res.status(201).json(booking);
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      await session.endSession();
    }
    res.status(500).json({ message: err.message });
  }
};

export const createAdminBooking = async (req, res) => {
  let session = null;
  try {
    const { 
      customerDetails = {}, 
      room, 
      checkIn, 
      checkOut, 
      adults = 1, 
      children = 0, 
      infants = 0, 
      roomsCount = 1, 
      selectedRoomIds = [],
      totalAmount = 0,
      paidAmount = 0,
      paymentType = 'full',
      paymentStatus = 'unpaid',
      paymentNotes = '',
      addons = [],
      specialRequests = '',
      gstNumber = ''
    } = req.body;

    const { name, phone, email } = customerDetails;
    if (!name || !phone) {
      return res.status(400).json({ message: 'Customer name and phone number are required.' });
    }

    // Check room availability
    const availability = await checkRoomAvailability(room, checkIn, checkOut, adults, children, roomsCount, infants, selectedRoomIds);
    if (!availability.isAvailable) {
      return res.status(400).json({ message: availability.message });
    }

    // Resolve Customer & Admin Email
    const cleanPhone = phone.trim();
    const cleanEmail = email && email.trim() ? email.toLowerCase().trim() : (req.user?.email || 'thebalifiedvilla@gmail.com');

    const calculatedDue = Math.max(0, totalAmount - paidAmount);
    const calculatedAdvance = paymentType === 'advance' ? paidAmount : 0;
    const finalPaymentStatus = paymentStatus || (calculatedDue === 0 ? 'paid' : (paidAmount > 0 ? 'partially_paid' : 'unpaid'));
    const originUrl = req.headers.origin;

    // IF UNPAID / PAYMENT LINK REQUEST: DO NOT CREATE BOOKING IN DB YET!
    if (finalPaymentStatus !== 'paid') {
      let razorpayLink = '';
      const amountToCharge = paymentType === 'advance' ? calculatedAdvance : totalAmount;

      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
          const razorpay = getRazorpayInstance();
          const plink = await razorpay.paymentLink.create({
            amount: Math.round(amountToCharge * 100),
            currency: 'INR',
            accept_partial: false,
            description: `Room Booking Payment - ${name}`,
            customer: {
              name,
              contact: cleanPhone,
              email: cleanEmail
            },
            notify: { sms: true, email: true },
            reminder_enable: true,
            notes: {
              adminUserId: req.user._id.toString(),
              roomId: room.toString(),
              checkIn: String(checkIn),
              checkOut: String(checkOut),
              adults: String(adults),
              children: String(children),
              infants: String(infants),
              roomsCount: String(roomsCount),
              guestName: name.trim(),
              guestPhone: cleanPhone,
              guestEmail: cleanEmail,
              totalAmount: String(totalAmount),
              paidAmount: String(amountToCharge),
              paymentType: String(paymentType),
              paymentNotes: paymentNotes.trim(),
              specialRequests: specialRequests.trim(),
              gstNumber: gstNumber.trim(),
              addons: JSON.stringify(addons)
            },
            callback_url: `${originUrl}/payment-success`,
            callback_method: 'get'
          });
          if (plink && plink.short_url) {
            razorpayLink = plink.short_url;
          }
        } catch (rzpErr) {
          console.error('Razorpay Link Creation Error:', rzpErr?.message || rzpErr);
          return res.status(500).json({ message: 'Razorpay Payment Link creation error: ' + (rzpErr?.message || 'Check API keys') });
        }
      }

      return res.status(201).json({
        message: 'Razorpay Payment Link generated successfully',
        paymentUrl: razorpayLink || `${originUrl}/payment-success`,
        isLinkOnly: true
      });
    }

    // DIRECT CASH / FULL PAID IMMEDIATELY: Create Confirmed Booking in DB
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      session = null;
    }

    const options = session ? { session } : {};
    const [booking] = await Booking.create([{
      user: req.user._id, // Created under logged-in Admin's Account/Name
      adminUser: req.user._id,
      createdByAdmin: true,
      guestName: name.trim(),
      guestPhone: cleanPhone,
      guestEmail: cleanEmail,
      room,
      rooms: availability.rooms || [room],
      roomsCount: availability.rooms ? availability.rooms.length : 1,
      checkIn,
      checkOut,
      guests: Number(adults) + Number(children) + Number(infants),
      adults: Number(adults),
      children: Number(children),
      infants: Number(infants),
      totalAmount,
      paidAmount,
      dueAmount: calculatedDue,
      advanceAmount: calculatedAdvance,
      paymentType,
      paymentStatus: 'paid',
      paymentNotes,
      addons,
      specialRequests,
      gstNumber,
      status: 'confirmed'
    }], options);

    if (session) {
      await session.commitTransaction();
      await session.endSession();
    }

    await syncRoomUnavailableDates();

    // Send confirmation emails in background
    Room.findById(room).then(primaryRoomDetails => {
      if (!primaryRoomDetails) return;
      const guestObj = {
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone
      };
      const emailHtmlUser = getGuestBookingEmailTemplate(guestObj, booking, primaryRoomDetails, null);
      sendEmail({
        email: cleanEmail,
        subject: 'Room Booking Confirmation - The Balified Villa',
        html: emailHtmlUser
      }).catch(err => console.error('Error sending guest email:', err));

      const adminEmail = req.user?.email || 'thebalifiedvilla@gmail.com';
      const emailHtmlAdmin = getAdminBookingEmailTemplate(guestObj, booking, primaryRoomDetails);
      sendEmail({
        email: adminEmail,
        subject: `New Admin-Created Booking - ${name}`,
        html: emailHtmlAdmin
      }).catch(err => console.error('Error sending admin email:', err));
    }).catch(e => console.error('Error fetching room for email:', e));

    res.status(201).json({
      message: 'Booking created successfully',
      booking,
      paymentUrl: '',
      customerUser: {
        id: req.user._id,
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail
      }
    });
  } catch (err) {
    if (session) {
      try {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        await session.endSession();
      } catch (sessErr) {
        console.error('Session cleanup error:', sessErr);
      }
    }
    console.error('Error in createAdminBooking:', err);
    res.status(500).json({ message: err.message });
  }
};

export const createPaymentLink = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user').populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const due = booking.dueAmount > 0 ? booking.dueAmount : booking.totalAmount;
    const originUrl = req.headers.origin || 'http://localhost:5173';
    const fallbackUrl = `${originUrl}/booking-details/${booking._id}`;
    let shortUrl = '';

    if (due > 0 && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const razorpay = getRazorpayInstance();
        const plink = await razorpay.paymentLink.create({
          amount: Math.round(due * 100),
          currency: 'INR',
          accept_partial: false,
          description: `Room Booking Payment - ${booking.room?.name || 'Villa Stay'}`,
          customer: {
            name: booking.user?.name || 'Guest',
            contact: booking.user?.phone || '',
            email: booking.user?.email || ''
          },
          notify: { sms: true, email: true },
          reminder_enable: true,
          notes: { bookingId: booking._id.toString() }
        });
        if (plink && plink.short_url) {
          shortUrl = plink.short_url;
        }
      } catch (rzpErr) {
        console.error('Razorpay Payment Link creation error:', rzpErr?.message || rzpErr);
      }
    }

    const finalPaymentUrl = shortUrl || fallbackUrl;
    res.json({
      bookingId: booking._id,
      paymentUrl: finalPaymentUrl,
      shortUrl: shortUrl || null,
      dueAmount: due
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;
    if (status === 'confirmed') {
      booking.paymentStatus = 'paid';
      booking.paidAmount = booking.totalAmount;
      booking.dueAmount = 0;
    }
    await booking.save();

    // Sync dynamic dates on cancellation or reactivation
    await syncRoomUnavailableDates();

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

    // Release dates dynamically
    await syncRoomUnavailableDates();

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

export const getBookingByIdPublic = async (req, res) => {
  try {
    const { id } = req.params;
    let booking = null;

    if (mongoose.isValidObjectId(id)) {
      booking = await Booking.findById(id)
        .populate('user', 'name email phone')
        .populate('room')
        .populate('rooms');
    }

    if (!booking) {
      booking = await Booking.findOne({
        $or: [
          { razorpayOrderId: id },
          { razorpayPaymentId: id }
        ]
      })
        .populate('user', 'name email phone')
        .populate('room')
        .populate('rooms');
    }

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Auto-verify Payment Link success if redirected from Razorpay payment link or query status or API check
    const { razorpay_payment_link_status, razorpay_payment_id, payment_link_success } = req.query;
    if (booking && (booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'partially_paid')) {
      let shouldMarkPaid = razorpay_payment_link_status === 'paid' || razorpay_payment_id || payment_link_success === 'true';

      // If query parameters are not present, check Razorpay API directly
      if (!shouldMarkPaid && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
          const razorpay = getRazorpayInstance();
          const payments = await razorpay.payments.all({ count: 20 });
          if (payments && payments.items && Array.isArray(payments.items)) {
            const bookingIdStr = booking._id.toString();
            const shortIdStr = bookingIdStr.slice(-6).toLowerCase();

            const foundPayment = payments.items.find(p => {
              if (p.status !== 'captured' && p.status !== 'authorized') return false;
              const notes = p.notes || {};
              const desc = (p.description || '').toLowerCase();
              return notes.bookingId === bookingIdStr || desc.includes(shortIdStr);
            });
            if (foundPayment) {
              shouldMarkPaid = true;
              if (foundPayment.id) booking.razorpayPaymentId = foundPayment.id;
            }
          }
        } catch (rzpErr) {
          console.error('Razorpay payment link auto-sync check error:', rzpErr?.message || rzpErr);
        }
      }

      if (shouldMarkPaid) {
        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
        booking.paidAmount = booking.totalAmount;
        booking.dueAmount = 0;
        if (razorpay_payment_id && !booking.razorpayPaymentId) {
          booking.razorpayPaymentId = razorpay_payment_id;
        }
        await booking.save();
        await syncRoomUnavailableDates();
      }
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const event = req.body;
    if (event && (event.event === 'payment.link.paid' || event.event === 'payment.captured')) {
      const entity = event.payload?.payment_link?.entity || event.payload?.payment?.entity;
      const bookingId = entity?.notes?.bookingId;
      if (bookingId && mongoose.isValidObjectId(bookingId)) {
        const booking = await Booking.findById(bookingId);
        if (booking) {
          booking.paymentStatus = 'paid';
          booking.status = 'confirmed';
          booking.paidAmount = booking.totalAmount;
          booking.dueAmount = 0;
          if (entity.id) booking.razorpayPaymentId = entity.id;
          await booking.save();
          await syncRoomUnavailableDates();
        }
      }
    }
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ message: err.message });
  }
};

const createBookingFromNotes = async (notes, paymentId, loggedInUser = null) => {
  if (!notes || !notes.roomId || !notes.checkIn || !notes.checkOut) return null;

  const room = await Room.findById(notes.roomId);
  if (!room) return null;

  const cIn = new Date(notes.checkIn);
  const cOut = new Date(notes.checkOut);
  const totalAmount = Number(notes.totalAmount || room.price);
  const paidAmount = Number(notes.paidAmount || totalAmount);
  const addons = notes.addons ? JSON.parse(notes.addons) : [];

  let customerUser = loggedInUser || null;
  const guestEmail = (notes.guestEmail || '').toLowerCase().trim();
  const guestPhone = (notes.guestPhone || '').trim();

  if (!customerUser && guestEmail) {
    customerUser = await User.findOne({ email: guestEmail });
  }
  if (!customerUser && guestPhone) {
    customerUser = await User.findOne({ phone: guestPhone });
  }

  // If customer user still not found, auto-create user account for customer
  if (!customerUser && guestEmail && guestPhone) {
    try {
      const bcrypt = (await import('bcryptjs')).default;
      const hashedPassword = await bcrypt.hash(guestPhone, 10);
      customerUser = await User.create({
        name: notes.guestName || 'Guest',
        email: guestEmail,
        phone: guestPhone,
        password: hashedPassword,
        role: 'user'
      });
    } catch (e) {
      console.error('Customer account creation error:', e);
    }
  }

  const finalUserId = customerUser ? customerUser._id : (notes.adminUserId || null);

  const [newBooking] = await Booking.create([{
    user: finalUserId,
    adminUser: notes.adminUserId || null,
    createdByAdmin: true,
    guestName: notes.guestName || (customerUser ? customerUser.name : 'Guest'),
    guestPhone: guestPhone || (customerUser ? customerUser.phone : ''),
    guestEmail: guestEmail || (customerUser ? customerUser.email : ''),
    room: room._id,
    rooms: [room._id],
    roomsCount: Number(notes.roomsCount || 1),
    checkIn: cIn,
    checkOut: cOut,
    guests: Number(notes.adults || 1) + Number(notes.children || 0) + Number(notes.infants || 0),
    adults: Number(notes.adults || 1),
    children: Number(notes.children || 0),
    infants: Number(notes.infants || 0),
    totalAmount,
    paidAmount,
    dueAmount: 0,
    advanceAmount: notes.paymentType === 'advance' ? paidAmount : 0,
    paymentType: notes.paymentType || 'full',
    paymentStatus: 'paid',
    paymentNotes: notes.paymentNotes || 'Paid via Razorpay Link',
    specialRequests: notes.specialRequests || '',
    gstNumber: notes.gstNumber || '',
    addons,
    status: 'confirmed',
    razorpayPaymentId: paymentId || ''
  }]);

  await syncRoomUnavailableDates();

  // Send confirmation emails in background
  try {
    const guestObj = {
      name: notes.guestName || (customerUser ? customerUser.name : 'Guest'),
      email: guestEmail || (customerUser ? customerUser.email : 'thebalifiedvilla@gmail.com'),
      phone: guestPhone || (customerUser ? customerUser.phone : '')
    };
    const emailHtmlUser = getGuestBookingEmailTemplate(guestObj, newBooking, room, null);
    sendEmail({
      email: guestObj.email,
      subject: 'Room Booking Confirmation - The Balified Villa',
      html: emailHtmlUser
    }).catch(err => console.error('Error sending guest email:', err));

    const adminEmail = 'thebalifiedvilla@gmail.com';
    const emailHtmlAdmin = getAdminBookingEmailTemplate(guestObj, newBooking, room);
    sendEmail({
      email: adminEmail,
      subject: `New Online Paid Booking - ${notes.guestName}`,
      html: emailHtmlAdmin
    }).catch(err => console.error('Error sending admin email:', err));
  } catch (emailErr) {
    console.error('Email sending error:', emailErr);
  }

  return newBooking;
};

export const confirmPaymentLinkBooking = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_payment_link_id } = req.body;
    if (!razorpay_payment_id && !razorpay_payment_link_id) {
      return res.status(400).json({ message: 'Payment details required' });
    }

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const razorpay = getRazorpayInstance();
      let entity = null;
      if (razorpay_payment_id) {
        try {
          entity = await razorpay.payments.fetch(razorpay_payment_id);
        } catch (e) {
          entity = null;
        }
      }
      if (!entity && razorpay_payment_link_id) {
        try {
          entity = await razorpay.paymentLink.fetch(razorpay_payment_link_id);
        } catch (e) {
          entity = null;
        }
      }

      if (entity && entity.notes) {
        let existingBooking = await Booking.findOne({ razorpayPaymentId: entity.id || razorpay_payment_id });

        let customerUser = req.user || null;
        const guestEmail = (entity.notes.guestEmail || '').toLowerCase().trim();
        const guestPhone = (entity.notes.guestPhone || '').trim();

        if (!customerUser && guestEmail) {
          customerUser = await User.findOne({ email: guestEmail });
        }
        if (!customerUser && guestPhone) {
          customerUser = await User.findOne({ phone: guestPhone });
        }

        let token = null;
        if (customerUser) {
          token = jwt.sign({ id: customerUser._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
          });
        }

        if (existingBooking) {
          // If existing booking user is not set to customer or logged in user, associate it now
          if (customerUser && (!existingBooking.user || existingBooking.user.toString() !== customerUser._id.toString())) {
            existingBooking.user = customerUser._id;
            await existingBooking.save();
          }
          return res.json({ booking: existingBooking, token, user: customerUser });
        }

        const createdBooking = await createBookingFromNotes(entity.notes, entity.id || razorpay_payment_id, customerUser);
        if (createdBooking) {
          if (!customerUser && createdBooking.user) {
            customerUser = await User.findById(createdBooking.user);
            if (customerUser) {
              token = jwt.sign({ id: customerUser._id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN || '7d'
              });
            }
          }
          return res.json({ booking: createdBooking, token, user: customerUser });
        }
      }
    }

    res.status(400).json({ message: 'Unable to verify payment or create booking' });
  } catch (err) {
    console.error('confirmPaymentLinkBooking error:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getUnnotifiedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'confirmed', adminNotified: false })
      .populate('room')
      .populate('rooms');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markBookingAsNotified = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.adminNotified = true;
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRoomAvailabilityPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, adults = 1, children = 0, roomsCount = 1 } = req.query;

    const availability = await checkRoomAvailability(
      id,
      checkIn,
      checkOut,
      adults !== undefined ? Number(adults) : 1,
      children !== undefined ? Number(children) : 0,
      roomsCount !== undefined ? Number(roomsCount) : 1
    );

    res.json(availability);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

