import { useRef, useEffect } from 'react';
import wifiIcon from "../assets/whychoose/wifi.png";
import socialIcon from "../assets/whychoose/users.png";
import kitchenIcon from "../assets/whychoose/kitchen.png";
import lockerIcon from "../assets/whychoose/locker.png";
import locationIcon from "../assets/whychoose/location.png";
import laundryIcon from "../assets/whychoose/laundry.png";
import bedIcon from "../assets/whychoose/bed.png";
import travelIcon from "../assets/whychoose/travel.png";

const features = [
  {
    image: wifiIcon,
    title: "Free Fast Wi-Fi",
    desc: "Reliable high-speed internet in all dorms and common areas.",
  },
  {
    image: kitchenIcon,
    title: "Shared Kitchen",
    desc: "Fully equipped communal kitchen to cook your own meals and save money.",
  },
  {
    image: locationIcon,
    title: "Location",
    desc: "Right in the city center, just steps away from major sights and public transit.",
  },
  {
    image: laundryIcon,
    title: "Laundry Facilities",
    desc: "On-site self-service washing machines and dryers available 24/7.",
  },
  {
    image: bedIcon,
    title: "Cozy Pod Beds",
    desc: "Thick mattresses, privacy curtains, individual power outlets, and reading lights.",
  },
  {
    image: travelIcon,
    title: "Travel & Tour Desk",
    desc: "Discounted local tours, pub crawls, and insider city tips from our staff.",
  },
];

const FeaturesSection = () => {
  const scrollRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          const cardWidth = scrollRef.current.children[0]?.clientWidth || 300;
          const gap = 24;
          scrollRef.current.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-14 bg-[#ffffff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* --- Left-Aligned Header --- */}
        <div className="max-w-3xl mb-8 text-center sm:text-left mx-auto sm:mx-0">
          <h2 className="text-2xl sm:text-3xl font-medium text-gray-900 tracking-tight flex flex-wrap items-center justify-center sm:justify-start gap-2">
            World-Class Amenities
          </h2>
          <p className="text-gray-500 mt-4">
            Everything you need for an unforgettable stay, all in one place.
          </p>
        </div>

        {/* Carousel Layout (Center Mode) */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-x-6 pb-8 pt-16 hide-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          {features.map(({ image, title, desc }, index) => (
            <div
              key={index}
              className="group relative flex-none w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-center pt-16 pb-8 px-6 bg-white rounded-2xl border border-blue-100 text-center shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Overlapping Icon Container */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[96px] h-[96px] bg-white rounded-full flex items-center justify-center border-8 border-white overflow-hidden transition-transform duration-300 shadow-md group-hover:scale-105">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

