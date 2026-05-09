import { useState } from 'react';
import { Search, Shield, ShieldOff, UserX, UserCheck, Users } from 'lucide-react';

const users = [
  { _id: '1', name: 'Alice Johnson', email: 'alice@mail.com', role: 'user', isActive: true, phone: '+1 555-1234', createdAt: '2026-01-15' },
  { _id: '2', name: 'Robert Smith', email: 'robert@mail.com', role: 'admin', isActive: true, phone: '+1 555-5678', createdAt: '2026-01-20' },
  { _id: '3', name: 'Emily Davis', email: 'emily@mail.com', role: 'user', isActive: false, phone: '+1 555-9012', createdAt: '2026-02-05' },
  { _id: '4', name: 'Michael Brown', email: 'michael@mail.com', role: 'user', isActive: true, phone: '+1 555-3456', createdAt: '2026-02-18' },
  { _id: '5', name: 'Sarah Wilson', email: 'sarah@mail.com', role: 'user', isActive: true, phone: '+1 555-7890', createdAt: '2026-03-01' },
];

const UserManagement = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-64">
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
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
          >
            <option value="All">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{users.length} total users</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['User', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0">
                        {u.name[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{u.email}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{u.phone}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {u.role === 'admin' && <Shield className="w-3 h-3" />}
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{u.createdAt}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        className={`p-1.5 rounded-lg transition-colors ${u.role === 'admin' ? 'hover:bg-gray-50 text-gray-500' : 'hover:bg-purple-50 text-purple-600'}`}
                        title={u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      >
                        {u.role === 'admin' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </button>
                      <button
                        className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-600'}`}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
