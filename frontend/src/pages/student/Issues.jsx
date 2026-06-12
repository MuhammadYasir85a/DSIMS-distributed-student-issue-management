import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const StudentIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/issues/my?${params}`);
      setIssues(res.data.issues);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Fetch issues error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [page, statusFilter]);

  const statuses = ['', 'submitted', 'under_review', 'in_progress', 'resolved', 'closed', 'rejected'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Issues</h1>
          <p className="text-slate-500 mt-1">View and manage your submitted issues</p>
        </div>
        <Link to="/student/issues/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Issue
        </Link>
      </div>

      <div className="card p-4 flex items-center gap-4">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input max-w-xs"
        >
          <option value="">All Statuses</option>
          {statuses.filter(s => s).map(s => (
            <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : issues.length === 0 ? (
        <EmptyState
          title="No issues found"
          message={statusFilter ? 'Try a different filter' : 'Submit your first issue to get started'}
          action={
            <Link to="/student/issues/new" className="btn-primary">
              <Plus className="w-4 h-4" /> Create Issue
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <Link
              key={issue._id}
              to={`/student/issues/${issue._id}`}
              className="card p-5 flex items-center justify-between hover:shadow-md transition group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition truncate">
                  {issue.title}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span>{issue.primary_category?.replace('_', ' ')}</span>
                  <span>{issue.department_id?.name || 'N/A'}</span>
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <PriorityBadge priority={issue.priority} />
                <StatusBadge status={issue.status} />
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
              </div>
            </Link>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentIssues;