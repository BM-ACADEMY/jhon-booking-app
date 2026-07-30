import mongoose from 'mongoose';

const pageContentSchema = new mongoose.Schema({
  page: { type: String, required: true, unique: true }, // 'about', 'contact'
  bannerImage: { type: String, default: '' },
  bannerTitle: { type: String, default: '' },
  bannerSubtitle: { type: String, default: '' },
  // About Page specific fields:
  storyTitle: { type: String, default: 'A New Standard of Hospitality' },
  storyContent: { 
    type: [String], 
    default: [
      "Founded on the principles of elegance and exceptional service, The Balified Villa has grown from a single boutique hotel to a world-renowned destination for luxury travelers.",
      "We believe that every stay should be more than just a room—it should be an experience. Our philosophy blends traditional hospitality with modern innovation, ensuring that every guest feels truly at home while enjoying the finest luxuries.",
      "Our commitment to excellence has earned us numerous accolades, but our greatest reward remains the smile on our guests' faces and the memories they take home."
    ] 
  },
  storyImages: { 
    type: [String], 
    default: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800"
    ] 
  },
}, { timestamps: true });

export default mongoose.model('PageContent', pageContentSchema);
