import { useState, useEffect } from 'react';
import { Inbox, CheckCircle, XCircle, Clock, AlertTriangle, Building2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const PRIORITY_STYLES = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-sky-100 text-sky-700',
  high: 'bg-rose-100 text-rose-700',
};

const ResourceRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [reviewingId, setReviewingId] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (filter !== 'all') params.append('status', filter);
      const res = await api.get(`/management/resource-requests?${params}`);
      setRequests(res.data.requests);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [page, filter]);

  const handleReview = async (id, decision) => {
    setActionLoading(true);
    try {
      await api.patch(`/management/resource-requests/${id}/review`, { decision, remarks });
      toast.success(`Request ${decision}`);
      setReviewingId(null);
      setRemarks('');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resource Requests</h1>
        <p className="text-slate-500 mt-1">Review and approve resource requests from department admins</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : requests.length === 0 ? (
        <EmptyState icon={Inbox} title="No requests" message="No resource requests match this filter" />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req._id} className="card p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-slate-900">{req.title}</h3>
                    <span className={`badge capitalize ${STATUS_STYLES[req.status]}`}>{req.status}</span>
                    <span className={`badge capitalize ${PRIORITY_STYLES[req.priority]}`}>{req.priority}</span>
                    <span className="badge bg-indigo-100 text-indigo-700 capitalize">
                      {req.request_type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{req.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap mb-3">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {req.requester_id?.name || 'Unknown'} 
                  {req.department_id?.name && ` · ${req.department_id.name}`}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(req.createdAt).toLocaleString()}
                </span>
              </div>

              {req.status !== 'pending' && req.review_remarks && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Your Remarks</p>
                  <p className="text-sm text-slate-700">{req.review_remarks}</p>
                </div>
              )}

              {req.status === 'pending' && (
                <>
                  {reviewingId === req._id ? (
                    <div className="space-y-2 border-t border-slate-200 pt-3">
                      <textarea
                        className="input min-h-[80px]"
                        placeholder="Add remarks (optional)..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleReview(req._id, 'approved')}
                          disabled={actionLoading}
                          className="btn-success text-sm"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleReview(req._id, 'rejected')}
                          disabled={actionLoading}
                          className="btn-danger text-sm"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button
                          onClick={() => { setReviewingId(null); setRemarks(''); }}
                          disabled={actionLoading}
                          className="btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setReviewingId(req._id); setRemarks(''); }}
                      className="btn-primary text-sm"
                    >
                      <AlertTriangle className="w-4 h-4" /> Review
                    </button>
                  )}
                </>
              )}
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
  );
};

export default ResourceRequests;