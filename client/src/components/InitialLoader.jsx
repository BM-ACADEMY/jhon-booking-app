import { motion } from 'framer-motion';
import { useEffect } from 'react';
import logoImg from '../assets/LogoBalified.png';

const InitialLoader = ({ onComplete }) => {
  useEffect(() => {
    // Inject stylesheet to force hide all scrollbars across html, body, and root elements
    const style = document.createElement('style');
    style.id = 'hide-loader-scrollbars';
    style.innerHTML = `
      html, body, #root {
        overflow: hidden !important;
        height: 100vh !important;
        width: 100vw !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Remove style tag on unmount
      const existingStyle = document.getElementById('hide-loader-scrollbars');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-white overflow-hidden will-change-opacity"
    >
      {/* Soft warm glowing ambient light behind logo */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[80px] pointer-events-none" />

      <motion.div 
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.6, ease: 'easeIn' }}
        className="relative flex flex-col items-center gap-6 max-w-sm px-6"
      >
        {/* Animated Logo Container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative flex items-center justify-center"
        >
          <img
            src={logoImg}
            alt="Balified Logo"
            className="h-28 w-auto object-contain relative z-10"
          />
        </motion.div>

        {/* Elegant Calligraphic/Classic Loading Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="mt-2 text-center"
        >
          <span 
            className="text-xl font-medium tracking-[0.2em] text-amber-900"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}
          >
            Loading...
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default InitialLoader;
