import mongoose from 'mongoose';

const slideSchema = new mongoose.Schema({
  titleLine1: { type: String, default: 'Experience Luxury' },
  titleLine2: { type: String },
  subtitle: { type: String },
  videoUrl: { type: String },
  backgroundImage: { type: String },
  mobileImage: { type: String },
  
  // Custom Typography & Styling
  title1Color: { type: String, default: '#ffffff' },
  title1FontSize: { type: String, default: 'default' },
  title1FontWeight: { type: String, default: 'bold' },
  
  title2Color: { type: String, default: '#d9f969' },
  title2FontSize: { type: String, default: 'default' },
  title2FontWeight: { type: String, default: 'bold' },
  
  subtitleColor: { type: String, default: '#ffffff' },
  subtitleFontSize: { type: String, default: 'default' },
  subtitleFontWeight: { type: String, default: 'medium' },
  
  fontFamily: { type: String, default: 'sans' },
  textAlignment: { type: String, default: 'center' },
});

const heroSchema = new mongoose.Schema({
  title: { type: String }, // legacy field
  titleLine1: { type: String, default: 'Experience Luxury' },
  titleLine2: { type: String },
  subtitle: { type: String },
  videoUrl: { type: String },
  backgroundImage: { type: String },
  
  slides: [slideSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Hero', heroSchema);
