import React from 'react';

// Skeleton placeholder for a Room Card while data is loading.
// Uses TailwindCSS utilities for a subtle pulsing animation.
// The design mirrors the layout of a real RoomCard component.

const RoomCardSkeleton = () => {
  return (
    <div className="group bg-white rounded-[32px] border border-gray-100 p-3 flex flex-col shadow-xl transition-all duration-350 animate-pulse">
      {/* Image placeholder */}
      <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden bg-gray-200" />

      {/* Content placeholder */}
      <div className="pt-4 pb-2 px-2 flex-1 flex flex-col text-left">
        {/* Category badge placeholder */}
        <div className="mb-2 h-5 w-20 bg-gray-200 rounded" />
        {/* Title placeholder */}
        <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
        {/* Address placeholder */}
        <div className="h-4 w-1/2 bg-gray-200 rounded mb-4" />
        {/* Rating stars placeholder */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="h-4 w-4 bg-gray-200 rounded-full" />
          <div className="h-4 w-4 bg-gray-200 rounded-full" />
          <div className="h-4 w-4 bg-gray-200 rounded-full" />
          <div className="h-4 w-4 bg-gray-200 rounded-full" />
          <div className="h-4 w-4 bg-gray-200 rounded-full" />
          <span className="text-xs text-gray-500 font-bold ml-2">(— Visitors)</span>
        </div>
        {/* Specs row placeholders */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 border-t border-gray-100 pt-3.5 mt-auto text-xs text-gray-500 font-bold">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gray-200 rounded-full" />
            <span className="bg-gray-200 h-4 w-12 inline-block rounded" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gray-200 rounded-full" />
            <span className="bg-gray-200 h-4 w-12 inline-block rounded" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gray-200 rounded-full" />
            <span className="bg-gray-200 h-4 w-12 inline-block rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCardSkeleton;
