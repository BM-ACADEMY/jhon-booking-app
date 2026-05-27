"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../api"; // Custom Axios instance connected to your API backend

// Inline Star Icon component for easy rendering
const StarIcon = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-4 h-4 ${filled ? "text-amber-400" : "text-slate-200"}`}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// ==========================================
// 1. THE INTERNAL ROLLING COLUMN COMPONENT
// ==========================================
export const TestimonialsColumn = ({
  className,
  testimonials = [],
  duration = 10,
}) => {
  if (testimonials.length === 0) return null;

  return (
    <div className={className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...Array(2)].map((_, listIndex) => (
          <React.Fragment key={listIndex}>
            {testimonials.map(
              ({ text, image, name, role, color, rating, id }) => {
                // Extract initials for the dynamic text-avatar fallback
                const initials = name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={`${listIndex}-${id}`}
                    className="p-10 rounded-3xl border border-slate-100 bg-white shadow-xl shadow-blue-900/5 max-w-xs w-full text-slate-700 transition-all duration-300"
                  >
                    {/* Dynamic Rating Star Block */}
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, index) => (
                        <StarIcon key={index} filled={index < rating} />
                      ))}
                    </div>

                    <div className="text-sm md:text-base leading-relaxed">
                      {text}
                    </div>

                    <div className="flex items-center gap-3 mt-5">
                      {image ? (
                        <img
                          width={40}
                          height={40}
                          src={image}
                          alt={name}
                          className="h-10 w-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        /* Dynamic Initials Avatar matching your controller fallback */
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 border border-black/5 ${color || "bg-blue-600"}`}
                        >
                          {initials}
                        </div>
                      )}

                      <div className="flex flex-col min-w-0">
                        <div className="font-semibold tracking-tight text-sm leading-tight truncate text-slate-900">
                          {name}
                        </div>
                        <div className="text-xs leading-tight opacity-70 tracking-tight truncate mt-0.5 text-slate-500">
                          {role}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

// ==========================================
// 2. MAIN SECTION WRAPPER (DEFAULT EXPORT)
// ==========================================
const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        // Hits your public getActiveTestimonials controller route
        const response = await api.get("/testimonials");
        const rawData = Array.isArray(response.data) ? response.data : [];

        // Map DB keys (message, designation, avatar, rating) perfectly to visual layout attributes
        const formattedData = rawData.map((item) => ({
          id: item._id,
          name: item.name,
          role: item.designation || "Verified User",
          text: item.message,
          image: item.avatar,
          color: item.color, // Safe fallback colors managed by DB schema
          rating: item.rating || 5, // Fallback safely to 5 stars if field is empty
        }));

        setTestimonials(formattedData);
      } catch (error) {
        console.error("Failed to load active matrix stream:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Structural distribution logic for clean multi-marquee layouts
  const getColumns = () => {
    if (testimonials.length === 0) return { col1: [], col2: [], col3: [] };

    const col1 = testimonials.filter((_, idx) => idx % 3 === 0);
    const col2 = testimonials.filter((_, idx) => idx % 3 === 1);
    const col3 = testimonials.filter((_, idx) => idx % 3 === 2);

    return {
      col1: col1.length ? col1 : testimonials,
      col2: col2.length ? col2 : testimonials,
      col3: col3.length ? col3 : testimonials,
    };
  };

  const { col1, col2, col3 } = getColumns();

  return (
    <section className="relative py-24  text-slate-900 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header Block */}
        <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-slate-900 mb-4">
            What Our Guests Are Saying
          </h2>
          <p className="text-slate-600 text-sm md:text-lg">
            From comfortable rooms to peaceful stays, guests love our hotel for its hospitality, convenience, and relaxing experience.
          </p>
        </div>

        {/* Dynamic Matrix Stream Display */}
        {loading ? (
          <div className="flex flex-col justify-center gap-4 h-[400px] items-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium text-xs tracking-wide uppercase">
              Assembling layout pipeline...
            </p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm italic">
            No dynamic insights live on screen yet.
          </div>
        ) : (
          <div className="flex justify-center gap-6 h-[738px] overflow-hidden relative [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)]">
            <TestimonialsColumn
              testimonials={col1}
              duration={18}
              className="block"
            />

            <TestimonialsColumn
              testimonials={col2}
              duration={13}
              className="hidden md:block mt-12"
            />

            <TestimonialsColumn
              testimonials={col3}
              duration={22}
              className="hidden lg:block"
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
