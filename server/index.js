import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import roomRoutes from './routes/room.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import userRoutes from './routes/user.routes.js';
import testimonialRoutes from './routes/testimonial.routes.js';
import heroRoutes from './routes/hero.routes.js';
import categoryRoutes from './routes/category.routes.js';
import propertyTypeRoutes from './routes/propertyType.routes.js';
import priceUnitRoutes from './routes/priceUnit.routes.js';
import settingRoutes from './routes/setting.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// 1. Security Headers (Helmet)
// Configured to allow cross-origin resource sharing of static assets (e.g. uploaded images)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. HTTP Request Logger (Morgan)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 3. CORS Handler (using environment variable directly)
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files route (Serving uploaded files)
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/property-types', propertyTypeRoutes);
app.use('/api/price-units', priceUnitRoutes);
app.use('/api/settings', settingRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Jhon Booking API running securely' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

