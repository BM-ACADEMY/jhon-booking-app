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
        linkedin: '',
        cancelDurationHrs: 24,
        advancePercent1Day: 100,
        advancePercent2Day: 50,
        advancePercent3Day: 40,
        advancePercent4Day: 30,
        advancePercent5To7Days: 25,
        advancePercentAbove7Days: 20,
        taxRules: []
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
      linkedin,
      cancelDurationHrs,
      advancePercent1Day,
      advancePercent2Day,
      advancePercent3Day,
      advancePercent4Day,
      advancePercent5To7Days,
      advancePercentAbove7Days,
      taxRules
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
      setting.cancelDurationHrs = cancelDurationHrs !== undefined ? Number(cancelDurationHrs) : setting.cancelDurationHrs;
      setting.advancePercent1Day = advancePercent1Day !== undefined ? Number(advancePercent1Day) : setting.advancePercent1Day;
      setting.advancePercent2Day = advancePercent2Day !== undefined ? Number(advancePercent2Day) : setting.advancePercent2Day;
      setting.advancePercent3Day = advancePercent3Day !== undefined ? Number(advancePercent3Day) : setting.advancePercent3Day;
      setting.advancePercent4Day = advancePercent4Day !== undefined ? Number(advancePercent4Day) : setting.advancePercent4Day;
      setting.advancePercent5To7Days = advancePercent5To7Days !== undefined ? Number(advancePercent5To7Days) : setting.advancePercent5To7Days;
      setting.advancePercentAbove7Days = advancePercentAbove7Days !== undefined ? Number(advancePercentAbove7Days) : setting.advancePercentAbove7Days;
      setting.taxRules = taxRules !== undefined ? taxRules : setting.taxRules;
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
        linkedin,
        cancelDurationHrs,
        advancePercent1Day,
        advancePercent2Day,
        advancePercent3Day,
        advancePercent4Day,
        advancePercent5To7Days,
        advancePercentAbove7Days,
        taxRules
      });
    }

    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
