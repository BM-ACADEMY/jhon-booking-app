import { useState, useEffect } from 'react';
import { Mail, Trash2, Check, X, Loader2, MessageSquare, Clock, ShieldCheck, ChevronLeft, ChevronRight, Search, Eye, BookOpen, Inbox } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const PAGE_SIZE = 8;

const MessagesManagement = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/messages');
      setMessages(res.data);
    } catch (err) {
      toast.error('Failed to load contact messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const toggleReadStatus = async (id, currentRead) => {
    try {
      const res = await api.patch(`/messages/${id}/read`, { read: !currentRead });
      toast.success(currentRead ? 'Marked as unread' : 'Marked as read');
      
      // Update locally
      setMessages(prev => prev.map(m => m._id === id ? res.data : m));
      
      // If modal is open, update selected message state
      if (selectedMessage && selectedMessage._id === id) {
        setSelectedMessage(res.data);
      }
    } catch (err) {
      toast.error('Failed to update message status');
    }
  };

  const handleOpenMessage = async (msg) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      // Automatically mark as read when opened
      await toggleReadStatus(msg._id, false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/messages/${deleteTarget._id}`);
      toast.success('Message deleted successfully');
      setDeleteTarget(null);
      fetchMessages();
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  // Filter & Search Logic
  const filteredMessages = messages.filter(m => {
    // Filter
    if (filter === 'unread' && m.read) return false;
    if (filter === 'read' && !m.read) return false;

    // Search
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const nameMatch = m.name?.toLowerCase().includes(query);
      const emailMatch = m.email?.toLowerCase().includes(query);
      const subjectMatch = m.subject?.toLowerCase().includes(query);
      const messageMatch = m.message?.toLowerCase().includes(query);
      return nameMatch || emailMatch || subjectMatch || messageMatch;
    }

    return true;
  });

  const counts = {
    all: messages.length,
    unread: messages.filter(m => !m.read).length,
    read: messages.filter(m => m.read).length,
  };

  const totalPages = Math.ceil(filteredMessages.length / PAGE_SIZE);
  const paginated = filteredMessages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-gray-900">Contact Messages</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage and respond to website contact form submissions</p>
      </div>

      {/* Control Panel (Filter + Search) */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All', icon: Inbox },
            { key: 'unread', label: 'Unread', icon: Clock },
            { key: 'read', label: 'Read', icon: ShieldCheck },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                filter === key
                  ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                filter === key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
              }`}>{counts[key]}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, email, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-200 bg-gray-50 rounded-xl pl-9 pr-4 py-2 text-xs font-medium outline-none focus:border-primary-400 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white border border-gray-100 rounded-2xl">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">No contact messages found</p>
          <p className="text-xs text-gray-400 mt-1">Try clearing your filters or search query</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing <span className="font-bold text-gray-700">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredMessages.length)}</span> of <span className="font-bold text-gray-700">{filteredMessages.length}</span> messages
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginated.map((m) => (
              <div 
                key={m._id} 
                className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 relative overflow-hidden group ${
                  !m.read ? 'border-primary-100 bg-primary-50/5' : 'border-gray-100'
                }`}
              >
                {/* Unread Accent Bar */}
                {!m.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
                )}

                <div>
                  {/* Top Row: Date & Read/Unread badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(m.createdAt)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                      !m.read 
                        ? 'bg-primary-50 text-primary-700 border-primary-200' 
                        : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      {m.read ? 'Read' : 'New'}
                    </span>
                  </div>

                  {/* Subject & Message snippet */}
                  <h3 className="font-bold text-gray-900 text-sm md:text-base line-clamp-1 mb-1.5">{m.subject}</h3>
                  <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed mb-4">"{m.message}"</p>
                </div>

                {/* Bottom Row: Contact Info & Action Buttons */}
                <div className="pt-3 border-t border-gray-50 flex flex-col gap-3">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{m.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{m.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenMessage(m)}
                      className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-primary-50 hover:text-primary-600 text-gray-700 text-xs font-bold rounded-xl transition-all border border-gray-200 hover:border-primary-200"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                    
                    <button
                      onClick={() => toggleReadStatus(m._id, m.read)}
                      title={m.read ? 'Mark as Unread' : 'Mark as Read'}
                      className={`cursor-pointer p-2 rounded-xl border transition-all ${
                        m.read 
                          ? 'bg-gray-50 hover:bg-amber-50 hover:text-amber-600 text-gray-500 border-gray-200 hover:border-amber-200' 
                          : 'bg-primary-50 hover:bg-primary-100 text-primary-700 border-primary-200 hover:border-primary-300'
                      }`}
                    >
                      {m.read ? <BookOpen className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => setDeleteTarget(m)}
                      title="Delete Message"
                      className="cursor-pointer p-2 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-4">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="cursor-pointer p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-primary-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm font-bold">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`cursor-pointer w-9 h-9 rounded-xl text-xs font-black transition-all border ${
                      currentPage === page
                        ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/25'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-primary-300'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="cursor-pointer p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-primary-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Message View Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inquiry Message</span>
                <h2 className="font-black text-gray-900 text-lg leading-tight mt-0.5">{selectedMessage.subject}</h2>
              </div>
              <button 
                onClick={() => setSelectedMessage(null)} 
                className="cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Sender details card */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-bold text-gray-400 uppercase text-[9px] tracking-wider mb-0.5">Sender Name</p>
                <p className="font-bold text-gray-800 text-sm">{selectedMessage.name}</p>
              </div>
              <div>
                <p className="font-bold text-gray-400 uppercase text-[9px] tracking-wider mb-0.5">Email Address</p>
                <a href={`mailto:${selectedMessage.email}`} className="font-bold text-primary-600 hover:underline text-sm truncate block">
                  {selectedMessage.email}
                </a>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-gray-200/60">
                <p className="font-bold text-gray-400 uppercase text-[9px] tracking-wider mb-0.5">Date Received</p>
                <p className="font-medium text-gray-700">{formatDate(selectedMessage.createdAt)}</p>
              </div>
            </div>

            {/* Message content */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Message Content</label>
              <div className="bg-white border border-gray-150 rounded-2xl p-4 text-sm text-gray-700 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-serif italic shadow-inner">
                "{selectedMessage.message}"
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => toggleReadStatus(selectedMessage._id, selectedMessage.read)}
                className={`cursor-pointer flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  selectedMessage.read
                    ? 'bg-gray-50 hover:bg-amber-50 hover:text-amber-600 text-gray-600 border-gray-200 hover:border-amber-200'
                    : 'bg-primary-50 hover:bg-primary-100 text-primary-700 border-primary-200 hover:border-primary-300'
                }`}
              >
                {selectedMessage.read ? (
                  <>
                    <BookOpen className="w-4 h-4" /> Mark as Unread
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Mark as Read
                  </>
                )}
              </button>
              
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                className="cursor-pointer flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary-500/10"
              >
                <Mail className="w-4 h-4" /> Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-black text-gray-900">Delete Message?</h3>
            <p className="text-sm text-gray-500">This will permanently delete the message from <span className="font-bold text-gray-700">{deleteTarget.name}</span>.</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="cursor-pointer flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="cursor-pointer flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesManagement;
