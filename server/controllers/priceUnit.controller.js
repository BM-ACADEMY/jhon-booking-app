import PriceUnit from '../models/PriceUnit.js';

export const getPriceUnits = async (req, res) => {
  try {
    const units = await PriceUnit.find().sort({ name: 1 });
    res.json(units);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createPriceUnit = async (req, res) => {
  try {
    const unit = await PriceUnit.create(req.body);
    res.status(201).json(unit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePriceUnit = async (req, res) => {
  try {
    const unit = await PriceUnit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePriceUnit = async (req, res) => {
  try {
    await PriceUnit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Price unit deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
