import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    email: 'reservations@thebalified.com',
    phone: '+1 (555) 123-4567',
    address: '123 Luxury Ave, Coastal Estate',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data) {
          setSettings(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch contact settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/messages/submit', formData);

      toast.success('Message sent successfully! We will get back to you soon.', {
        style: {
          borderRadius: '0px',
          background: '#333',
          color: '#fff',
        },
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message. Please try again.', {
        style: {
          borderRadius: '0px',
          background: '#333',
          color: '#fff',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <Phone className="w-5 h-5" />,
      label: 'Call Us',
      value: settings.phone,
    },
    {
      icon: <Mail className="w-5 h-5" />,
      label: 'Email Us',
      value: settings.email,
      description: 'Our friendly team is here to help.',
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      label: 'Visit Us',
      value: settings.address,
      description: 'Come say hello at our reception.',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Working Hours',
      value: `Check-in: ${settings.checkInTime} / Check-out: ${settings.checkOutTime}`,
      description: 'Standard timings for your comfort.',
    },
  ];

  const socialLinks = [
    { name: 'Facebook', url: settings.facebook || 'https://facebook.com', icon: <Facebook className="w-5 h-5" /> },
    { name: 'Twitter', url: settings.twitter || 'https://twitter.com', icon: <Twitter className="w-5 h-5" /> },
    { name: 'Instagram', url: settings.instagram || 'https://instagram.com', icon: <Instagram className="w-5 h-5" /> },
    { name: 'LinkedIn', url: settings.linkedin || 'https://linkedin.com', icon: <Linkedin className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-stone-50 min-h-screen font-sans text-stone-800">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=80"
            alt="Contact Us"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative z-10 text-center px-4 flex flex-col items-center w-full max-w-5xl mx-auto mt-12">
          <span className="text-[#d9f969] font-bold tracking-[0.15em] uppercase text-sm md:text-base mb-4">
            Get in Touch
          </span>
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6">
            Contact <span className="italic text-[#d9f969]">Us</span>
          </h1>
          <p className="text-lg md:text-2xl text-white max-w-2xl mx-auto font-light">
            Have questions? We're here to help you plan your perfect stay.
          </p>
        </div>
      </section>

      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-16">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px w-12 bg-amber-600"></div>
                <span className="text-amber-700 font-semibold tracking-wider uppercase text-sm">Reach Out</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-8">We're Here</h2>
            </div>

            <div className="space-y-4">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex gap-5 p-6 bg-white border border-stone-200 hover:border-amber-300 hover:shadow-lg hover:shadow-stone-200 transition-all duration-300 group rounded-sm">
                  <div className="w-12 h-12 bg-stone-50 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300 rounded-sm shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-base font-serif text-stone-900">{item.value}</p>
                    <p className="text-sm text-stone-500 mt-1 font-light">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Media Links */}
            <div className="pt-10 border-t border-stone-200">
              <p className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-6">Follow Us</p>
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.name}
                    className="w-12 h-12 border border-stone-200 bg-white flex items-center justify-center text-stone-600 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all duration-300 rounded-sm"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white border border-stone-200 p-8 md:p-14 shadow-xl shadow-stone-200/50 rounded-sm">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-stone-50 flex items-center justify-center text-amber-700 rounded-sm border border-stone-100">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-2xl font-serif text-stone-900">Send us a Message</h3>
                <p className="text-stone-500 font-light mt-1">We'll respond within 24 hours.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 font-light">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-stone-700 uppercase tracking-wide">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full px-5 py-4 bg-stone-50 border border-stone-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all outline-none rounded-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-stone-700 uppercase tracking-wide">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full px-5 py-4 bg-stone-50 border border-stone-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all outline-none rounded-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-stone-700 uppercase tracking-wide">Subject</label>
                <input
                  id="subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="How can we help?"
                  className="w-full px-5 py-4 bg-stone-50 border border-stone-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all outline-none rounded-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-stone-700 uppercase tracking-wide">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Tell us more about your inquiry..."
                  className="w-full px-5 py-4 bg-stone-50 border border-stone-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all outline-none resize-none rounded-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#ea7b00] hover:bg-[#cc6b00] text-white font-medium py-5 px-8 transition-colors duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group rounded-none mt-4 text-lg"
              >
                {isSubmitting ? (
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="h-[500px] w-full bg-stone-200 transition-all duration-700 relative overflow-hidden">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3903.09121251625!2d79.8397885!3d11.968186500000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a536365f691abb5%3A0x734a1822f8140975!2sThe%20Balified%20Villa!5e0!3m2!1sen!2sin!4v1780057279015!5m2!1sen!2sin"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          title="Hotel Location"
        />
        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5" />
      </section>
    </div>
  );
};

export default ContactPage;
