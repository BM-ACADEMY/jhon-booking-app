import React from 'react';

// Skeleton placeholder for a testimonial card while data is loading.
// Mirrors the layout of a real testimonial card with pulsing animation.

const TestimonialsCardSkeleton = () => {
  return (
    <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-xl animate-pulse flex flex-col gap-4 max-w-xs w-full">
      {/* Avatar placeholder */}
      <div className="h-12 w-12 rounded-full bg-gray-200 mx-auto" />

      {/* Name placeholder */}
      <div className="h-4 w-24 bg-gray-200 rounded mx-auto" />

      {/* Role placeholder */}
      <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />

      {/* Rating stars placeholder */}
      <div className="flex items-center justify-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 w-4 bg-gray-200 rounded-full" />
        ))}
      </div>

      {/* Text placeholder */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
};

export default TestimonialsCardSkeleton;
