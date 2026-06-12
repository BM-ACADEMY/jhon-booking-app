import { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Edit2, Utensils, Bell, Car, Sparkles, Heart, Loader2 } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

const categoryIcons = {
  'food': Utensils,
  'room services': Bell,
  'transport': Car,
  'Special Arrangements': Sparkles,
  'Guest Services': Heart
};

const AddonsManagement = () => {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [iconType, setIconType] = useState('food');
  const [submitting, setSubmitting] = useState(false);

  const fetchAddons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/addons');
      setAddons(res.data);
    } catch (err) {
      toast.error('Failed to fetch add-on services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddons();
  }, []);

  const openAddModal = () => {
    setEditingAddon(null);
    setName('');
    setPrice('');
    setIconType('food');
    setShowModal(true);
  };

  const openEditModal = (addon) => {
    setEditingAddon(addon);
    setName(addon.name);
    setPrice(addon.price);
    setIconType(addon.iconType);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required');
    if (!price || isNaN(price) || Number(price) < 0) return toast.error('Please enter a valid price');

    try {
      setSubmitting(true);
      const payload = { name, price: Number(price), iconType };

      if (editingAddon) {
        await api.put(`/addons/${editingAddon._id}`, payload);
        toast.success('Add-on service updated!');
      } else {
        await api.post('/addons', payload);
        toast.success('Add-on service created!');
      }
      setShowModal(false);
      fetchAddons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this add-on service?')) return;
    try {
      await api.delete(`/addons/${id}`);
      toast.success('Add-on service deleted successfully');
      fetchAddons();
    } catch (err) {
      toast.error('Failed to delete add-on service');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary-500" />
            Add-on Services Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage premium services available during checkout</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer border-none shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {/* Grid or Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : addons.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-500 font-medium">No add-on services found.</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add Service" to create your first add-on.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {addons.map((addon) => {
            const IconComponent = categoryIcons[addon.iconType] || Layers;
            return (
              <div
                key={addon._id}
                className="bg-white rounded-xl border border-gray-100 hover:border-primary-200 transition-all p-5 shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                      <IconComponent className="w-5 h-5 text-primary-600" />
                    </div>
                    <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider">
                      {addon.iconType}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{addon.name}</h3>
                  <p className="text-2xl font-black text-gray-900 mt-2">
                    ₹{addon.price.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-gray-50">
                  <button
                    onClick={() => openEditModal(addon)}
                    className="p-2 rounded-lg hover:bg-gray-50 border border-gray-100 text-gray-500 hover:text-primary-600 transition-colors cursor-pointer"
                    title="Edit Service"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(addon._id)}
                    className="p-2 rounded-lg hover:bg-red-50 border border-transparent text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete Service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="font-bold text-gray-800 text-lg">
                {editingAddon ? 'Edit Add-on Service' : 'Add New Service'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer border-none bg-transparent"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                  Service Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Breakfast Buffet, Airport Transfer"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 text-sm text-gray-800 font-medium"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g., 500"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 text-sm text-gray-800 font-medium"
                />
              </div>

              {/* Category Icon */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                  Category & Icon
                </label>
                <select
                  value={iconType}
                  onChange={(e) => setIconType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 text-sm text-gray-800 font-medium bg-white"
                >
                  <option value="food">Food & Dining (Utensils)</option>
                  <option value="room services">Room Service (Bell)</option>
                  <option value="transport">Transport / Travel (Car)</option>
                  <option value="Special Arrangements">Special Arrangements (Sparkles)</option>
                  <option value="Guest Services">Guest Services (Heart)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer border-none"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingAddon ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddonsManagement;
