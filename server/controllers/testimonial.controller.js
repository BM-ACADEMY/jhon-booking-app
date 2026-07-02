import Testimonial from '../models/Testimonial.js';

// Public: get only approved testimonials
export const getActiveTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isApproved: 'approved', isActive: true }).sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: get all testimonials (any status)
export const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Public: submit a new testimonial (goes to pending)
export const submitTestimonial = async (req, res) => {
  try {
    const { name, designation, message, rating } = req.body;
    if (!name || !message || !rating) {
      return res.status(400).json({ message: 'Name, message and rating are required' });
    }
    if (message.length > 200) {
      return res.status(400).json({ message: 'Message must be 200 characters or less' });
    }
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['bg-blue-500', 'bg-rose-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-cyan-500', 'bg-primary-500'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const testimonial = await Testimonial.create({
      name, designation, message, rating,
      color, isApproved: 'pending', source: 'user',
    });
    res.status(201).json({ message: 'Thank you! Your review has been submitted for approval.', testimonial });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: create testimonial (auto-approved)
export const createTestimonial = async (req, res) => {
  try {
    const { message } = req.body;
    if (message && message.length > 200) {
      return res.status(400).json({ message: 'Message must be 200 characters or less' });
    }
    const testimonial = await Testimonial.create({ ...req.body, isApproved: 'approved', source: 'admin' });
    res.status(201).json(testimonial);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: update a testimonial
export const updateTestimonial = async (req, res) => {
  try {
    const { message } = req.body;
    if (message && message.length > 200) {
      return res.status(400).json({ message: 'Message must be 200 characters or less' });
    }
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
    res.json(testimonial);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: approve or reject a testimonial
export const approveTestimonial = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { isApproved: status },
      { new: true }
    );
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
    res.json(testimonial);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: delete a testimonial
export const deleteTestimonial = async (req, res) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Testimonial deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
