import PropertyType from '../models/PropertyType.js';

export const getPropertyTypes = async (req, res) => {
  try {
    const types = await PropertyType.find().sort({ name: 1 });
    res.json(types);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createPropertyType = async (req, res) => {
  try {
    const type = await PropertyType.create(req.body);
    res.status(201).json(type);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePropertyType = async (req, res) => {
  try {
    const type = await PropertyType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(type);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePropertyType = async (req, res) => {
  try {
    await PropertyType.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property type deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
