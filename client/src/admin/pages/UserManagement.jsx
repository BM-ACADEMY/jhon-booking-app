import { useState, useEffect } from 'react';
import { Search, Shield, ShieldOff, UserX, UserCheck, Users, Plus, Edit2, Trash2, X, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
    isActive: true
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) error = 'Email is required';
      else if (!emailRegex.test(value)) error = 'Invalid email address';
    }
    if (name === 'phone') {
      const phoneRegex = /^\d{10}$/;
      if (!value) error = 'Phone is required';
      else if (!phoneRegex.test(value)) error = 'Phone must be 10 digits';
    }
    if (name === 'name' && !value) error = 'Name is required';
    if (name === 'password' && !editingUser && (!value || value.length < 6)) error = 'Password must be at least 6 characters';
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'phone' && value.length > 10) return;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (type !== 'checkbox') validateField(name, val);
  };

  const handleOpenModal = (user = null) => {
    setErrors({});
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '', 
        phone: user.phone ,
        role: user.role,
        isActive: user.isActive
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'user',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setEditingUser(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation
    const isNameValid = validateField('name', formData.name);
    const isEmailValid = validateField('email', formData.email);
    const isPasswordValid = validateField('password', formData.password);
    const isPhoneValid = validateField('phone', formData.phone);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isPhoneValid) return;

    try {
      setSubmitting(true);
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      fetchUsers();
      handleCloseModal();
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      setErrors(prev => ({ ...prev, submit: msg }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setSubmitting(true);
      await api.delete(`/users/${userToDelete._id}`);
      fetchUsers();
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting user');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRole = async (user) => {
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await api.patch(`/users/${user._id}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating role');
    }
  };

  const toggleStatus = async (user) => {
    try {
      await api.patch(`/users/${user._id}/status`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-64 shadow-sm focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none shadow-sm focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span className="flex items-center gap-1.5 font-medium">
          <Users className="w-4 h-4" />
          {users.length} total users
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary-500" />
            <p className="text-sm font-medium animate-pulse">Fetching users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['User', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                          {u.name[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{u.email}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{u.phone || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role === 'admin' && <Shield className="w-3 h-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleStatus(u)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${u.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 font-medium">
                      {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleRole(u)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${u.role === 'admin' ? 'hover:bg-gray-100 text-gray-400' : 'hover:bg-purple-50 text-purple-600'}`}
                          title={u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        >
                          {u.role === 'admin' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(u)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400 bg-gray-50/30">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium">No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {editingUser ? 'Edit User Details' : 'Register New User'}
              </h3>
              <button 
                disabled={submitting}
                onClick={handleCloseModal} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium animate-shake">
                  {errors.submit}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${errors.name ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-gray-200 focus:ring-4 focus:ring-primary-100 focus:border-primary-500'}`}
                  placeholder="Enter user's full name"
                />
                {errors.name && <p className="mt-1 text-[10px] text-red-500 font-bold italic">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${errors.email ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-gray-200 focus:ring-4 focus:ring-primary-100 focus:border-primary-500'}`}
                  placeholder="name@example.com"
                />
                {errors.email && <p className="mt-1 text-[10px] text-red-500 font-bold italic">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {editingUser ? 'New Password (Optional)' : 'Account Password'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${errors.password ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-gray-200 focus:ring-4 focus:ring-primary-100 focus:border-primary-500'}`}
                  placeholder="Minimum 6 characters"
                />
                {errors.password && <p className="mt-1 text-[10px] text-red-500 font-bold italic">{errors.password}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    maxLength="10"
                    required
                    className={`w-full px-3 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${errors.phone ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-gray-200 focus:ring-4 focus:ring-primary-100 focus:border-primary-500'}`}
                    placeholder="1234567890"
                  />
                  {errors.phone && <p className="mt-1 text-[10px] text-red-500 font-bold italic">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">User Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 cursor-pointer transition-all"
                  >
                    <option value="user">Standard User</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </div>
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer">Account is Active</label>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    editingUser ? 'Update User' : 'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete User?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-bold text-gray-700">{userToDelete?.name}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  disabled={submitting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Delete Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

