import Setting from '../models/Setting.js';

export const getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      // Return default configuration if none exists yet
      return res.json({
        email: 'info@jhonhotel.com',
        phone: '+1 (555) 123-4567',
        address: '123 Luxury Lane, Beverly Hills, CA 90210',
        checkInTime: '14:00',
        checkOutTime: '11:00',
        facebook: '',
        instagram: '',
        twitter: '',
        linkedin: ''
      });
    }
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const {
      email,
      phone,
      address,
      checkInTime,
      checkOutTime,
      facebook,
      instagram,
      twitter,
      linkedin
    } = req.body;

    let setting = await Setting.findOne();

    if (setting) {
      setting.email = email !== undefined ? email : setting.email;
      setting.phone = phone !== undefined ? phone : setting.phone;
      setting.address = address !== undefined ? address : setting.address;
      setting.checkInTime = checkInTime !== undefined ? checkInTime : setting.checkInTime;
      setting.checkOutTime = checkOutTime !== undefined ? checkOutTime : setting.checkOutTime;
      setting.facebook = facebook !== undefined ? facebook : setting.facebook;
      setting.instagram = instagram !== undefined ? instagram : setting.instagram;
      setting.twitter = twitter !== undefined ? twitter : setting.twitter;
      setting.linkedin = linkedin !== undefined ? linkedin : setting.linkedin;
      await setting.save();
    } else {
      setting = await Setting.create({
        email,
        phone,
        address,
        checkInTime,
        checkOutTime,
        facebook,
        instagram,
        twitter,
        linkedin
      });
    }

    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
