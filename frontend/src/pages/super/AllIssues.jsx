import { useState, useEffect } from 'react';
import { Search, Filter, Trash2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const SuperAdminAllIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10, sort_by: 'createdAt', sort_order: 'desc' });
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      const res = await api.get(`/issues/all?${params}`);
      setIssues(res.data.issues);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, [page, filters.status, filters.priority]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchIssues();
  };

  const handleDelete = async () => {
    if (deleteReason.length < 20) {
      toast.error('Reason must be at least 20 characters');
      return;
    }
    setActionLoading(true);
    try {
      await api.delete(`/issues/${selectedForDelete._id}/super-delete`, {
        data: { delete_reason: deleteReason }
      });
      toast.success('Issue deleted');
      setSelectedForDelete(null);
      setDeleteReason('');
      fetchIssues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Issues (Cross-Campus)</h1>
        <p className="text-slate-500 mt-1">Read-only view of all issues across all campuses</p>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>

          <select value={filters.status} onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }} className="input max-w-[180px]">
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
          </select>

          <select value={filters.priority} onChange={(e) => { setFilters(f => ({ ...f, priority: e.target.value })); setPage(1); }} className="input max-w-[150px]">
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : issues.length === 0 ? (
        <EmptyState title="No issues found" message="Try adjusting your filters" />
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue._id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{issue.title}</p>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{issue.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-1 rounded">
                      {issue.campus_id?.name}
                    </span>
                    <span className="bg-slate-100 px-2 py-1 rounded">
                      {issue.department_id?.name}
                    </span>
                    <span>Reporter: {issue.is_anonymous ? 'Anonymous' : (issue.student_id?.name || 'N/A')}</span>
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={issue.status} />
                  <PriorityBadge priority={issue.priority} />
                  {['resolved', 'closed'].includes(issue.status) && (
                    <button
                      onClick={() => setSelectedForDelete(issue)}
                      className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 mt-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}
                </div>
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

      {selectedForDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Issue</h3>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              You are about to permanently delete: <strong>{selectedForDelete.title}</strong>
            </p>

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for deletion (min 20 characters)
            </label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="input min-h-[100px]"
              placeholder="Explain why this issue is being deleted..."
            />

            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => { setSelectedForDelete(null); setDeleteReason(''); }} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={actionLoading} className="btn-danger">
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminAllIssues;