import Message from '../models/Message.js';

// Public: submit contact message
export const submitMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const newMessage = await Message.create({ name, email, subject, message });
    res.status(201).json({ message: 'Message sent successfully! We will get back to you soon.', data: newMessage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: get all contact messages
export const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: toggle/mark as read
export const markAsRead = async (req, res) => {
  try {
    const { read } = req.body;
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      { read },
      { new: true }
    );
    if (!updatedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json(updatedMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: delete message
export const deleteMessage = async (req, res) => {
  try {
    const deletedMessage = await Message.findByIdAndDelete(req.params.id);
    if (!deletedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
