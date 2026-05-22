import { Link } from 'react-router-dom';
import { CalendarDays, Phone } from 'lucide-react';

const CtaBanner = () => (
  <section className="py-20 lg:py-24 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-primary-950 to-gray-900 p-10 lg:p-16 text-center">
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary-500/20 blur-3xl rounded-full" />

        <div className="relative z-10">
          <p className="text-primary-400 text-sm font-semibold uppercase tracking-widest mb-4">Limited Offer</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready for an Unforgettable Stay?
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto mb-8">
            Book directly with us and get up to <span className="text-primary-400 font-semibold">20% off</span> plus complimentary breakfast for two.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/rooms"
              className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-primary-500/30 hover:-translate-y-0.5"
            >
              <CalendarDays className="w-5 h-5" />
              Book Your Stay
            </Link>
            <a
              href="tel:+15550001"
              className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5"
            >
              <Phone className="w-5 h-5" />
              Call Us Now
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CtaBanner;
