import { useState, useEffect } from 'react';
import { Star, Quote, Send, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-rose-500', 'bg-emerald-500',
  'bg-violet-500', 'bg-amber-500', 'bg-cyan-500', 'bg-primary-500',
];

const getInitials = (name) =>
  name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??';

const StarRow = ({ rating, interactive = false, onRate }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`w-4 h-4 transition-colors ${
          s <= rating ? 'fill-primary-400 text-primary-400' : 'text-gray-600'
        } ${interactive ? 'cursor-pointer hover:text-primary-300' : ''}`}
        onClick={() => interactive && onRate && onRate(s)}
      />
    ))}
  </div>
);

const TestimonialCard = ({ name, designation, message, rating, color }) => {
  const initials = getInitials(name);
  return (
    <div className="bg-gray-800/60 border border-white/5 rounded-2xl p-6 flex flex-col gap-4 hover:border-primary-500/30 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 group">
      <Quote className="w-7 h-7 text-primary-500/70 group-hover:text-primary-400 transition-colors" />
      <p className="text-gray-300 text-sm leading-relaxed flex-1">"{message}"</p>
      <StarRow rating={rating} />
      <div className="flex items-center gap-3 pt-1 border-t border-white/5">
        <div className={`w-10 h-10 rounded-full ${color || 'bg-primary-500'} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
          {initials}
        </div>
        <div>
          <p className="text-white font-bold text-sm">{name}</p>
          {designation && <p className="text-gray-500 text-[10px] uppercase tracking-wider">{designation}</p>}
        </div>
      </div>
    </div>
  );
};



const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', designation: '', message: '', rating: 5 });

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await api.get('/testimonials');
        setTestimonials(res.data);
      } catch (err) {
        console.error('Error fetching testimonials:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  // Dynamic stats calculated from real data
  const totalReviews = testimonials.length;
  const avgRating = totalReviews > 0
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / totalReviews).toFixed(1)
    : '0.0';
  const recommendPct = totalReviews > 0
    ? Math.round((testimonials.filter(t => t.rating >= 4).length / totalReviews) * 100)
    : 0;

  const dynamicStats = [
    { value: totalReviews > 0 ? `${totalReviews}+` : '—', label: 'Verified Reviews' },
    { value: totalReviews > 0 ? `${avgRating} / 5` : '—', label: 'Average Rating' },
    { value: totalReviews > 0 ? `${recommendPct}%` : '—', label: 'Would Recommend' },
    { value: '10+', label: 'Awards Won' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error('Please fill in your name and review.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/testimonials/submit', form);
      setSubmitted(true);
      setForm({ name: '', designation: '', message: '', rating: 5 });
      toast.success('Review submitted! It will appear after admin approval.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-gray-950 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            Guest Stories
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            What Our Guests <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-200">Say</span>
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            Authentic experiences from guests who've lived the Jhon Booking difference.
          </p>
        </div>

        {/* Testimonial Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {testimonials.map((t) => (
              <TestimonialCard key={t._id} {...t} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500 mb-20">
            <Quote className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No testimonials yet. Be the first to share your experience!</p>
          </div>
        )}

        {/* Stats Bar — dynamically calculated from real reviews */}
        <div className="border-t border-white/5 pt-12 mb-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {dynamicStats.map(({ value, label }) => (
              <div key={label} className="text-center group">
                <p className="text-3xl sm:text-4xl font-black text-primary-400 transition-all duration-300 group-hover:scale-110">{value}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Review Section */}
        <div className="bg-gray-900/60 border border-white/5 rounded-3xl p-8 sm:p-10 max-w-3xl mx-auto">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="w-14 h-14 text-primary-400 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-white mb-2">Thank You!</h3>
              <p className="text-gray-400 text-sm mb-6">Your review has been submitted and is awaiting approval. We appreciate your feedback!</p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl transition-all"
              >
                Submit Another Review
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-white">Share Your Experience</h3>
                  <p className="text-gray-500 text-xs mt-1">Your review will be published after moderation.</p>
                </div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="cursor-pointer px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  {showForm ? 'Cancel' : 'Write a Review'}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Your Name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. John Smith"
                        className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary-500 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Title / Role</label>
                      <input
                        type="text"
                        value={form.designation}
                        onChange={(e) => setForm(p => ({ ...p, designation: e.target.value }))}
                        placeholder="e.g. Business Traveller"
                        className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Your Rating *</label>
                    <StarRow rating={form.rating} interactive onRate={(s) => setForm(p => ({ ...p, rating: s }))} />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Your Review *</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                      rows={4}
                      placeholder="Tell us about your stay..."
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary-500 resize-none transition-all"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
