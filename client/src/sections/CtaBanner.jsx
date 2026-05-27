import { Link } from 'react-router-dom';
import { CalendarDays, Phone, ArrowRight, Sparkles, Percent, Coffee, CalendarCheck } from 'lucide-react';

const CtaBanner = () => (
  <section className="pt-6 pb-20 lg:pt-8 lg:pb-24 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Main Card Container (Square corners as requested) */}
      <div className="relative overflow-hidden rounded-none bg-slate-950 shadow-2xl shadow-slate-950/20">
        
        {/* Subtle Background Glows */}
        <div className="absolute top-0 left-1/4 -mt-20 w-96 h-96 bg-primary-500/50 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-20 w-80 h-80 bg-lime-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* High-End Background Image Split */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 z-0 opacity-30 lg:opacity-70 pointer-events-none select-none">
          <img 
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1600&auto=format&fit=crop" 
            alt="Luxury Resort Pool" 
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient overlays to blend it into the dark card background */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent hidden lg:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent lg:hidden" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-8 sm:p-12 lg:p-16 gap-10 lg:gap-16">
          
          {/* Left Side: Typography & Copy */}
          <div className="flex-1 text-center lg:text-left">
            {/* Glowing Tag/Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#d9f969] text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PREMIUM OFFER</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Escape to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d9f969] to-lime-400">Luxury</span>
            </h2>
            
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8">
              Book your stay directly with us to unlock a <span className="font-semibold text-white">20% discount</span>, complimentary gourmet breakfast, and flexible cancellation.
            </p>

            {/* Benefit Highlights */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 backdrop-blur-md">
                <Percent className="w-4 h-4 text-[#d9f969]" />
                <span className="text-xs sm:text-sm font-semibold text-slate-200">20% Direct Off</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 backdrop-blur-md">
                <Coffee className="w-4 h-4 text-[#d9f969]" />
                <span className="text-xs sm:text-sm font-semibold text-slate-200">Free Breakfast</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 backdrop-blur-md">
                <CalendarCheck className="w-4 h-4 text-[#d9f969]" />
                <span className="text-xs sm:text-sm font-semibold text-slate-200">Flexible Booking</span>
              </div>
            </div>
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-auto shrink-0 z-10">
            <Link
              to="/rooms"
              className="group relative flex items-center justify-center gap-3 bg-[#d9f969] hover:bg-[#cbf046] text-black font-bold uppercase tracking-wider px-8 py-4.5 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-[#d9f969]/30 hover:-translate-y-0.5 active:translate-y-0 overflow-hidden text-sm min-w-[200px]"
            >
              <CalendarDays className="w-5 h-5 text-black" />
              <span className="transition-transform duration-300 group-hover:-translate-x-2">Check Availability</span>
              <ArrowRight className="w-5 h-5 absolute right-6 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </Link>

            <a
              href="tel:+15550001"
              className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white font-bold uppercase tracking-wider px-8 py-4.5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 text-sm backdrop-blur-sm min-w-[200px]"
            >
              <Phone className="w-5 h-5 text-slate-300" />
              <span>Call to Book</span>
            </a>
          </div>
          
        </div>
      </div>
    </div>
  </section>
);

export default CtaBanner;
