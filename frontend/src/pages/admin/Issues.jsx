import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, FileText, User } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const AdminIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10, sort_by: 'createdAt', sort_order: 'desc' });
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      const res = await api.get(`/issues/department?${params}`);
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
  }, [page, filters.status, filters.priority]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchIssues();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Department Issues</h1>
        <p className="text-slate-500 mt-1">Manage and resolve issues in your department</p>
      </div>

      {/* Filters Card */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn-primary whitespace-nowrap">Search</button>
          </form>

          <div className="flex gap-3">
            <select
              value={filters.status}
              onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
              className="input w-full md:w-44"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => { setFilters(f => ({ ...f, priority: e.target.value })); setPage(1); }}
              className="input w-full md:w-40"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : issues.length === 0 ? (
        <EmptyState icon={FileText} title="No issues found" message="Try adjusting your filters" />
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <Link
              key={issue._id}
              to={`/admin/issues/${issue._id}`}
              className="card p-5 block hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                    {issue.title}
                  </p>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{issue.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {issue.is_anonymous ? 'Anonymous' : (issue.student_id?.name || 'N/A')}
                    </span>
                    <span className="capitalize">
                      {issue.primary_category?.replace(/_/g, ' ')} / {issue.subcategory}
                    </span>
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={issue.status} />
                  <PriorityBadge priority={issue.priority} />
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 mt-1" />
                </div>
              </div>
            </Link>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
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

export default AdminIssues;