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
  // {
  //   image: socialIcon,
  //   title: "Social Atmosphere",
  //   desc: "Daily events, game nights, and vibrant common rooms.",
  // },
  {
    image: kitchenIcon,
    title: "Shared Kitchen",
    desc: "Fully equipped communal kitchen to cook your own meals and save money.",
  },
  // {
  //   image: lockerIcon,
  //   title: "Secure Lockers",
  //   desc: "Free large lockers in every room to keep your backpack and valuables safe.",
  // },
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

const FeaturesSection = () => (
  <section className="py-14 bg-[#ffffff]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* --- New Left-Aligned Header --- */}
      <div className="max-w-3xl mb-24 text-left">
        <h2 className="text-2xl sm:text-3xl font-medium text-gray-900 tracking-tight flex flex-wrap items-center gap-2">
          World-Class Amenities
        </h2>
        <p className="text-gray-500 mt-4">
          Everything you need for an unforgettable stay, all in one place.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-16">
        {features.map(({ image, title, desc }, index) => (
          <div
            key={index}
            className="group relative pt-16 pb-8 px-6 bg-white rounded-2xl border border-blue-100 text-center shadow-sm hover:shadow-md transition-all duration-300"
          >
            {/* Overlapping Icon Container */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[96px] h-[96px] bg-white rounded-full flex items-center justify-center border-8 border-white overflow-hidden transition-transform duration-300 shadow-md">
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

export default FeaturesSection;

