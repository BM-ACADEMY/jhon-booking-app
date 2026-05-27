import { Hotel, Award, Users, ShieldCheck, Coffee, MapPin } from 'lucide-react';
import aboutHero from '../assets/about-hero.png';

const AboutPage = () => {
  const stats = [
    { label: 'Years of Excellence', value: '15+' },
    { label: 'Luxury Rooms', value: '120+' },
    { label: 'Happy Guests', value: '50k+' },
    { label: 'Awards Won', value: '25' },
  ];

  const features = [
    {
      icon: <Award className="w-6 h-6" />,
      title: 'World Class Service',
      description: 'Our dedicated staff is committed to providing an unparalleled level of hospitality and attention to detail.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: 'Safety & Security',
      description: 'Your safety is our priority. We maintain the highest standards of security and hygiene across all our properties.',
    },
    {
      icon: <Coffee className="w-6 h-6" />,
      title: 'Premium Amenities',
      description: 'From gourmet dining to state-of-the-art spa facilities, enjoy the finest amenities designed for your comfort.',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Prime Locations',
      description: 'Our hotels are situated in the most iconic and accessible locations, perfect for business or leisure.',
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={aboutHero}
            alt="Luxury Hotel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Our Legacy of <span className="text-primary-400">Luxury</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light">
            Crafting unforgettable experiences and timeless memories since 2009.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-primary-600 font-semibold tracking-wider uppercase text-sm">Our Story</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-6">
              A New Standard of Hospitality
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Founded on the principles of elegance and exceptional service, The Balified Villa has grown from a single boutique hotel to a world-renowned destination for luxury travelers.
              </p>
              <p>
                We believe that every stay should be more than just a room—it should be an experience. Our philosophy blends traditional hospitality with modern innovation, ensuring that every guest feels truly at home while enjoying the finest luxuries.
              </p>
              <p>
                Our commitment to excellence has earned us numerous accolades, but our greatest reward remains the smile on our guests' faces and the memories they take home.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="h-64 rounded-2xl overflow-hidden shadow-lg">
                <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800" alt="Hotel Interior" className="w-full h-full object-cover" />
              </div>
              <div className="h-48 rounded-2xl overflow-hidden shadow-lg">
                <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800" alt="Spa" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="h-48 rounded-2xl overflow-hidden shadow-lg">
                <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800" alt="Dining" className="w-full h-full object-cover" />
              </div>
              <div className="h-64 rounded-2xl overflow-hidden shadow-lg">
                <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800" alt="Pool" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">{stat.value}</p>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary-600 font-semibold tracking-wider uppercase text-sm">Experience</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Why Guests Love Us</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-8 rounded-3xl bg-white border border-gray-100 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-primary-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Hotel className="w-12 h-12 text-primary-400 mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl md:text-2xl font-light italic leading-relaxed text-primary-100">
            "To define the future of luxury hospitality by creating personalized experiences that inspire and delight every guest, every time."
          </p>
          <div className="mt-10 h-1 w-20 bg-primary-500 mx-auto rounded-full" />
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
