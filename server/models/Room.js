import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  propertyType: { type: String, default: 'Entire Villa' },
  description: { type: String, required: true },

  // Pricing
  price: { type: Number, required: true }, // Base price
  originalPrice: { type: Number }, // Optional original price (used for discount display)
  priceUnit: { type: String, default: 'night' }, // night, day, hour, etc.

  // Capacity details
  guests: { type: Number, required: true, default: 2 },
  maxAdults: { type: Number, required: true, default: 2 },
  maxChildren: { type: Number, required: true, default: 0 },
  bedrooms: { type: Number, default: 1 },
  beds: { type: Number, default: 1 },
  bathrooms: { type: Number, default: 1 },
  showers: { type: Number, default: 0 },

  size: { type: String }, 

  // Highlights
  highlights: [{
    icon: { type: String, default: 'Star' },
    text: { type: String },
    subtext: { type: String }
  }],

  // Amenities
  amenities: [{
    name: { type: String },
    icon: { type: String, default: 'Check' }
  }],

  // Images with labels
  images: [{
    url: { type: String },
    label: { type: String } // e.g., "Kitchen", "Bedroom"
  }],

  // Location
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  mapLink: { type: String },

  unavailableDates: [{ type: Date }],

  blockedDates: [{
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, default: 'Maintenance' }
  }],

  // Dynamic daily pricing calendar
  datePrices: [{
    date: { type: String, required: true },
    price: { type: Number, required: true }
  }],

  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Room', roomSchema);
// Trigger reload again
