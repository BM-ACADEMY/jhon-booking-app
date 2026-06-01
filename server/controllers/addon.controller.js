import AddonService from '../models/AddonService.js';

export const getAddons = async (req, res) => {
  try {
    const addons = await AddonService.find().sort({ name: 1 });
    res.json(addons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createAddon = async (req, res) => {
  try {
    const exists = await AddonService.findOne({ name: { $regex: new RegExp(`^${req.body.name}$`, 'i') } });
    if (exists) return res.status(400).json({ message: 'Add-on service already exists' });
    const addon = await AddonService.create(req.body);
    res.status(201).json(addon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAddon = async (req, res) => {
  try {
    const addon = await AddonService.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!addon) return res.status(404).json({ message: 'Add-on service not found' });
    res.json(addon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAddon = async (req, res) => {
  try {
    await AddonService.findByIdAndDelete(req.params.id);
    res.json({ message: 'Add-on service deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
