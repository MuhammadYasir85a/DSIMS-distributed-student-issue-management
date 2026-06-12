import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Check, AlertCircle, MessageSquare, FileText } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filter === 'unread') params.append('unread', 'true');
      const res = await api.get(`/notifications?${params}`);
      setNotifications(res.data.notifications);
      setTotalPages(res.data.totalPages);
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [page, filter]);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await api.patch('/notifications/read-all');
      toast.success('All marked as read');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Deleted');
    } catch (err) {
      toast.error('Failed');
    }
  };

  const getIssueLink = (issueId) => {
    if (!issueId) return null;
    if (user?.role === 'student') return `/student/issues/${issueId._id || issueId}`;
    if (user?.role === 'department_admin') return `/admin/issues/${issueId._id || issueId}`;
    return null;
  };

  const getIcon = (message) => {
    const lower = (message || '').toLowerCase();
    if (lower.includes('feedback') || lower.includes('rating')) return MessageSquare;
    if (lower.includes('escalat') || lower.includes('flag')) return AlertCircle;
    return FileText;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} disabled={actionLoading} className="btn-secondary text-sm">
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { setFilter('all'); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => { setFilter('unread'); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            filter === 'unread' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === 'unread' ? 'bg-white text-indigo-700' : 'bg-rose-500 text-white'
            }`}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" message={filter === 'unread' ? 'You have no unread notifications' : 'Notifications will appear here'} />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = getIcon(notif.message);
            const link = getIssueLink(notif.issue_id);

            const content = (
              <>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  notif.is_read ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notif.is_read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>{new Date(notif.createdAt).toLocaleString()}</span>
                    {notif.issue_id?.title && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded truncate max-w-[200px]">
                        {notif.issue_id.title}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!notif.is_read && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMarkRead(notif._id); }}
                      className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(notif._id); }}
                    className="p-2 rounded-lg hover:bg-rose-50 text-rose-600 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            );

            const baseClass = `card p-4 flex items-center gap-4 transition ${
              !notif.is_read ? 'border-l-4 border-l-indigo-500' : ''
            } ${link ? 'hover:shadow-md cursor-pointer' : ''}`;

            return link ? (
              <Link key={notif._id} to={link} className={baseClass}>
                {content}
              </Link>
            ) : (
              <div key={notif._id} className={baseClass}>
                {content}
              </div>
            );
          })}

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
  );
};

export default Notifications;