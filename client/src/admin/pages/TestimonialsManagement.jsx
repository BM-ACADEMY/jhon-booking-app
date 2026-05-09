import { useState } from 'react';
import { Plus, Edit2, Trash2, Star, ToggleLeft, ToggleRight, MessageSquare } from 'lucide-react';

const sampleTestimonials = [
  { _id: '1', name: 'James Carter', designation: 'Business Traveler', message: 'Exceptional service and beautiful rooms. The staff was incredibly friendly and attentive. Will definitely come back!', rating: 5, isActive: true },
  { _id: '2', name: 'Priya Sharma', designation: 'Honeymoon Couple', message: 'Perfect getaway spot. The suite was stunning and the view was breathtaking. Loved every moment of our stay.', rating: 5, isActive: true },
  { _id: '3', name: 'Thomas Lee', designation: 'Family Guest', message: 'Great value for money. Kids loved the pool area and the breakfast spread was amazing. Highly recommended!', rating: 4, isActive: false },
];

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
    ))}
  </div>
);

const TestimonialsManagement = () => {
  const [testimonials, setTestimonials] = useState(sampleTestimonials);
  const [showForm, setShowForm] = useState(false);

  const toggleActive = (id) => {
    setTestimonials((prev) => prev.map((t) => t._id === id ? { ...t, isActive: !t.isActive } : t));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{testimonials.filter((t) => t.isActive).length} active of {testimonials.length} total</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Testimonial
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">New Testimonial</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="text" placeholder="Guest Name" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400" />
            <input type="text" placeholder="Designation (e.g. Business Traveler)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400" />
            <textarea placeholder="Testimonial message..." rows={3} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 sm:col-span-2 resize-none" />
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Rating:</label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400">
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Stars</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 items-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {testimonials.map((t) => (
          <div key={t._id} className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-3 ${t.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold flex-shrink-0">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.designation}</p>
                </div>
              </div>
              <button onClick={() => toggleActive(t._id)} title={t.isActive ? 'Deactivate' : 'Activate'}>
                {t.isActive
                  ? <ToggleRight className="w-6 h-6 text-green-500" />
                  : <ToggleLeft className="w-6 h-6 text-gray-400" />}
              </button>
            </div>

            <StarRating rating={t.rating} />

            <p className="text-sm text-gray-600 leading-relaxed flex-1">
              <MessageSquare className="w-3.5 h-3.5 inline mr-1.5 text-gray-300" />
              {t.message}
            </p>

            <div className="flex gap-2 pt-2 border-t border-gray-50">
              <button className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-primary-300 hover:text-primary-600 text-gray-600 text-xs py-2 rounded-lg transition-colors">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-600 text-xs py-2 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsManagement;
