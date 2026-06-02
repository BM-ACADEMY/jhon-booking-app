import { Loader2 } from 'lucide-react';

// Skeleton placeholder for a booking card while data is loading.
const BookingCardSkeleton = () => (
  <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col animate-pulse">
    {/* Image placeholder */}
    <div className="w-full h-52 bg-gray-200" />
    {/* Info placeholders */}
    <div className="p-6 flex-1 flex flex-col gap-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="flex space-x-2 mt-4">
        <div className="h-8 w-8 bg-gray-200 rounded-full" />
        <div className="h-8 w-8 bg-gray-200 rounded-full" />
        <div className="h-8 w-8 bg-gray-200 rounded-full" />
      </div>
    </div>
  </div>
);

export default BookingCardSkeleton;
