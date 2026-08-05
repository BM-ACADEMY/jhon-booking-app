import path from 'path';
import fs from 'fs';
import AddonService from '../models/AddonService.js';

const deleteLocalFile = (relativePath) => {
  if (!relativePath || !relativePath.startsWith('/uploads/')) return;
  const fullPath = path.join(process.cwd(), relativePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (e) {
      console.error(`Error deleting file: ${fullPath}`, e);
    }
  }
};

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
    if (exists) {
      if (req.file) deleteLocalFile(`/uploads/${req.file.filename}`);
      return res.status(400).json({ message: 'Add-on service already exists' });
    }

    const data = { ...req.body };
    if (req.file) data.image = `/uploads/${req.file.filename}`;

    const addon = await AddonService.create(data);
    res.status(201).json(addon);
  } catch (err) {
    if (req.file) deleteLocalFile(`/uploads/${req.file.filename}`);
    res.status(500).json({ message: err.message });
  }
};

export const updateAddon = async (req, res) => {
  try {
    const existing = await AddonService.findById(req.params.id);
    if (!existing) {
      if (req.file) deleteLocalFile(`/uploads/${req.file.filename}`);
      return res.status(404).json({ message: 'Add-on service not found' });
    }

    const data = { ...req.body };
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
      if (existing.image) deleteLocalFile(existing.image);
    }

    const addon = await AddonService.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    res.json(addon);
  } catch (err) {
    if (req.file) deleteLocalFile(`/uploads/${req.file.filename}`);
    res.status(500).json({ message: err.message });
  }
};

export const deleteAddon = async (req, res) => {
  try {
    const addon = await AddonService.findByIdAndDelete(req.params.id);
    if (addon && addon.image) deleteLocalFile(addon.image);
    res.json({ message: 'Add-on service deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
