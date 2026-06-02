// Skeleton placeholder that mirrors the WishlistPage room card layout.
const WishlistCardSkeleton = () => (
  <div className="bg-white rounded-[32px] border border-gray-100 p-3 flex flex-col shadow-xl animate-pulse">
    {/* Image placeholder */}
    <div className="relative aspect-[4/3] rounded-[24px] bg-gray-200 overflow-hidden">
      {/* Heart icon placeholder */}
      <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-300" />
      {/* Price badge placeholder */}
      <div className="absolute bottom-4 right-4 h-6 w-24 rounded-full bg-gray-300" />
    </div>

    {/* Content panel */}
    <div className="pt-4 pb-2 px-2 flex-1 flex flex-col">
      {/* Category badge */}
      <div className="mb-2">
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
      </div>
      {/* Title */}
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
      {/* Address */}
      <div className="h-4 w-1/2 bg-gray-200 rounded mb-3" />
      {/* Stars row */}
      <div className="flex items-center gap-1.5 mb-3">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 bg-gray-200 rounded-sm" />
          ))}
        </div>
        <div className="h-3 w-20 bg-gray-200 rounded" />
      </div>
      {/* Specs row */}
      <div className="flex items-center gap-4 border-t border-gray-100 pt-3.5 mt-auto">
        <div className="h-4 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-14 bg-gray-200 rounded" />
        <div className="h-4 w-14 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
);

export default WishlistCardSkeleton;
