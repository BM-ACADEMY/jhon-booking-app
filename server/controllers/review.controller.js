import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';

// Helper function to update Room rating and reviewCount
const updateRoomRating = async (roomId) => {
  try {
    const reviews = await Review.find({ room: roomId, verified: true });
    if (reviews.length === 0) {
      await Room.findByIdAndUpdate(roomId, { rating: 0, reviewCount: 0 });
      return;
    }
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((totalRating / reviews.length) * 10) / 10;
    await Room.findByIdAndUpdate(roomId, { rating: avgRating, reviewCount: reviews.length });
  } catch (err) {
    console.error('Error updating room rating:', err);
  }
};

// 1. Get verified reviews for a specific room
export const getReviewsByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const reviews = await Review.find({ room: roomId, verified: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. User creates a review for a booking
export const createReview = async (req, res) => {
  try {
    const { bookingId, comment } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify ownership
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to review this booking' });
    }

    // Verify booking is completed / expired (checkOut is in the past)
    const currentDate = new Date();
    const checkOutDate = new Date(booking.checkOut);
    if (checkOutDate > currentDate) {
      return res.status(400).json({ message: 'You can only review a room after your checkout date' });
    }

    // Prevent duplicate reviews for the same booking
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }

    // Parse ratings (supporting both individual fields and nested ratings object)
    let comm = req.body.communication;
    let clean = req.body.cleanliness;
    let comf = req.body.comfort;
    let fac = req.body.facilities;

    if (req.body.ratings) {
      let parsedRatings = req.body.ratings;
      if (typeof parsedRatings === 'string') {
        try {
          parsedRatings = JSON.parse(parsedRatings);
        } catch (e) {
          console.error('Error parsing ratings JSON', e);
        }
      }
      comm = parsedRatings.communication || comm;
      clean = parsedRatings.cleanliness || clean;
      comf = parsedRatings.comfort || comf;
      fac = parsedRatings.facilities || fac;
    }

    const communication = Number(comm);
    const cleanliness = Number(clean);
    const comfort = Number(comf);
    const facilities = Number(fac);

    if (isNaN(communication) || isNaN(cleanliness) || isNaN(comfort) || isNaN(facilities)) {
      return res.status(400).json({ message: 'All 4 ratings (communication, cleanliness, comfort, facilities) are required and must be numbers between 1 and 5' });
    }

    const rating = Math.round(((communication + cleanliness + comfort + facilities) / 4) * 10) / 10;

    // Handle image uploads
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push(`/uploads/${file.filename}`);
      });
    }

    const newReview = await Review.create({
      user: req.user._id,
      userName: req.user.name,
      room: booking.room,
      booking: bookingId,
      ratings: {
        communication,
        cleanliness,
        comfort,
        facilities
      },
      rating,
      comment: comment || '',
      images,
      verified: false, // Default is false, requires admin approval
    });

    res.status(201).json({
      message: 'Review submitted successfully. It will be visible after admin verification.',
      review: newReview
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Admin: Get all reviews
export const getAdminReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email avatar')
      .populate('room', 'name')
      .populate('booking', 'checkIn checkOut')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. Admin: Verify a review
export const verifyReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { verified } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.verified = verified !== undefined ? verified : true;
    await review.save();

    // Recalculate room rating
    await updateRoomRating(review.room);

    res.json({ message: `Review ${review.verified ? 'verified' : 'unverified'} successfully`, review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. Admin: Create own review under a custom name
export const createOwnReviewAdmin = async (req, res) => {
  try {
    const { roomId, userName, comment } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: 'Room ID is required' });
    }
    if (!userName) {
      return res.status(400).json({ message: 'Reviewer name is required' });
    }

    // Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Parse ratings
    let comm = req.body.communication;
    let clean = req.body.cleanliness;
    let comf = req.body.comfort;
    let fac = req.body.facilities;

    if (req.body.ratings) {
      let parsedRatings = req.body.ratings;
      if (typeof parsedRatings === 'string') {
        try {
          parsedRatings = JSON.parse(parsedRatings);
        } catch (e) {
          console.error('Error parsing ratings JSON', e);
        }
      }
      comm = parsedRatings.communication || comm;
      clean = parsedRatings.cleanliness || clean;
      comf = parsedRatings.comfort || comf;
      fac = parsedRatings.facilities || fac;
    }

    const communication = Number(comm);
    const cleanliness = Number(clean);
    const comfort = Number(comf);
    const facilities = Number(fac);

    if (isNaN(communication) || isNaN(cleanliness) || isNaN(comfort) || isNaN(facilities)) {
      return res.status(400).json({ message: 'All 4 ratings (communication, cleanliness, comfort, facilities) are required and must be numbers between 1 and 5' });
    }

    const rating = Math.round(((communication + cleanliness + comfort + facilities) / 4) * 10) / 10;

    // Handle image uploads
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push(`/uploads/${file.filename}`);
      });
    }

    const newReview = await Review.create({
      user: req.user._id, // Keep reference of who actually created it, or leave empty if purely anonymous. We keep it as admin's id.
      userName,
      room: roomId,
      ratings: {
        communication,
        cleanliness,
        comfort,
        facilities
      },
      rating,
      comment: comment || '',
      images,
      verified: true, // Created by admin, so auto-verified
    });

    // Recalculate room rating
    await updateRoomRating(roomId);

    res.status(201).json({
      message: 'Admin review added successfully',
      review: newReview
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 6. Admin/User: Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Only admin or the user who wrote it can delete
    const isUserReviewer = review.user && review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isUserReviewer && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    const roomId = review.room;
    await Review.findByIdAndDelete(reviewId);

    // Recalculate room rating
    await updateRoomRating(roomId);

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
