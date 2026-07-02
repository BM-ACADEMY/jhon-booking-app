import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hotel, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, ArrowRight, Clock, Sparkles, Star, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../api';
import { UpiLogo, GPayLogo, RuPayLogo, VisaLogo, MasterCardLogo } from './PaymentLogos';
import upiIcon from '../assets/icons/upi.svg?url';
import gpayIcon from '../assets/icons/gpay.svg?url';
import ruPayIcon from '../assets/icons/payment.svg?url';
import visaIcon from '../assets/icons/visa.svg?url';
import mastercardIcon from '../assets/icons/mastercard.svg?url';
import logoImg from '../assets/LogoBalified.png';
import techxLogo from '../assets/copy-techx.png';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 overflow-y-auto px-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl p-8 max-w-[400px] w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-gray-900 border border-gray-300 hover:border-gray-500 rounded-full p-1 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const StarRow = ({ rating, interactive = false, onRate, variant = 'default' }) => {
  const isForm = variant === 'form';
  return (
    <div className={`flex ${isForm ? 'gap-2 justify-center' : 'gap-1'}`}>
      {[1, 2, 3, 4, 5].map((s) => {
        const isFilled = s <= rating;

        let starClass = isForm
          ? `w-8 h-8 transition-all ${isFilled ? 'fill-[#1a73e8] text-[#1a73e8]' : 'text-[#1a73e8] fill-transparent'} ${interactive ? 'cursor-pointer hover:scale-110' : ''}`
          : `w-4 h-4 transition-colors ${isFilled ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} ${interactive ? 'cursor-pointer hover:text-amber-500/80' : ''}`;

        return (
          <Star
            key={s}
            className={starClass}
            onClick={() => interactive && onRate && onRate(s)}
          />
        );
      })}
    </div>
  );
};

const defaultSettings = {
  email: 'info@jhon.com',
  phone: '+1 (555) 000-1234',
  address: '123 Luxury Lane, Beverly Hills, CA 90210',
  checkInTime: '14:00',
  checkOutTime: '11:00',
  facebook: '',
  instagram: '',
  twitter: '',
  linkedin: ''
};

const Footer = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);


  // Fetch categories for Room Types section
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories for footer:', err);
      }
    };
    fetchCategories();
  }, []);
  const [form, setForm] = useState({ name: '', designation: 'Guest', message: '', rating: 0 });

  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim() || form.rating === 0) {
      toast.error('Please fill in your name, review, and leave a star rating.');
      return;
    }
    if (form.message.length > 160) {
      toast.error('Review must be 160 characters or less.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/testimonials/submit', form);
      setForm({ name: '', designation: 'Guest', message: '', rating: 0 });
      setShowForm(false);
      toast.success('Review submitted! It will appear after admin approval.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data) {
          setSettings(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch settings for footer:', err);
      }
    };
    fetchSettings();
  }, []);

  const formatTime = (timeStr, fallback) => {
    if (!timeStr) return fallback;
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const socialLinks = [
    { Icon: Facebook, href: settings.facebook, name: 'Facebook' },
    { Icon: Instagram, href: settings.instagram, name: 'Instagram' },
    { Icon: Twitter, href: settings.twitter, name: 'Twitter' },
    { Icon: Linkedin, href: settings.linkedin, name: 'LinkedIn' },
  ].filter(link => link.href && link.href !== '#' && link.href.trim() !== '');

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 via-gray-950 to-black text-gray-400 overflow-hidden">
      {/* Decorative top ambient light line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-600/30 to-transparent"></div>

      {/* Visual luxury accent glows */}
      <div className="absolute -left-36 -top-36 w-72 h-72 rounded-full bg-slate-800/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -right-36 -bottom-36 w-72 h-72 rounded-full bg-slate-800/10 blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pb-24 lg:pb-36 relative z-10">

        {/* Middle Section: Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-16">
          {/* Brand Col */}
          <div className="lg:col-span-4">
            <Link to="/" className="bg-white rounded-xl inline-flex items-center mb-6 outline-none border-none">
              <img
                src={logoImg}
                alt="Logo"
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="text-sm leading-relaxed mb-6 text-slate-400 max-w-sm">
              Your premier destination for luxury accommodation. Experience world-class hospitality, custom amenities, and a home-away-from-home at the heart of the city.
            </p>
            {/* Social Links with hover states */}
            {socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map(({ Icon, href, name }) => (
                  <motion.a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -3, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:border-white/10 hover:text-white flex items-center justify-center transition-colors shadow-sm"
                    aria-label={`Follow us on ${name}`}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 lg:pl-4">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-6">Quick Links</h4>
            <ul className="space-y-4">
              {[
                { label: 'Home', to: '/' },
                { label: 'Our Rooms', to: '/rooms' },
                { label: 'About Us', to: '/about' },
                { label: 'Contact', to: '/contact' }
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="group text-sm hover:text-white transition-colors duration-300 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-white transition-colors duration-300"></span>
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setShowForm(true)}
                  className="group text-sm hover:text-white text-slate-400 transition-colors duration-300 flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer text-left outline-none font-normal"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-white transition-colors duration-300"></span>
                  Feedback
                </button>
              </li>
            </ul>
          </div>

          {/* Room Types */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-6">Room Types</h4>
            <ul className="space-y-4">
              {categories.map((cat) => (
                <li key={cat._id}>
                  <Link to="/rooms" className="group text-sm hover:text-white transition-colors duration-300 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-white transition-colors duration-300"></span>
                    {cat.name}
                  </Link>
                </li>
              ))}
              {categories.length === 0 && (
                <li className="text-slate-500 text-sm">No categories available</li>
              )}
            </ul>
          </div>

          {/* Contact Col */}
          <div className="lg:col-span-4">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-6">Contact Us</h4>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3.5 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{settings.address || '123 Luxury Lane, Beverly Hills, CA 90210'}</span>
              </li>
              <li className="flex items-center gap-3.5 text-sm text-slate-400">
                <Phone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <a href={`tel:${settings.phone || '+15550001'}`} className="hover:text-white transition-colors duration-300">
                  {settings.phone || '+1 (555) 000-1234'}
                </a>
              </li>
              <li className="flex items-center gap-3.5 text-sm text-slate-400">
                <Mail className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <a href={`mailto:${settings.email || 'info@jhon.com'}`} className="hover:text-white transition-colors duration-300">
                  {settings.email || 'info@jhon.com'}
                </a>
              </li>
            </ul>

            {/* Check in Check out glass box */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white">
                <Clock className="w-4.5 h-4.5 text-slate-300" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Check-in / Check-out</p>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  {formatTime(settings.checkInTime, '2:00 PM')} / {formatTime(settings.checkOutTime, '11:00 AM')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Copyright & Legal & Payments */}
        <div className="border-t border-white/15 pt-8 flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-6 text-xs text-slate-400 mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <p>© {new Date().getFullYear()} The Balified Villa. All rights reserved.</p>
            <span className="hidden sm:inline text-slate-800">|</span>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <a href="#" className="hover:text-slate-300 transition-colors duration-300">Privacy Policy</a>
              <span className="text-slate-800">|</span>
              <a href="#" className="hover:text-slate-300 transition-colors duration-300">Terms of Service</a>
              <span className="text-slate-800">|</span>
              <a
                href="https://bmtechx.in"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-300 transition-all duration-300 flex items-center gap-1.5"
              >
                <span>Designed & Developed by</span>
                <img src={techxLogo} alt="BM TechX" className="h-6 w-auto object-contain inline-block" />
              </a>
            </div>
          </div>

          {/* Payment Methods - Pushed completely to the right side */}
          <div className="flex items-center justify-center gap-4 w-full lg:w-auto lg:justify-end lg:ml-auto">
            <img src={upiIcon} alt="Accepted Payment Method: UPI" className="h-5 w-auto object-contain opacity-90" />
            <img src={gpayIcon} alt="Accepted Payment Method: GPay" className="h-5 w-auto object-contain opacity-90" />
            <img src={ruPayIcon} alt="Accepted Payment Method: RuPay" className="h-5 w-auto object-contain opacity-90" />
            <img src={visaIcon} alt="Accepted Payment Method: Visa" className="h-5 w-auto object-contain opacity-90" />
            <img src={mastercardIcon} alt="Accepted Payment Method: Mastercard" className="h-5 w-auto object-contain opacity-90" />
          </div>
        </div>

      </div>

      {/* Giant Background Outline Text */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none select-none z-0">
        <span
          className="text-[11vw] sm:text-[10vw] md:text-[9vw] lg:text-[6vw] font-black uppercase tracking-[0.06em] text-transparent leading-none whitespace-nowrap block"
          style={{
            WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.15)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 20%, rgba(0, 0, 0, 0) 100%)',
            maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 20%, rgba(0, 0, 0, 0) 100%)'
          }}
        >
          The Balified Villa
        </span>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-serif text-gray-900">Feedback</h2>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-inner shrink-0">
              <span className="text-white font-black text-xl">H</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Hotel Experience</h3>
              <p className="text-[11px] text-gray-500">Hospitality & Services</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col items-center py-2">
              <StarRow rating={form.rating} interactive onRate={(s) => setForm(p => ({ ...p, rating: s }))} variant="form" />
              <span className="text-xs text-gray-400 mt-2">Tap to leave a rating</span>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-semibold text-gray-800 mb-2">What impressed you the most?</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Review Title (Your Name)"
                className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-sm text-gray-900 outline-none focus:ring-0 focus:border-blue-600 transition-colors placeholder:text-gray-300"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-800">Describe your experience</label>
                <span className={`text-[10px] font-bold ${form.message.length > 150 ? 'text-red-500 font-extrabold' : 'text-gray-400'}`}>
                  {form.message.length} / 160
                </span>
              </div>
              <textarea
                value={form.message}
                onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                rows={3}
                maxLength={160}
                placeholder="Describe your experience (max 160 characters)..."
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none transition-all placeholder:text-gray-300"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1a73e8] hover:bg-[#155db1] text-white text-sm font-bold rounded-full transition-all disabled:opacity-50 cursor-pointer border-none"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </Modal>
    </footer>
  );
};

export default Footer;
