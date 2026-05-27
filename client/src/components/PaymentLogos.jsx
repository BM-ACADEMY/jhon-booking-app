import React from 'react';

export const UpiLogo = () => (
  <svg 
    className="h-5 w-auto text-slate-400 hover:text-white transition-colors duration-300 filter drop-shadow-sm" 
    viewBox="0 0 120 40" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <g transform="skewX(-12) translate(5, 0)">
      {/* U */}
      <path d="M10 8h5.5v14c0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5V8H30v14c0 5.5-4.5 10-10 10s-10-4.5-10-10V8z" fill="currentColor" />
      {/* P */}
      <path d="M38 8h9.5c4.5 0 8 3.5 8 8s-3.5 8-8 8H43.5v6H38V8zm5.5 11H47c1.4 0 2.5-1.1 2.5-2.5S48.4 14 47 14h-3.5v5z" fill="currentColor" />
      {/* I */}
      <rect x="61" y="8" width="5.5" height="22" fill="currentColor" />
      {/* Arrow/Chevron Graphic */}
      <path d="M74 30 L85 8 L91 8 L80 30 Z" fill="#ea580c" />
      <path d="M84 30 L95 8 L101 8 L90 30 Z" fill="#22c55e" />
    </g>
  </svg>
);

export const GPayLogo = () => (
  <svg 
    className="h-5 w-auto text-slate-400 hover:text-white transition-colors duration-300 filter drop-shadow-sm" 
    viewBox="0 0 95 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Google G Logo */}
    <g transform="translate(2, 4)">
      <path d="M12.5 12.3c0-.8-.1-1.6-.2-2.3H6v4.4h3.7c-.2 1-.7 1.8-1.5 2.4v3h2.4c1.4-1.3 2.9-3.2 2.9-7.5z" fill="#4285F4" />
      <path d="M6 19c1.8 0 3.2-.6 4.3-1.6l-2.4-3c-.6.4-1.2.6-1.9.6-1.7 0-3.1-1.1-3.6-2.6H.1v2.1C1.2 17.5 3.4 19 6 19z" fill="#34A853" />
      <path d="M2.4 12.4c-.1-.4-.2-.8-.2-1.4s.1-1 .2-1.4V7.5H.1C0 8.7 0 10 0 11s0 2.3.1 3.5l2.3-2.1z" fill="#FBBC05" />
      <path d="M6 5c1 0 1.9.3 2.6 1l2-2C9.4 3.1 7.8 2.5 6 2.5 3.4 2.5 1.2 4 0.1 7.2l2.3 2.1C2.9 6.1 4.3 5 6 5z" fill="#EA4335" />
    </g>
    {/* Pay Text */}
    <g transform="translate(18, 0)" fill="currentColor">
      <path d="M14 6.5h3.5c2.2 0 4 1.6 4 3.8s-1.8 3.8-4 3.8H16V18h-2V6.5zm3.5 5.8c1.1 0 2-0.7 2-2s-0.9-2-2-2H16v4h1.5z" />
      <path d="M30.2 11c1.2 0 2.2.7 2.5 1.6V11.2h1.8v6.8h-1.8v-.8c-.3.9-1.2 1.6-2.5 1.6-2 0-3.5-1.5-3.5-3.8s1.5-4 3.5-4zm.4 6c1.2 0 2-0.8 2-2.2s-0.8-2.2-2-2.2-2 .8-2 2.2 0.8 2.2 2 2.2z" />
      <path d="M38.5 11.2l2.3 5.3 2.3-5.3h2l-3.5 7.8c-.4.9-.9 1.4-1.8 1.4h-.7v-1.6h.4c.4 0 .7-.2.9-.5l.5-1-3.5-6.1h2.1z" />
    </g>
  </svg>
);

export const RuPayLogo = () => (
  <svg 
    className="h-5 w-auto filter drop-shadow-sm transition-transform duration-300 hover:scale-105" 
    viewBox="0 0 100 30" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Card background to match credit card container style */}
    <rect width="100" height="30" rx="5" fill="#ffffff" />
    {/* RuPay graphic inside */}
    <g transform="translate(8, 4) scale(0.85)">
      {/* RuPay italicized custom path */}
      {/* Ru */}
      <path d="M6 3.5h7c2 0 3.5.5 4.2 1.3.7.8 1 1.8 1 3.2 0 1.8-.8 3.1-2.2 3.8l3.5 6.2H14l-2.8-5.2H9.2v5.2H5.2V3.5zm4 3.5v3.5h2.5c1 0 1.8-.8 1.8-1.8 0-1-.8-1.7-1.8-1.7H10z" fill="#0c2340" />
      <path d="M22.5 10.5c0-2.8 2.2-4.5 5.5-4.5s5.5 1.7 5.5 4.5v7.5h-3.8v-1.5c-.5.8-1.5 1.8-3.2 1.8-2.6 0-4-1.5-4-3.8s1.6-3.8 4-3.8c1.5 0 2.6.8 3 1.5v-1.7c0-1.2-1-1.8-2.5-1.8s-2.5.6-2.5 1.8h-4zm5.5 4.2c-1 0-1.8.6-1.8 1.5 0 .8.8 1.5 1.8 1.5s1.8-.7 1.8-1.5c0-.9-.8-1.5-1.8-1.5z" fill="#0c2340" />
      {/* Pay */}
      <path d="M36.5 6.2h3.8v1.5c.5-.8 1.5-1.8 3.2-1.8 2.8 0 4.5 1.8 4.5 4.8s-1.7 4.8-4.5 4.8c-1.5 0-2.6-.8-3.2-1.5v5.5h-3.8V6.2zm4.5 4.5c0 1.2 1 1.8 2.2 1.8s2.2-.6 2.2-1.8-1-1.8-2.2-1.8-2.2.6-2.2 1.8z" fill="#e95d2a" />
      <path d="M50.2 10.5c0-2.8 2.2-4.5 5.5-4.5s5.5 1.7 5.5 4.5v7.5h-3.8v-1.5c-.5.8-1.5 1.8-3.2 1.8-2.6 0-4-1.5-4-3.8s1.6-3.8 4-3.8c1.5 0 2.6.8 3 1.5v-1.7c0-1.2-1-1.8-2.5-1.8s-2.5.6-2.5 1.8h-4zm5.5 4.2c-1 0-1.8.6-1.8 1.5 0 .8.8 1.5 1.8 1.5s1.8-.7 1.8-1.5c0-.9-.8-1.5-1.8-1.5z" fill="#e95d2a" />
      <path d="M62.5 6.2h4l2.5 6.2 2.5-6.2h4l-5.5 12.2h-4l1.5-3.2-5-9z" fill="#00a25b" />
      {/* RuPay stripe slash on the left */}
      <path d="M-5 18L-1 3h3.5L-1.5 18H-5z" fill="#e95d2a" />
      <path d="M-8 18L-4 3h2.5L-5.5 18H-8z" fill="#00a25b" />
    </g>
  </svg>
);

export const VisaLogo = () => (
  <svg 
    className="h-4 w-auto text-slate-400 hover:text-white transition-colors duration-300 filter drop-shadow-sm" 
    viewBox="0 0 80 25" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M10 2L6.8 18h4.2L14.2 2H10zm18.5 0h-3.8c-.8 0-1.5.5-1.8 1.2L16.2 18h4.4l.9-2.5h5.4l.5 2.5H31.3l-2.8-16zm-5.8 10l1.8-5 1 5h-2.8zm19.8-6.8c-.6-.4-1.7-.8-3-.8-3.3 0-5.6 1.8-5.6 4.3 0 1.9 1.7 2.9 3 3.5 1.3.6 1.8 1 1.8 1.6 0 .9-1.1 1.3-2.1 1.3-1.4 0-2.2-.2-3.4-.8l-.5-.2-.5 3.3c.9.4 2.6.8 4.4.8 3.5 0 5.8-1.7 5.8-4.4 0-1.5-.9-2.6-2.9-3.6-1.3-.7-2.1-1.1-2.1-1.8 0-.6.7-1.3 2.2-1.3 1.2 0 2.1.3 2.7.6l.3.2.5-3.3zM53 2l-3.3 11-1.3-8.8C48 3 46.8 2 45 2H39v.8c1.8.4 3.9 1.1 5.2 1.8l3.7 13.4H52.2L58.2 2H53z" fill="currentColor" />
  </svg>
);

export const MasterCardLogo = () => (
  <svg 
    className="h-6 w-auto transition-transform duration-300 hover:scale-105" 
    viewBox="0 0 50 30" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="15" r="12" fill="#eb001b" fillOpacity="0.9" />
    <circle cx="30" cy="15" r="12" fill="#ff5f00" fillOpacity="0.9" />
    <path d="M23 7.8c-2 2-3.2 4.7-3.2 7.7s1.2 5.7 3.2 7.7c2-2 3.2-4.7 3.2-7.7s-1.2-5.7-3.2-7.7z" fill="#f79e1b" />
  </svg>
);
