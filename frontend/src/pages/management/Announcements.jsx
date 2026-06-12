import { useState, useEffect } from 'react';
import { Megaphone, Send, AlertTriangle, Clock, Users } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const Announcements = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [sending, setSending] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/management/announcements?page=${page}&limit=10`);
      setAnnouncements(res.data.announcements);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, [page]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/management/announcements', { title, message, priority });
      toast.success(res.data.message || 'Announcement sent');
      setTitle('');
      setMessage('');
      setPriority('normal');
      setPage(1);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Campus Announcements</h1>
        <p className="text-slate-500 mt-1">Broadcast messages to all department admins on your campus</p>
      </div>

      {/* Compose card */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-5 h-5 text-sky-600" />
          <h2 className="text-lg font-semibold text-slate-900">New Announcement</h2>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Resolve all pending hostel issues by Friday"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea
              className="input min-h-[120px]"
              placeholder="Write your message to all department admins..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
            />
            <p className="text-xs text-slate-400 mt-1">{message.length}/1000</p>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Priority:</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input max-w-[160px]"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <button type="submit" disabled={sending} className="btn-primary">
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Announcement'}
            </button>
          </div>
        </form>
      </div>

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Recent Announcements</h2>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : announcements.length === 0 ? (
  <div className="card p-8 text-center text-slate-500">
    <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-300" />
    <p className="font-semibold text-slate-700">No announcements yet</p>
    <p className="text-sm">Your sent announcements will appear here</p>
  </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a._id} className="card p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{a.title}</h3>
                      {a.priority === 'urgent' && (
                        <span className="badge bg-rose-100 text-rose-700">
                          <AlertTriangle className="w-3 h-3" /> Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{a.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Sent to {a.recipients_count} admin(s)
                  </span>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm">
                  Previous
                </button>
                <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm">
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;