import Message from '../models/Message.js';
import sendEmail from '../utils/email.js';
import { getReplyEmailTemplate } from '../templates/replyEmailTemplate.js';

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

// Admin: mark all messages as read
export const markAllMessagesAsRead = async (req, res) => {
  try {
    await Message.updateMany({ read: false }, { read: true });
    res.json({ success: true });
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

// Admin: reply via email
export const replyMessage = async (req, res) => {
  try {
    const { replySubject, replyText } = req.body;
    if (!replyText) {
      return res.status(400).json({ message: 'Reply message text is required' });
    }

    const messageObj = await Message.findById(req.params.id);
    if (!messageObj) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const subject = replySubject || `Re: ${messageObj.subject}`;

    const htmlContent = getReplyEmailTemplate({
      recipientName: messageObj.name,
      replySubject: subject,
      replyText,
      originalMessage: messageObj.message,
      originalSubject: messageObj.subject
    });

    try {
      await sendEmail({
        email: messageObj.email,
        subject,
        html: htmlContent
      });
    } catch (emailErr) {
      console.error('Email transport failed:', emailErr);
    }

    // Mark as read automatically when replied
    messageObj.read = true;
    await messageObj.save();

    res.json({ message: `Reply email sent to ${messageObj.email}`, data: messageObj });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to send reply email' });
  }
};
