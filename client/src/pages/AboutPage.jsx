import React from 'react';
import { Hotel, Award, ShieldCheck, Coffee, MapPin, ArrowRight } from 'lucide-react';
// import aboutHero from '../assets/about-hero.png'; // Make sure your path is correct

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
    <div className="bg-stone-50 font-sans text-stone-800">
      {/* Hero Section */}
    <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80"
            alt="The Balified Villa Exterior"
            className="w-full h-full object-cover"
          />
          {/* Dark overlay to ensure text readability, similar to the image */}
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        {/* Content Container */}
        <div className="relative z-10 text-center px-4 flex flex-col items-center w-full max-w-5xl mx-auto mt-12">
     
          
          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-6">
           About <span className="text-[#d9f969]">Us</span>
          </h1>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-12 bg-amber-600"></div>
              <span className="text-amber-700 font-semibold tracking-wider uppercase text-sm">Our Story</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif text-stone-900 mb-8 leading-tight">
              A New Standard of Hospitality
            </h2>
            <div className="space-y-6 text-stone-600 leading-relaxed text-lg font-light">
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

          {/* Staggered Image Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4 translate-y-8">
              <div className="h-64 overflow-hidden rounded-sm shadow-xl">
                <img src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800" alt="Hotel Interior" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="h-48 overflow-hidden rounded-sm shadow-xl">
                <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800" alt="Spa" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-48 overflow-hidden rounded-sm shadow-xl">
                <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800" alt="Dining" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="h-64 overflow-hidden rounded-sm shadow-xl">
                <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800" alt="Pool" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Redesigned with Dark Background for Contrast */}
      <section className="bg-stone-900 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-stone-800">
            {stats.map((stat, index) => (
              <div key={index} className="text-center px-4">
                <p className="text-4xl md:text-5xl font-serif text-amber-500 mb-3">{stat.value}</p>
                <p className="text-xs md:text-sm text-stone-400 font-medium uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px w-8 bg-amber-600"></div>
            <span className="text-amber-700 font-semibold tracking-wider uppercase text-sm">Experience</span>
            <div className="h-px w-8 bg-amber-600"></div>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mt-2">Why Guests Love Us</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-8 bg-white border border-stone-100 hover:border-amber-200 hover:shadow-2xl hover:shadow-amber-900/5 transition-all duration-300 group rounded-sm">
              <div className="w-14 h-14 bg-stone-50 flex items-center justify-center text-amber-700 mb-6 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300 rounded-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-serif text-stone-900 mb-3">{feature.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed font-light">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-stone-200 text-stone-900 relative">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Hotel className="w-12 h-12 text-amber-700 mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl font-serif mb-8">Our Mission</h2>
          <p className="text-xl md:text-3xl font-serif italic leading-relaxed text-stone-700">
            "To define the future of luxury hospitality by creating personalized experiences that inspire and delight every guest, every time."
          </p>
          <div className="mt-12 h-px w-24 bg-amber-600 mx-auto" />
        </div>
      </section>
    </div>
  );
};

export default AboutPage;