import { useState, useEffect } from 'react';
import {
  Mail, Trash2, Check, Loader2, Clock, ChevronLeft, ChevronRight,
  Search, Eye, Inbox, Reply, MoreVertical, AlertTriangle, RefreshCw, Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  Table, TableHeader, TableBody, TableHead,
  TableRow, TableCell
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

const PAGE_SIZE = 10;

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
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
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Reply State
  const [replyTarget, setReplyTarget] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

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

  const handleOpenReplyModal = (msg) => {
    setReplyTarget(msg);
    setReplySubject(`Re: ${msg.subject || 'Inquiry'}`);
    setReplyText(`Hello ${msg.name},\n\nThank you for contacting us regarding "${msg.subject}".\n\n`);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return toast.error('Reply message cannot be empty');

    try {
      setSendingReply(true);
      await api.post(`/messages/${replyTarget._id}/reply`, {
        replySubject,
        replyText
      });
      toast.success(`Reply email sent successfully to ${replyTarget.email}`);
      setReplyTarget(null);
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply email');
    } finally {
      setSendingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/messages/${deleteTarget._id}`);
      toast.success('Message deleted successfully');
      setDeleteTarget(null);
      fetchMessages();
    } catch (err) {
      toast.error('Failed to delete message');
    } finally {
      setDeleting(false);
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

  const totalPages = Math.ceil(filteredMessages.length / PAGE_SIZE) || 1;
  const paginated = filteredMessages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <div className="truncate">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
            <Mail className="w-5 h-5 text-primary-600 shrink-0" />
            <span className="truncate">Contact Form Submissions</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            View and respond to inquiries submitted by website visitors via the Contact Us form.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMessages}
            disabled={loading}
            className="h-9 gap-1.5 text-xs font-medium border-gray-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Dynamic Statistics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Inquiries */}
        <Card className="bg-gradient-to-br from-violet-50/50 to-white border border-gray-200 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-violet-600 truncate">Total Submissions</CardTitle>
            <Inbox className="w-4 h-4 text-violet-600 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 truncate">{counts.all}</div>
            <p className="text-[10px] text-gray-400 mt-1 truncate">All contact form messages</p>
          </CardContent>
        </Card>

        {/* Unread Messages */}
        <Card className="bg-gradient-to-br from-amber-50/50 to-white border border-gray-200 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-amber-600 truncate">Unread Inquiries</CardTitle>
            <Mail className="w-4 h-4 text-amber-600 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-700 truncate">{counts.unread}</div>
            <p className="text-[10px] text-amber-500 font-medium mt-1 truncate">Needs admin review</p>
          </CardContent>
        </Card>

        {/* Read Messages */}
        <Card className="bg-gradient-to-br from-emerald-50/50 to-white border border-gray-200 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 truncate">Reviewed Messages</CardTitle>
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 truncate">{counts.read}</div>
            <p className="text-[10px] text-gray-400 mt-1 truncate">Marked as read</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-gray-200 rounded-2xl shadow-sm bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search sender, email, subject, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs sm:text-sm rounded-xl border-gray-300 focus:ring-0"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl shrink-0 border border-gray-200 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border-none cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-900 bg-transparent'
                }`}
              >
                All ({counts.all})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                  filter === 'unread'
                    ? 'bg-white text-amber-700 shadow-sm border border-gray-200 font-bold'
                    : 'text-gray-500 hover:text-gray-900 bg-transparent'
                }`}
              >
                Unread ({counts.unread})
                {counts.unread > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />}
              </button>
              <button
                type="button"
                onClick={() => setFilter('read')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border-none cursor-pointer ${
                  filter === 'read'
                    ? 'bg-white text-emerald-700 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-900 bg-transparent'
                }`}
              >
                Read ({counts.read})
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Messages Table */}
      <Card className="border border-gray-200 rounded-2xl shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 font-semibold text-sm sm:text-base">No contact messages found</p>
              <p className="text-xs text-gray-400 mt-1">Try clearing your search query or filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto w-full">
                <Table className="min-w-[650px] w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                      <TableHead className="py-3.5 px-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Sender</TableHead>
                      <TableHead className="py-3.5 px-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Subject & Message</TableHead>
                      <TableHead className="py-3.5 px-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Date & Time</TableHead>
                      <TableHead className="py-3.5 px-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Status</TableHead>
                      <TableHead className="py-3.5 px-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-right w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((msg, idx) => {
                      const avatarClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                      return (
                        <TableRow
                          key={msg._id}
                          className={`hover:bg-gray-50/70 transition-colors cursor-pointer ${
                            !msg.read ? 'bg-amber-50/20 font-medium' : ''
                          }`}
                          onClick={() => handleOpenMessage(msg)}
                        >
                          {/* Sender */}
                          <TableCell className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${avatarClass} shrink-0`}>
                                {getInitials(msg.name)}
                              </div>
                              <div className="truncate max-w-[160px] sm:max-w-[200px]">
                                <p className={`text-xs sm:text-sm ${!msg.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'} truncate`}>
                                  {msg.name}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate">{msg.email}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Subject & Preview */}
                          <TableCell className="py-3.5 px-4">
                            <div className="max-w-[220px] sm:max-w-[320px]">
                              <p className={`text-xs sm:text-sm ${!msg.read ? 'font-bold text-gray-900' : 'font-medium text-gray-800'} truncate`} title={msg.subject}>
                                {msg.subject}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate" title={msg.message}>
                                {msg.message}
                              </p>
                            </div>
                          </TableCell>

                          {/* Date */}
                          <TableCell className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {formatDate(msg.createdAt)}
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            {!msg.read ? (
                              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Unread
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Read
                              </Badge>
                            )}
                          </TableCell>

                          {/* Actions Vertical 3-Dot Dropdown */}
                          <TableCell className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => handleOpenMessage(msg)} className="gap-2 text-xs font-medium cursor-pointer">
                                  <Eye className="w-3.5 h-3.5 text-gray-500" />
                                  View Message
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenReplyModal(msg)}
                                  className="gap-2 text-xs font-medium text-primary-600 cursor-pointer font-semibold"
                                >
                                  <Reply className="w-3.5 h-3.5 text-primary-600" />
                                  Reply via Email
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleReadStatus(msg._id, msg.read)} className="gap-2 text-xs font-medium cursor-pointer">
                                  <Check className="w-3.5 h-3.5 text-gray-500" />
                                  Mark as {msg.read ? 'Unread' : 'Read'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteTarget(msg)}
                                  className="gap-2 text-xs font-medium text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                  Delete Message
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Shadcn UI Styled Responsive Pagination Footer */}
              {filteredMessages.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 p-4 border-t border-gray-200 bg-gray-50/50 rounded-b-2xl">
                  <p className="text-xs text-gray-500 font-medium text-center sm:text-left">
                    Showing <span className="font-semibold text-gray-900">{((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredMessages.length)}</span> of <span className="font-semibold text-gray-900">{filteredMessages.length}</span> messages
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 gap-1 text-xs font-semibold px-2.5 border-gray-300"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 px-1">
                      {getPageNumbers().map((page, idx) => (
                        typeof page === 'number' ? (
                          <Button
                            key={idx}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`h-8 w-8 p-0 text-xs font-bold ${currentPage !== page ? 'border-gray-300' : ''}`}
                          >
                            {page}
                          </Button>
                        ) : (
                          <span key={idx} className="px-1 text-xs text-gray-400">...</span>
                        )
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 gap-1 text-xs font-semibold px-2.5 border-gray-300"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Message View Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-xl rounded-2xl p-6 border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-lg font-bold text-gray-900 pr-4">
              <span>{selectedMessage?.subject}</span>
              {selectedMessage && (
                <Badge variant="secondary" className={selectedMessage.read ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                  {selectedMessage.read ? 'Read' : 'Unread'}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Submitted on {formatDate(selectedMessage?.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4 py-2">
              {/* Sender Details */}
              <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-200">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {getInitials(selectedMessage.name)}
                </div>
                <div className="truncate">
                  <p className="font-bold text-gray-900 text-sm truncate">{selectedMessage.name}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedMessage.email}</p>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Message Content</p>
                <div className="p-4 bg-gray-50/60 border border-gray-200 rounded-xl text-sm text-gray-800 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0">
                  {selectedMessage.message}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toggleReadStatus(selectedMessage._id, selectedMessage.read)}
              className="border-gray-300 focus:ring-0 focus-visible:ring-0 outline-none"
            >
              Mark as {selectedMessage?.read ? 'Unread' : 'Read'}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const msg = selectedMessage;
                setSelectedMessage(null);
                handleOpenReplyModal(msg);
              }}
              className="gap-1.5 bg-primary-600 hover:bg-primary-700 text-white focus:ring-0 focus-visible:ring-0 outline-none"
            >
              <Reply className="w-4 h-4" />
              Reply via Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interactive Reply via Email Modal */}
      <Dialog open={!!replyTarget} onOpenChange={(open) => !open && setReplyTarget(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6 border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Reply className="w-5 h-5 text-primary-600" />
              Send Email Reply
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Send an official email response directly to the user.
            </DialogDescription>
          </DialogHeader>

          {replyTarget && (
            <form onSubmit={handleSendReply} className="space-y-4 py-2">
              {/* Recipient Details */}
              <div className="flex items-center gap-3 p-3 bg-primary-50/50 rounded-xl border border-primary-100">
                <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {getInitials(replyTarget.name)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-gray-500">Recipient:</p>
                  <p className="font-bold text-gray-900 text-sm truncate">
                    {replyTarget.name} &lt;{replyTarget.email}&gt;
                  </p>
                </div>
              </div>

              {/* Reply Subject */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Subject</Label>
                <Input
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Subject..."
                  className="border-gray-300 text-xs sm:text-sm rounded-xl focus:ring-0"
                />
              </div>

              {/* Reply Message Textarea */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Reply Message</Label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={6}
                  placeholder="Type your reply message here..."
                  className="border-gray-300 text-xs sm:text-sm rounded-xl focus:ring-0 resize-none leading-relaxed"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`mailto:${replyTarget.email}?subject=${encodeURIComponent(replySubject)}`, '_blank')}
                  className="border-gray-300 text-xs gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  Open Mail App
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={sendingReply}
                  className="gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold"
                >
                  {sendingReply ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send Email Reply
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl p-6 border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              Delete Contact Message
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs sm:text-sm text-gray-500">
            Are you sure you want to delete the message from{' '}
            <span className="font-semibold text-gray-900">{deleteTarget?.name}</span>? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="border-gray-300">
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Delete Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagesManagement;
