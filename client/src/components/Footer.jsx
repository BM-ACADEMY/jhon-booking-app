import { Link } from 'react-router-dom';
import { Hotel, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

const Footer = () => (
  <footer className="bg-gray-950 text-gray-400">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Jhon Booking</p>
              <p className="text-gray-500 text-xs">Luxury Hotel & Resort</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-6">
            Your premier destination for luxury accommodation. Experience world-class hospitality at the heart of the city.
          </p>
          <div className="flex gap-3">
            {[
              { Icon: Facebook, href: '#' },
              { Icon: Instagram, href: '#' },
              { Icon: Twitter, href: '#' },
              { Icon: Linkedin, href: '#' },
            ].map(({ Icon, href }, i) => (
              <a
                key={i}
                href={href}
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-primary-500/20 hover:text-primary-400 flex items-center justify-center transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-5">Quick Links</h4>
          <ul className="space-y-3">
            {[
              { label: 'Home', to: '/' },
              { label: 'Our Rooms', to: '/rooms' },
              { label: 'About Us', to: '/about' },
              { label: 'Contact', to: '/contact' },
              { label: 'Admin Panel', to: '/admin' },
            ].map(({ label, to }) => (
              <li key={label}>
                <Link to={to} className="text-sm hover:text-primary-400 transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Room Types */}
        <div>
          <h4 className="text-white font-semibold mb-5">Room Types</h4>
          <ul className="space-y-3">
            {['Standard Rooms', 'Deluxe Rooms', 'Junior Suites', 'Presidential Suites', 'Penthouse'].map((r) => (
              <li key={r}>
                <Link to="/rooms" className="text-sm hover:text-primary-400 transition-colors">{r}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-5">Contact Us</h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-sm">
              <MapPin className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
              123 Luxury Lane, Beverly Hills, CA 90210
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-primary-500 flex-shrink-0" />
              <a href="tel:+15550001" className="hover:text-primary-400 transition-colors">+1 (555) 000-1234</a>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-primary-500 flex-shrink-0" />
              <a href="mailto:info@jhon.com" className="hover:text-primary-400 transition-colors">info@jhon.com</a>
            </li>
          </ul>
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xs text-gray-500 mb-1">Check-in / Check-out</p>
            <p className="text-sm text-white font-medium">2:00 PM / 11:00 AM</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
        <p>© {new Date().getFullYear()} Jhon Booking. All rights reserved.</p>
        <div className="flex gap-5">
          <a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary-400 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary-400 transition-colors">Cookie Policy</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
