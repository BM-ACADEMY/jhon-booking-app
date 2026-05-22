import { Wifi, Car, Utensils, Waves, Dumbbell, Shield, Coffee, Sparkles } from 'lucide-react';

const features = [
  { icon: Wifi, title: 'High-Speed Wi-Fi', desc: 'Complimentary 1Gbps internet throughout the property', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: Car, title: 'Free Parking', desc: 'Secure underground parking available for all guests', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: Utensils, title: 'Fine Dining', desc: 'Award-winning restaurant serving world cuisine', color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: Waves, title: 'Infinity Pool', desc: 'Rooftop pool with breathtaking panoramic views', color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { icon: Dumbbell, title: 'Fitness Center', desc: 'State-of-the-art gym open 24 hours a day', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: Shield, title: '24/7 Security', desc: 'Round-the-clock concierge and security team', color: 'text-red-500', bg: 'bg-red-50' },
  { icon: Coffee, title: 'Breakfast Included', desc: 'Full buffet breakfast for all room bookings', color: 'text-amber-500', bg: 'bg-amber-50' },
  { icon: Sparkles, title: 'Spa & Wellness', desc: 'Premium spa treatments and wellness programs', color: 'text-pink-500', bg: 'bg-pink-50' },
];

const FeaturesSection = () => (
  <section className="py-20 lg:py-28 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-14">
        <p className="text-primary-500 text-sm font-semibold uppercase tracking-widest mb-3">Why Choose Us</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          World-Class Amenities
        </h2>
        <p className="text-gray-500 mt-4 max-w-xl mx-auto">
          Everything you need for an unforgettable stay, all in one place.
        </p>
        <div className="w-16 h-1 bg-primary-500 rounded-full mx-auto mt-5" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map(({ icon: Icon, title, desc, color, bg }) => (
          <div
            key={title}
            className="group p-6 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 cursor-default"
          >
            <div className={`${bg} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1.5">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
