import Hero from '../models/Hero.js';

export const getActiveHero = async (req, res) => {
  try {
    const hero = await Hero.findOne({ isActive: true });
    res.json(hero);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createHero = async (req, res) => {
  try {
    await Hero.updateMany({}, { isActive: false });
    const hero = await Hero.create({ ...req.body, isActive: true });
    res.status(201).json(hero);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateHero = async (req, res) => {
  try {
    const hero = await Hero.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hero) return res.status(404).json({ message: 'Hero not found' });
    res.json(hero);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
