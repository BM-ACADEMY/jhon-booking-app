import { useState, useEffect } from 'react';
import { Search, Shield, ShieldOff, UserX, UserCheck, Users, Plus, Edit2, Trash2, Loader2, AlertTriangle, ChevronLeft, ChevronRight, History, Calendar, BedDouble, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="truncate">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
            <Users className="w-5 h-5 text-primary-600 shrink-0" />
            <span className="truncate">User Management</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            Manage your registered customer accounts and administrator privileges.
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="shadow text-xs flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Dynamic Statistics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <Card className="bg-gradient-to-br from-violet-50/50 to-white border border-gray-100 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-violet-600 truncate">Total Users</CardTitle>
            <Users className="w-4 h-4 text-violet-600 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 truncate">{totalUsersCount}</div>
            <p className="text-[10px] text-gray-400 mt-1 truncate">All registered accounts</p>
          </CardContent>
        </Card>

        {/* System Admins */}
        <Card className="bg-gradient-to-br from-purple-50/50 to-white border border-gray-100 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-purple-600 truncate">System Admins</CardTitle>
            <Shield className="w-4 h-4 text-purple-600 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 truncate">{adminCount}</div>
            <p className="text-[10px] text-gray-400 mt-1 truncate">Full management access</p>
          </CardContent>
        </Card>

        {/* Standard Users */}
        <Card className="bg-gradient-to-br from-blue-50/50 to-white border border-gray-100 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-blue-600 truncate">Standard Clients</CardTitle>
            <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 truncate">{standardCount}</div>
            <p className="text-[10px] text-gray-400 mt-1 truncate">Standard client accounts</p>
          </CardContent>
        </Card>

        {/* Active Accounts */}
        <Card className="bg-gradient-to-br from-emerald-50/50 to-white border border-gray-100 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 truncate">Active Accounts</CardTitle>
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 truncate">{activeCount}</div>
            <p className="text-[10px] text-gray-400 mt-1 truncate">Active & operational</p>
          </CardContent>
        </Card>

        {/* Inactive Accounts */}
        <Card className="bg-gradient-to-br from-red-50/50 to-white border border-gray-100 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-red-600 truncate">Inactive Accounts</CardTitle>
            <UserX className="w-4 h-4 text-red-600 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 truncate">{inactiveCount}</div>
            <p className="text-[10px] text-gray-400 mt-1 truncate">Suspended or deactivated</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1 flex-1 sm:max-w-xs shadow-sm w-full">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <Input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none p-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-slate-900 placeholder:text-gray-400"
          />
        </div>

        <div className="w-full sm:w-auto min-w-[130px]">
          <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val)}>
            <SelectTrigger className="h-10 bg-white text-slate-900 border border-gray-200">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto min-w-[130px]">
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
            <SelectTrigger className="h-10 bg-white text-slate-900 border border-gray-200">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden border border-gray-200 bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary-500" />
            <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Fetching users...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">User</TableHead>
                <TableHead className="whitespace-nowrap">Email</TableHead>
                <TableHead className="whitespace-nowrap">Phone</TableHead>
                <TableHead className="whitespace-nowrap">Role</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap">Joined</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((u) => (
                <TableRow key={u._id} className="group">
                  {/* Name fallback avatar */}
                  <TableCell className="max-w-[180px] truncate whitespace-nowrap" title={u.name}>
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                        {u.name ? u.name[0].toUpperCase() : 'U'}
                      </div>
                      <span className="font-semibold text-gray-900 truncate block">{u.name}</span>
                    </div>
                  </TableCell>

                  {/* Email */}
                  <TableCell className="max-w-[200px] truncate whitespace-nowrap text-slate-600 font-medium" title={u.email}>
                    {u.email}
                  </TableCell>

                  {/* Phone */}
                  <TableCell className="max-w-[120px] truncate whitespace-nowrap text-slate-600 font-medium" title={u.phone || '—'}>
                    {u.phone || '—'}
                  </TableCell>

                  {/* Role */}
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="uppercase text-[9px] tracking-wide font-bold px-2 py-0.5">
                      {u.role}
                    </Badge>
                  </TableCell>

                  {/* Status Toggle Button */}
                  <TableCell className="whitespace-nowrap">
                    <Badge
                      variant={u.isActive ? 'success' : 'destructive'}
                      onClick={() => toggleStatus(u)}
                      className="cursor-pointer uppercase text-[9px] tracking-wide font-bold px-2 py-0.5"
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>

                  {/* Joined Date */}
                  <TableCell className="whitespace-nowrap text-xs text-gray-500 font-semibold">
                    {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell className="text-right whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
                          <MoreHorizontal className="h-4 w-4 text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border border-slate-200">
                        <DropdownMenuLabel className="text-xs text-slate-500 font-bold uppercase tracking-wider">Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => fetchUserHistory(u)} className="cursor-pointer text-slate-800 focus:bg-slate-100">
                          <History className="mr-2 h-4 w-4 text-emerald-600" />
                          Booking History
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleRole(u)} className="cursor-pointer text-slate-800 focus:bg-slate-100">
                          {u.role === 'admin' ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4 text-slate-500" />
                              Remove Admin
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4 text-purple-600" />
                              Make Admin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem onClick={() => handleOpenModal(u)} className="cursor-pointer text-slate-800 focus:bg-slate-100">
                          <Edit2 className="mr-2 h-4 w-4 text-blue-600" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteRequest(u)} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                          <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400 bg-gray-50/10">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium">No users found matching your criteria</p>
          </div>
        )}
      </Card>

      {/* Pagination Controls */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-100 rounded-xl px-6 py-4 shadow-sm">
          <div className="text-xs text-slate-600 font-medium truncate max-w-full">
            Showing <span className="font-bold text-gray-800">{indexOfFirstItem + 1}</span> to{' '}
            <span className="font-bold text-gray-800">
              {Math.min(indexOfLastItem, filtered.length)}
            </span>{' '}
            of <span className="font-bold text-gray-800">{filtered.length}</span> users
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Show</span>
              <Select value={String(itemsPerPage)} onValueChange={(val) => setItemsPerPage(Number(val))}>
                <SelectTrigger className="h-8 w-[70px] bg-gray-50 text-slate-900 border border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent minWidth="80px">
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-50 p-1 border border-gray-100 rounded-xl shrink-0">
              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 text-xs text-gray-400 font-bold select-none">
                      ...
                    </span>
                  );
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8 text-xs p-0"
                  >
                    {page}
                  </Button>
                );
              })}

              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Form Dialog (Create / Edit) */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User Details' : 'Register New User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Modify credentials and permissions.' : 'Create a fresh customer or administrative log.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-left">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium">
                {errors.submit}
              </div>
            )}
            
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-slate-400">Full Name</Label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? 'border-red-400 focus-visible:ring-red-100' : 'text-slate-900 bg-white border border-gray-200'}
                placeholder="Enter user's full name"
              />
              {errors.name && <p className="text-[10px] text-red-500 font-semibold">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-slate-400">Email Address</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'border-red-400 focus-visible:ring-red-100' : 'text-slate-900 bg-white border border-gray-200'}
                placeholder="name@example.com"
              />
              {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-slate-400">
                {editingUser ? 'New Password (Optional)' : 'Account Password'}
              </Label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'border-red-400 focus-visible:ring-red-100' : 'text-slate-900 bg-white border border-gray-200'}
                placeholder="Minimum 6 characters"
              />
              {errors.password && <p className="text-[10px] text-red-500 font-semibold">{errors.password}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-slate-400">Phone Number</Label>
                <Input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength="10"
                  required
                  className={errors.phone ? 'border-red-400 focus-visible:ring-red-100' : 'text-slate-900 bg-white border border-gray-200'}
                  placeholder="1234567890"
                />
                {errors.phone && <p className="text-[10px] text-red-500 font-semibold">{errors.phone}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-slate-400">User Role</Label>
                <Select value={formData.role} onValueChange={(val) => setFormData(prev => ({ ...prev, role: val }))}>
                  <SelectTrigger className="h-9 bg-white text-slate-900 border border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label className="text-sm font-bold text-gray-700 cursor-pointer">Account is Active</Label>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                disabled={submitting}
                onClick={handleCloseModal}
                variant="outline"
                className="h-9"
              >
                Discard
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-9"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    Processing...
                  </>
                ) : (
                  editingUser ? 'Update User' : 'Create Account'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !open && setIsDeleteModalOpen(false)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete User?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-sm text-gray-600 text-left">
            <p className="truncate">
              Are you sure you want to delete <span className="font-bold text-gray-800">{userToDelete?.name}</span>?
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              disabled={submitting}
              onClick={() => setIsDeleteModalOpen(false)}
              variant="outline"
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              disabled={submitting}
              onClick={confirmDelete}
              variant="destructive"
              className="h-9 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
              Delete Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking History Dialog */}
      <Dialog open={!!historyUser} onOpenChange={(open) => !open && setHistoryUser(null)}>
        <DialogContent className="sm:max-w-[850px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              Booking History - {historyUser?.name}
            </DialogTitle>
            <DialogDescription className="truncate">
              {historyUser?.email} {historyUser?.phone ? `• ${historyUser.phone}` : ''}
            </DialogDescription>
          </DialogHeader>

          {historyUser && (
            <div className="space-y-4 pt-2 text-left">
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
                    <Card className="bg-white border border-gray-200 p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Total Bookings</p>
                      <h4 className="text-xl font-bold text-gray-800 mt-1 truncate">{userBookings.length}</h4>
                    </Card>
                    <Card className="bg-white border border-gray-200 p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Total Spent</p>
                      <h4 className="text-xl font-bold text-emerald-600 mt-1 truncate">
                        ₹{userBookings.reduce((sum, b) => {
                          if (b.status === 'cancelled') return sum;
                          const paid = b.paymentStatus === 'paid' ? b.totalAmount : (b.paidAmount || (b.totalAmount - (b.dueAmount || 0)) || 0);
                          return sum + paid;
                        }, 0).toLocaleString('en-IN')}
                      </h4>
                    </Card>
                    <Card className="bg-white border border-gray-200 p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Pending Balance</p>
                      <h4 className="text-xl font-bold text-amber-600 mt-1 truncate">
                        ₹{userBookings.reduce((sum, b) => {
                          if (b.status === 'cancelled') return sum;
                          const due = b.paymentStatus === 'paid' ? 0 : (b.dueAmount !== undefined ? b.dueAmount : (b.totalAmount - (b.paidAmount || 0)));
                          return sum + (due > 0 ? due : 0);
                        }, 0).toLocaleString('en-IN')}
                      </h4>
                    </Card>
                  </div>

                  {/* Booking list */}
                  <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Room/Category</TableHead>
                            <TableHead className="whitespace-nowrap">Check-In</TableHead>
                            <TableHead className="whitespace-nowrap">Check-Out</TableHead>
                            <TableHead className="whitespace-nowrap">Amount</TableHead>
                            <TableHead className="whitespace-nowrap">Payment</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="whitespace-nowrap">Booked On</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                        {userBookings.map((b) => (
                          <TableRow key={b._id}>
                            <TableCell className="max-w-[200px] truncate whitespace-nowrap">
                              <div className="flex items-center gap-3 truncate">
                                <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 shrink-0 border border-gray-250">
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
                                <div className="truncate">
                                  <p 
                                    className="text-xs font-bold text-gray-800 truncate block" 
                                    title={b.rooms && b.rooms.length > 0 ? b.rooms.map(r => r.name).join(', ') : b.room?.name}
                                  >
                                    {b.rooms && b.rooms.length > 0 ? b.rooms.map(r => r.name).join(', ') : b.room?.name || 'Deleted Room'}
                                  </p>
                                  <p className="text-[9px] font-bold text-primary-600 uppercase tracking-widest truncate block mt-0.5">
                                    {b.room?.category || '—'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs font-semibold text-gray-700">
                              {new Date(b.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs font-semibold text-gray-700">
                              {new Date(b.checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span className="text-xs font-bold text-gray-900">₹{b.totalAmount?.toLocaleString('en-IN')}</span>
                              {b.dueAmount > 0 && (
                                <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">
                                  Due: <span className="text-amber-600">₹{b.dueAmount?.toLocaleString('en-IN')}</span>
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant={b.paymentStatus === 'paid' ? 'success' : 'warning'} className="uppercase text-[9px] px-2 py-0.5">
                                {b.paymentStatus || 'unpaid'}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant={b.status === 'confirmed' ? 'success' : b.status === 'completed' ? 'secondary' : b.status === 'cancelled' ? 'destructive' : 'warning'} className="uppercase text-[9px] px-2 py-0.5">
                                {b.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-gray-500 font-semibold">
                              {new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setHistoryUser(null)} className="h-9 w-full sm:w-auto">
              Close History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
