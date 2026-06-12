import { useState, useEffect } from 'react';
import { Search, Shield, ShieldOff, UserX, UserCheck, Users, Plus, Edit2, Trash2, X, Loader2, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, History, Calendar, Clock, BedDouble } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const SERVER_URL = import.meta.env.VITE_BASE_URL;

const getImageUrl = (img) => {
  const u = img?.url || img;
  if (!u || typeof u !== 'string') return null;
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Booking History State
  const [historyUser, setHistoryUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  const fetchUserHistory = async (user) => {
    setHistoryUser(user);
    setLoadingHistory(true);
    try {
      const res = await api.get('/bookings');
      const filteredBookings = res.data.filter(b => b.user && b.user._id === user._id);
      setUserBookings(filteredBookings);
    } catch (err) {
      toast.error('Failed to fetch user booking history');
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset page to 1 when filters or page sizes change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter, itemsPerPage]);

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
        phone: user.phone || '',
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
    const nameMatch = u.name?.toLowerCase().includes(search.toLowerCase()) || false;
    const emailMatch = u.email?.toLowerCase().includes(search.toLowerCase()) || false;
    const phoneMatch = u.phone?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchSearch = nameMatch || emailMatch || phoneMatch;
    
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    const matchStatus = statusFilter === 'All' || 
                        (statusFilter === 'Active' && u.isActive) || 
                        (statusFilter === 'Inactive' && !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  // Stats Calculations
  const totalUsersCount = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const standardCount = users.filter(u => u.role === 'user').length;
  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.filter(u => !u.isActive).length;

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Statistics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users Card */}
        <div
          className="text-left bg-gradient-to-br from-violet-50 to-white border border-gray-200 rounded-2xl p-5 shadow-sm transition-all duration-300 group relative overflow-hidden w-full"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-violet-600 tracking-widest">Total Users</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{totalUsersCount}</h3>
            </div>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-medium">All registered accounts</p>
        </div>

        {/* System Admins Card */}
        <div
          className="text-left bg-gradient-to-br from-purple-50 to-white border border-gray-200 rounded-2xl p-5 shadow-sm transition-all duration-300 group relative overflow-hidden w-full"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest">System Admins</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{adminCount}</h3>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-medium">Full management access</p>
        </div>

        {/* Standard Users Card */}
        <div
          className="text-left bg-gradient-to-br from-blue-50 to-white border border-gray-200 rounded-2xl p-5 shadow-sm transition-all duration-300 group relative overflow-hidden w-full"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Standard Users</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{standardCount}</h3>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-medium">Standard client accounts</p>
        </div>

        {/* Active Accounts Card */}
        <div
          className="text-left bg-gradient-to-br from-emerald-50 to-white border border-gray-200 rounded-2xl p-5 shadow-sm transition-all duration-300 group relative overflow-hidden w-full"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Active Accounts</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{activeCount}</h3>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-medium">Active & operational</p>
        </div>

        {/* Inactive Accounts Card */}
        <div
          className="text-left bg-gradient-to-br from-red-50 to-white border border-gray-200 rounded-2xl p-5 shadow-sm transition-all duration-300 group relative overflow-hidden w-full"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-red-600 tracking-widest">Inactive Accounts</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{inactiveCount}</h3>
            </div>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-600 group-hover:scale-110 transition-transform">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-medium">Suspended or deactivated</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-64 shadow-sm">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm text-gray-600 placeholder-gray-400 outline-none w-full bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-sm text-gray-600 outline-none bg-transparent cursor-pointer font-bold"
            >
              <option value="All">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm text-gray-600 outline-none bg-transparent cursor-pointer font-bold"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer border-none outline-none"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-450">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary-500" />
            <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Fetching users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['User', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-4 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <span className="text-sm font-bold text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 font-medium">{u.email}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-650 font-semibold">{u.phone || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold border ${u.role === 'admin' ? 'bg-purple-150 text-purple-700 border-purple-200' : 'bg-blue-150 text-blue-700 border-blue-200'}`}>
                        {u.role === 'admin' && <Shield className="w-3 h-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleStatus(u)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer border ${u.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'}`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 font-semibold">
                      {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 transition-opacity">
                        <button
                          onClick={() => fetchUserHistory(u)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer"
                          title="Booking History"
                        >
                          <History className="w-4 h-4" />
                        </button>
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

      {/* Pagination Controls */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm">
          {/* Entries Indicator */}
          <div className="text-xs text-gray-500 font-medium">
            Showing <span className="font-bold text-gray-800">{indexOfFirstItem + 1}</span> to{' '}
            <span className="font-bold text-gray-800">
              {Math.min(indexOfLastItem, filtered.length)}
            </span>{' '}
            of <span className="font-bold text-gray-800">{filtered.length}</span> users
          </div>

          {/* Right Controls Group */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Show Entries Selector */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Show</span>
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <span>entries</span>
            </div>

            {/* Pagination Navigation */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 border border-gray-200/60 rounded-xl">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 text-xs text-gray-400 font-bold select-none">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-primary-600 text-white shadow shadow-primary-500/10'
                        : 'hover:bg-white text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Booking History Modal */}
      {historyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" />
                  Booking History - {historyUser.name}
                </h3>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  {historyUser.email} {historyUser.phone ? `• ${historyUser.phone}` : ''}
                </p>
              </div>
              <button 
                onClick={() => setHistoryUser(null)} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-450">
                  <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary-500" />
                  <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Loading booking history...</p>
                </div>
              ) : userBookings.length === 0 ? (
                <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-700">No Bookings Found</p>
                  <p className="text-xs text-gray-400 mt-1">This user has not booked any rooms yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-left">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Bookings</p>
                      <h4 className="text-xl font-bold text-gray-800 mt-1">{userBookings.length}</h4>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-left">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Spent</p>
                      <h4 className="text-xl font-bold text-emerald-600 mt-1">
                        ₹{userBookings.reduce((sum, b) => {
                          if (b.status === 'cancelled') return sum;
                          const paid = b.paymentStatus === 'paid' ? b.totalAmount : (b.paidAmount || (b.totalAmount - (b.dueAmount || 0)) || 0);
                          return sum + paid;
                        }, 0).toLocaleString('en-IN')}
                      </h4>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-left">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Balance</p>
                      <h4 className="text-xl font-bold text-amber-600 mt-1">
                        ₹{userBookings.reduce((sum, b) => {
                          if (b.status === 'cancelled') return sum;
                          const due = b.paymentStatus === 'paid' ? 0 : (b.dueAmount !== undefined ? b.dueAmount : (b.totalAmount - (b.paidAmount || 0)));
                          return sum + (due > 0 ? due : 0);
                        }, 0).toLocaleString('en-IN')}
                      </h4>
                    </div>
                  </div>

                  {/* Booking list */}
                  <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {['Room/Category', 'Check-In', 'Check-Out', 'Amount', 'Payment', 'Status', 'Booked On'].map((h) => (
                            <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-left">
                        {userBookings.map((b) => (
                          <tr key={b._id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                  {((b.rooms && b.rooms[0]?.images?.[0]) || b.room?.images?.[0]) ? (
                                    <img 
                                      src={getImageUrl((b.rooms && b.rooms[0]?.images?.[0]) ? b.rooms[0].images[0] : b.room?.images?.[0])} 
                                      alt="" 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <BedDouble className="w-4 h-4 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p 
                                    className="text-sm font-bold text-gray-800 truncate max-w-[220px]" 
                                    title={b.rooms && b.rooms.length > 0 ? b.rooms.map(r => r.name).join(', ') : b.room?.name}
                                  >
                                    {b.rooms && b.rooms.length > 0 ? b.rooms.map(r => r.name).join(', ') : b.room?.name || 'Deleted Room'}
                                  </p>
                                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mt-0.5">
                                    {b.room?.category || '—'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-xs font-semibold text-gray-700">
                              {new Date(b.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3.5 text-xs font-semibold text-gray-700">
                              {new Date(b.checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3.5">
                              <div>
                                <p className="text-xs font-bold text-gray-900">₹{b.totalAmount?.toLocaleString('en-IN')}</p>
                                {b.dueAmount > 0 && (
                                  <p className="text-[9px] text-gray-400 font-semibold mt-0.5">
                                    Due: <span className="text-amber-600">₹{b.dueAmount?.toLocaleString('en-IN')}</span>
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold border ${
                                b.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-100' :
                                b.paymentStatus === 'partially_paid' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-red-50 text-red-700 border-red-100'
                              }`}>
                                {b.paymentStatus || 'unpaid'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold border ${
                                b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                b.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                b.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-gray-455 font-semibold">
                              {new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setHistoryUser(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-all cursor-pointer border-none outline-none shadow-sm"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

