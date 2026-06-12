import { useState, useEffect } from 'react';
import { PackagePlus, Send, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

const RequestResources = () => {
  const [form, setForm] = useState({
    request_type: 'equipment',
    title: '',
    description: '',
    priority: 'medium',
  });
  const [submitting, setSubmitting] = useState(false);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/management/resource-requests/mine?page=${page}&limit=10`);
      setRequests(res.data.requests);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/management/resource-requests', form);
      toast.success('Request submitted to management');
      setForm({ request_type: 'equipment', title: '', description: '', priority: 'medium' });
      setPage(1);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Request Resources</h1>
        <p className="text-slate-500 mt-1">Submit formal requests to your campus management</p>
      </div>

      {/* Submit form */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <PackagePlus className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">New Request</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Request Type</label>
              <select
                value={form.request_type}
                onChange={(e) => setForm(f => ({ ...f, request_type: e.target.value }))}
                className="input"
              >
                <option value="equipment">Equipment</option>
                <option value="budget">Budget</option>
                <option value="staff">Staff</option>
                <option value="permission">Permission</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
                className="input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Need 2 additional cleaning staff for hostel"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              className="input min-h-[120px]"
              placeholder="Provide details and justification for this request..."
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              maxLength={1500}
            />
            <p className="text-xs text-slate-400 mt-1">{form.description.length}/1500</p>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="btn-primary">
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>

      {/* My requests history */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">My Requests</h2>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : requests.length === 0 ? (
          <EmptyState icon={PackagePlus} title="No requests yet" message="Your submitted requests will appear here" />
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const Icon = STATUS_ICONS[req.status] || Clock;
              return (
                <div key={req._id} className="card p-5">
                  <div className="flex items-start gap-3 flex-wrap mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{req.title}</h3>
                        <span className={`badge capitalize ${STATUS_STYLES[req.status]}`}>
                          <Icon className="w-3 h-3" /> {req.status}
                        </span>
                        <span className="badge bg-indigo-100 text-indigo-700 capitalize">{req.request_type}</span>
                        <span className="badge bg-slate-100 text-slate-700 capitalize">{req.priority}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{req.description}</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Submitted: {new Date(req.createdAt).toLocaleString()}
                    </span>
                    {req.reviewed_at && (
                      <span>Reviewed: {new Date(req.reviewed_at).toLocaleString()}</span>
                    )}
                  </div>

                  {req.review_remarks && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-3">
                      <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                        Management Remarks
                        {req.reviewed_by?.name && ` — ${req.reviewed_by.name}`}
                      </p>
                      <p className="text-sm text-slate-700">{req.review_remarks}</p>
                    </div>
                  )}
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
    </div>
  );
};

export default RequestResources;