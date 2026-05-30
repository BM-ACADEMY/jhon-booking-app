import { useState, useEffect } from 'react';
import { Mail, Trash2, Check, X, Loader2, Clock, ShieldCheck, ChevronLeft, ChevronRight, Search, Eye, BookOpen, Inbox, Reply } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const PAGE_SIZE = 10; // Kept as 8, or you can increase since cards are smaller now

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-rose-100 text-rose-700', 'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-700', 'bg-cyan-100 text-cyan-700',
];

const getInitials = (name) =>
  name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??';

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

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const toggleReadStatus = async (id, currentRead) => {
    try {
      const res = await api.patch(`/messages/${id}/read`, { read: !currentRead });
      toast.success(currentRead ? 'Marked as unread' : 'Marked as read');

      setMessages(prev => prev.map(m => m._id === id ? res.data : m));

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

  const filteredMessages = messages.filter(m => {
    if (filter === 'unread' && m.read) return false;
    if (filter === 'read' && !m.read) return false;

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
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8 font-sans">
      <div className="max-w-8xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Inbox</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and respond to guest inquiries.</p>
          </div>
        </div>

        {/* Control Panel */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-gray-200 pb-4">

          {/* Filter Tabs */}
          <div className="flex gap-2.5 flex-wrap">
            {[
              { key: 'all', label: 'All Messages', icon: Inbox },
              { key: 'unread', label: 'Unread', icon: Clock },
              { key: 'read', label: 'Read', icon: ShieldCheck },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  filter === key
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>{counts[key]}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, email, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-full pl-10 pr-9 py-2 text-xs text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-24 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <Mail className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 text-sm font-medium">No messages found.</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="text-xs text-gray-500 font-medium">
              Showing <span className="text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredMessages.length)}</span> of <span className="text-gray-900">{filteredMessages.length}</span> messages
            </div>

            {/* Changed grid layout to xl:grid-cols-3 and reduced gaps to make cards more compact */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginated.map((m, index) => {
                const initials = getInitials(m.name);
                const avatarCol = AVATAR_COLORS[index % AVATAR_COLORS.length];

                return (
                  <div
                    key={m._id}
                    className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3 relative group cursor-pointer ${
                      !m.read ? 'border-[#4F46E5]/30 ring-1 ring-[#4F46E5]/5' : 'border-gray-100'
                    }`}
                    onClick={() => handleOpenMessage(m)}
                  >
                    {/* Unread dot */}
                    {!m.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-[#4F46E5] rounded-full shadow-[0_0_6px_rgba(79,70,229,0.5)] animate-pulse" />
                    )}

                    {/* Sender Info */}
                    <div className="flex items-center gap-2.5 pr-6">
                      <div className={`w-8 h-8 rounded-full ${avatarCol} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{m.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{m.email}</p>
                      </div>
                    </div>

                    {/* Subject & Message snippet */}
                    <div className="flex-1">
                      <h3 className={`text-sm font-semibold truncate mb-1 ${!m.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {m.subject}
                      </h3>
                      <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                        {m.message}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                      <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(m.createdAt)}
                      </span>

                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleReadStatus(m._id, m.read); }}
                          title={m.read ? 'Mark as Unread' : 'Mark as Read'}
                          className={`p-1.5 rounded-md border transition-all ${
                            m.read
                              ? 'bg-gray-50 hover:bg-gray-100 text-gray-500 border-gray-200'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] border-indigo-100'
                          }`}
                        >
                          {m.read ? <BookOpen className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(m); }}
                          title="Delete Message"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {getPageNumbers().map((page, idx) =>
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-xs">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                        currentPage === page
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Message View Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">

              <div className="flex items-start justify-between p-5 border-b border-gray-100">
                <div>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded mb-2 inline-block">
                    Inquiry Details
                  </span>
                  <h2 className="font-semibold text-gray-900 text-lg leading-tight">{selectedMessage.subject}</h2>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-col sm:flex-row gap-4 justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">From</p>
                    <p className="font-semibold text-gray-900 text-sm">{selectedMessage.name}</p>
                    <a href={`mailto:${selectedMessage.email}`} className="text-[#4F46E5] hover:underline text-xs mt-0.5 block">
                      {selectedMessage.email}
                    </a>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Received</p>
                    <p className="font-medium text-gray-700 text-xs">{formatDate(selectedMessage.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Message</p>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                    {selectedMessage.message}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => toggleReadStatus(selectedMessage._id, selectedMessage.read)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all border flex items-center justify-center gap-1.5 ${
                    selectedMessage.read
                      ? 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] border-indigo-100'
                  }`}
                >
                  {selectedMessage.read ? <><BookOpen className="w-3.5 h-3.5" /> Mark Unread</> : <><Check className="w-3.5 h-3.5" /> Mark Read</>}
                </button>

                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="flex-1 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-medium rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Reply className="w-3.5 h-3.5" /> Reply via Email
                </a>
              </div>

            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-1">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Delete Message?</h3>
                <p className="text-xs text-gray-500 mt-1.5">This will permanently delete the message from <span className="font-medium text-gray-800">{deleteTarget.name}</span>. This action cannot be undone.</p>
              </div>
              <div className="flex gap-2.5 pt-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-all shadow-md"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MessagesManagement;
