"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import testimonialImg from "../assets/testimonial.png";

// Inline Star Icon component
const StarIcon = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-6 h-6 ${filled ? "text-amber-400" : "text-amber-400/30"}`}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await api.get("/testimonials");
        const rawData = Array.isArray(response.data) ? response.data : [];

        const formattedData = rawData.map((item) => ({
          id: item._id,
          name: item.name,
          role: item.designation || "Verified User",
          text: item.message,
          rating: item.rating || 5,
        }));

        setTestimonials(formattedData);
      } catch (error) {
        console.error("Failed to load testimonials:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // 15 second interval slide change
  useEffect(() => {
    if (testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };


  return (
    <section className="py-16 md:py-24 bg-blue-50/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Container with soft gradient background */}
        <div className="bg-gradient-to-br from-[#e0f4f8] to-[#fdecf3] rounded-[2rem] md:rounded-[3rem] flex flex-col md:flex-row relative shadow-sm md:min-h-[400px]">
          
          {/* Left Side: Static Fixed Image */}
          <div className="w-full md:w-[45%] h-[250px] sm:h-[300px] md:h-auto md:min-h-[400px] relative flex items-end justify-center">
            <img 
              src={testimonialImg} 
              alt="Happy Guest" 
              className="absolute bottom-0 w-[115%] h-[115%] sm:h-[120%] md:w-[110%] md:h-[125%] lg:h-[130%] object-contain object-bottom"
            />
          </div>

          {/* Right Side: Dynamic Sliding Reviews */}
          <div className="w-full md:w-[55%] p-6 sm:p-8 md:p-10 lg:p-16 relative min-h-[280px] sm:min-h-[300px] md:min-h-0 flex flex-col justify-center">
            
            {/* Quote Icon */}
            <div className="mb-4 md:mb-6">
              <Quote className="w-10 h-10 md:w-14 md:h-14 text-teal-300 fill-teal-300 opacity-60 transform rotate-180" />
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mb-4 md:mb-6">Testimonial</h3>

            <div className="relative flex-1">
              <AnimatePresence mode="wait">
                {testimonials.length > 0 && !loading ? (
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col h-full"
                  >
                    <p className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed mb-4 md:mb-6">
                      {testimonials[currentIndex].text?.length > 200 
                        ? testimonials[currentIndex].text.substring(0, 200) + "..." 
                        : testimonials[currentIndex].text}
                    </p>
                    
                    <div className="mt-auto">
                      <p className="text-sm font-bold text-[#0f172a] uppercase tracking-wide mb-2">
                        - {testimonials[currentIndex].name}
                      </p>
                      <div className="flex gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} filled={i < testimonials[currentIndex].rating} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : loading ? (
                  <div className="text-gray-500 animate-pulse font-medium text-sm sm:text-base">Loading reviews...</div>
                ) : (
                  <div className="text-gray-500 text-sm sm:text-base">No testimonials yet.</div>
                )}
              </AnimatePresence>
            </div>

            {/* Manual Navigation Controls */}
            {testimonials.length > 1 && !loading && (
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-all"
                  aria-label="Previous Testimonial"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-all"
                  aria-label="Next Testimonial"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
