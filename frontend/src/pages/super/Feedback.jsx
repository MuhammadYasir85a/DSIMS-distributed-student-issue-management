import { useState, useEffect } from 'react';
import { Star, AlertTriangle, CheckCircle, Eye, Flag, User } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const SuperAdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreviewedCount, setUnreviewedCount] = useState(0);
  const [filter, setFilter] = useState('unreviewed');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (filter === 'unreviewed') params.append('unreviewed', 'true');
      const res = await api.get(`/feedback/escalated?${params}`);
      setFeedbacks(res.data.feedbacks);
      setTotalPages(res.data.totalPages);
      setUnreviewedCount(res.data.unreviewed_count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, filter]);

  const handleReview = async () => {
    if (notes.length < 20) {
      toast.error('Notes must be at least 20 characters');
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/feedback/${selected._id}/review`, { super_admin_notes: notes });
      toast.success('Feedback reviewed');
      setSelected(null);
      setNotes('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Escalated Feedback</h1>
        <p className="text-slate-500 mt-1">Review feedback flagged for super admin attention</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5 bg-rose-50 border border-rose-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-rose-700 uppercase">Unreviewed Escalations</p>
              <p className="text-3xl font-bold text-rose-900 mt-1">{unreviewedCount}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-rose-400" />
          </div>
        </div>

        <div className="card p-5 bg-indigo-50 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-indigo-700 uppercase">Total Showing</p>
              <p className="text-3xl font-bold text-indigo-900 mt-1">{feedbacks.length}</p>
            </div>
            <Eye className="w-10 h-10 text-indigo-400" />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { setFilter('unreviewed'); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'unreviewed' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Unreviewed Only
        </button>
        <button
          onClick={() => { setFilter('all'); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Escalated
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : feedbacks.length === 0 ? (
        <EmptyState icon={CheckCircle} title="All clear" message="No escalated feedback needs your attention" />
      ) : (
        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <div key={fb._id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{fb.issue_id?.title || 'Issue'}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>{fb.issue_id?.primary_category?.replace(/_/g, ' ')}</span>
                    <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                    <span className={`badge ${
                      fb.issue_final_status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                      fb.issue_final_status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>{fb.issue_final_status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${s <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> Reported By</p>
                  <p className="font-medium text-slate-900 truncate">{fb.student_id?.name || 'N/A'}</p>
                  <p className="text-xs text-slate-500">{fb.student_id?.student_id}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Handled By</p>
                  <p className="font-medium text-slate-900 truncate">{fb.admin_id?.name || 'N/A'}</p>
                  <p className="text-xs text-slate-500">{fb.department_id?.name}</p>
                </div>
              </div>

              {fb.comment && (
                <div className="bg-rose-50 border-l-4 border-rose-400 p-3 rounded-r-lg mb-3">
                  <p className="text-sm italic text-rose-900">"{fb.comment}"</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {!fb.was_actually_resolved && (
                  <span className="badge bg-rose-100 text-rose-700">
                    <AlertTriangle className="w-3 h-3" /> Disputed Resolution
                  </span>
                )}
                {fb.flag_for_review && (
                  <span className="badge bg-amber-100 text-amber-700">
                    <Flag className="w-3 h-3" /> Student Flagged
                  </span>
                )}
                {fb.super_admin_reviewed ? (
                  <span className="badge bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-3 h-3" /> Reviewed
                  </span>
                ) : (
                  <span className="badge bg-rose-100 text-rose-700">Pending Review</span>
                )}
              </div>

              {fb.super_admin_notes && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-emerald-800 mb-1">Your Review Notes:</p>
                  <p className="text-sm text-emerald-700">{fb.super_admin_notes}</p>
                </div>
              )}

              {!fb.super_admin_reviewed && (
                <button onClick={() => setSelected(fb)} className="btn-primary text-sm">
                  Review & Add Notes
                </button>
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

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Review Feedback</h3>
            <p className="text-sm text-slate-600 mb-4">
              Document your investigation findings and action taken regarding this complaint.
            </p>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-[120px]"
              placeholder="Document your investigation and actions taken (min 20 chars)..."
            />

            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => { setSelected(null); setNotes(''); }} className="btn-secondary">Cancel</button>
              <button onClick={handleReview} disabled={actionLoading} className="btn-primary">
                {actionLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminFeedback;