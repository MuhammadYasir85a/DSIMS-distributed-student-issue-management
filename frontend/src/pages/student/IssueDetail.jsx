import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Star, RotateCcw, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Spinner from '../../components/ui/Spinner';

const StudentIssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reopenReason, setReopenReason] = useState('');
  const [showReopen, setShowReopen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, was_actually_resolved: true, comment: '', flag_for_review: false });
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const res = await api.get(`/issues/${id}`);
        setIssue(res.data);
        if (['resolved', 'closed', 'rejected'].includes(res.data.status)) {
          try {
            const fbRes = await api.get(`/feedback/issue/${id}/my`);
            setExistingFeedback(fbRes.data.feedback);
          } catch {}
        }
      } catch (err) {
        toast.error('Issue not found');
        navigate('/student/issues');
      } finally {
        setLoading(false);
      }
    };
    fetchIssue();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this issue?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/issues/${id}`);
      toast.success('Issue deleted');
      navigate('/student/issues');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    if (reopenReason.length < 20) {
      toast.error('Reason must be at least 20 characters');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.patch(`/issues/${id}/reopen`, { reason: reopenReason });
      setIssue(res.data.issue);
      setShowReopen(false);
      setReopenReason('');
      toast.success('Issue reopened');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot reopen');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeedback = async () => {
    setActionLoading(true);
    try {
      await api.post(`/feedback/issue/${id}`, feedback);
      toast.success('Feedback submitted. Thank you!');
      setShowFeedback(false);
      const fbRes = await api.get(`/feedback/issue/${id}/my`);
      setExistingFeedback(fbRes.data.feedback);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!issue) return null;

  const canDelete = issue.status === 'submitted';
  const canReopen = issue.status === 'resolved';
  const canFeedback = ['resolved', 'closed', 'rejected'].includes(issue.status) && !existingFeedback && issue.assigned_to_admin_id;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <button onClick={() => navigate('/student/issues')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Issues
      </button>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{issue.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <span className="text-xs text-slate-500">{issue.primary_category?.replace(/_/g, ' ')} / {issue.subcategory}</span>
            </div>
          </div>
        </div>

        <p className="text-slate-700 leading-relaxed mb-4">{issue.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 rounded-lg p-3">
            <span className="text-slate-500">Department</span>
            <p className="font-medium text-slate-900">{issue.department_id?.name || 'N/A'}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <span className="text-slate-500">Created</span>
            <p className="font-medium text-slate-900">{new Date(issue.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        {issue.resolution_summary && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm font-medium text-emerald-800">Resolution Summary</p>
            <p className="text-sm text-emerald-700 mt-1">{issue.resolution_summary}</p>
          </div>
        )}

        {issue.is_anonymous && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">This issue was submitted anonymously. Your identity is hidden from the admin.</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {canDelete && (
            <button onClick={handleDelete} disabled={actionLoading} className="btn-danger text-sm">
              <Trash2 className="w-4 h-4" /> Delete Issue
            </button>
          )}
          {canReopen && (
            <button onClick={() => setShowReopen(!showReopen)} className="btn-secondary text-sm">
              <RotateCcw className="w-4 h-4" /> Reopen Issue
            </button>
          )}
          {canFeedback && (
            <button onClick={() => setShowFeedback(!showFeedback)} className="btn-primary text-sm">
              <Star className="w-4 h-4" /> Give Feedback
            </button>
          )}
        </div>

        {showReopen && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-3">
            <label className="block text-sm font-medium text-slate-700">Why are you reopening this issue?</label>
            <textarea
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              className="input min-h-[80px]"
              placeholder="Explain why this issue is not resolved (min 20 chars)..."
            />
            <button onClick={handleReopen} disabled={actionLoading} className="btn-primary text-sm">
              {actionLoading ? 'Submitting...' : 'Submit Reopen Request'}
            </button>
          </div>
        )}

        {showFeedback && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFeedback(f => ({ ...f, rating: r }))}
                    className={`w-10 h-10 rounded-lg font-bold transition ${
                      feedback.rating >= r ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={feedback.was_actually_resolved}
                onChange={(e) => setFeedback(f => ({ ...f, was_actually_resolved: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600"
              />
              <span className="text-sm text-slate-700">Issue was actually resolved</span>
            </label>
            <textarea
              value={feedback.comment}
              onChange={(e) => setFeedback(f => ({ ...f, comment: e.target.value }))}
              className="input min-h-[80px]"
              placeholder="Optional comment about the resolution..."
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={feedback.flag_for_review}
                onChange={(e) => setFeedback(f => ({ ...f, flag_for_review: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-rose-600"
              />
              <span className="text-sm text-slate-700">Flag for super admin review</span>
            </label>
            <button onClick={handleFeedback} disabled={actionLoading} className="btn-primary text-sm">
              {actionLoading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        )}

        {existingFeedback && (
          <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-sm font-medium text-indigo-800 mb-2">Your Feedback</p>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-indigo-700">Rating:</span>
              <span className="font-bold text-indigo-900">{existingFeedback.rating}/5</span>
            </div>
            {existingFeedback.comment && (
              <p className="text-sm text-indigo-700">{existingFeedback.comment}</p>
            )}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Activity Timeline</h2>
        <div className="space-y-4">
          {issue.updates?.map((update, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                {i < issue.updates.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{update.message}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>{update.updater_role?.replace(/_/g, ' ')}</span>
                  {update.new_status && <StatusBadge status={update.new_status} />}
                  <span>{new Date(update.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentIssueDetail;