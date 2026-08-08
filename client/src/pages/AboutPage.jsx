import React, { useState, useEffect } from 'react';
import { Hotel, Trees, Bath, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import api from '../api';

const AboutPage = () => {
  const [content, setContent] = useState(null);
  const baseUrl = import.meta.env.VITE_BASE_URL && import.meta.env.VITE_BASE_URL !== 'undefined' ? import.meta.env.VITE_BASE_URL : '';

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await api.get('/page-content/about');
        if (res.data) {
          setContent(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch about content:', err);
      }
    };
    fetchContent();
  }, []);

  const stats = [
    { label: 'Years Creating Memorable Stays', value: '4+' },
    { label: 'Rooms', value: '10+' },
    { label: 'Happy Guests', value: '20K+' },
    { label: 'Reviews (4.8★ Avg)', value: '1000+' },
  ];

  const features = [
    {
      icon: <Trees className="w-6 h-6" />,
      title: 'Unique Themed Stays',
      description: 'Beautifully designed Bali and Greece-inspired rooms that make every stay feel truly different.',
    },
    {
      icon: <Bath className="w-6 h-6" />,
      title: 'Romantic Experiences',
      description: 'Private bathtub suites and thoughtfully curated spaces for couples, anniversaries and special celebrations.',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Spotlessly Clean',
      description: 'Meticulously maintained rooms that ensure every stay is fresh, comfortable and welcoming.',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Prime Location',
      description: 'Perfectly located between White Town and Auroville, with Serenity Beach just minutes away.',
    },
  ];

  const getFullUrl = (src) => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:')) return src;
    return `${baseUrl}${src}`;
  };

  const bannerImg = content?.bannerImage || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80";
  const bannerTitle = content?.bannerTitle || "About Us";
  const bannerSubtitle = content?.bannerSubtitle || "Learn more about our heritage and values";

  const storyTitle = content?.storyTitle || "A New Standard of Hospitality";
  const storyParas = content?.storyContent && content.storyContent.length > 0 ? content.storyContent : [
    "Founded on the principles of elegance and exceptional service, The Balified Villa has grown from a single boutique hotel to a world-renowned destination for luxury travelers.",
    "We believe that every stay should be more than just a room—it should be an experience. Our philosophy blends traditional hospitality with modern innovation, ensuring that every guest feels truly at home while enjoying the finest luxuries.",
    "Our commitment to excellence has earned us numerous accolades, but our greatest reward remains the smile on our guests' faces and the memories they take home."
  ];

  const storyImgs = content?.storyImages || [
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800"
  ];

  return (
    <div className="bg-stone-50 font-sans text-stone-800 animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0">
          <img
            src={getFullUrl(bannerImg)}
            alt="The Balified Villa Exterior"
            className="w-full h-full object-cover"
          />
          {/* Dark overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black/55" />
        </div>
        
        {/* Content Container */}
        <div className="relative z-10 text-center px-4 flex flex-col items-center w-full max-w-5xl mx-auto mt-12">
          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-4">
            {bannerTitle}
          </h1>
          {bannerSubtitle && (
            <p className="text-stone-200 text-sm md:text-lg tracking-wider max-w-2xl font-light">
              {bannerSubtitle}
            </p>
          )}
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
            <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-8 leading-tight">
              {storyTitle}
            </h2>
            <div className="space-y-6 text-stone-600 leading-relaxed text-base font-light">
              {storyParas.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </div>

          {/* Staggered Image Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4 translate-y-8">
              <div className="h-64 overflow-hidden rounded-lg shadow-xl border border-stone-200/20">
                <img src={getFullUrl(storyImgs[0])} alt="Hotel Interior" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="h-48 overflow-hidden rounded-lg shadow-xl border border-stone-200/20">
                <img src={getFullUrl(storyImgs[1])} alt="Spa" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-48 overflow-hidden rounded-lg shadow-xl border border-stone-200/20">
                <img src={getFullUrl(storyImgs[2])} alt="Dining" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="h-64 overflow-hidden rounded-lg shadow-xl border border-stone-200/20">
                <img src={getFullUrl(storyImgs[3])} alt="Pool" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
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
            <div key={index} className="p-8 bg-white border border-stone-100 hover:border-amber-200 hover:shadow-2xl hover:shadow-amber-900/5 transition-all duration-300 group rounded-lg">
              <div className="w-14 h-14 bg-stone-50 flex items-center justify-center text-amber-700 mb-6 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300 rounded-lg shrink-0">
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
          <p className="text-lg md:text-2xl font-serif italic leading-relaxed text-stone-700">
            "To create private, memorable stays where every guest feels genuinely welcomed and every visit becomes a story worth remembering. We also believe great hospitality begins with a great team, which is why we're committed to creating a workplace where our people can grow, take pride in what they do, and continue delivering the warmth and care that define The Balified Villa."
          </p>
          <div className="mt-12 h-px w-24 bg-amber-600 mx-auto" />
        </div>
      </section>
    </div>
  );
};

export default AboutPage;