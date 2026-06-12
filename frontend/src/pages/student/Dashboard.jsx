import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Spinner from '../../components/ui/Spinner';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/issues/dashboard/student');
        setStats(res.data);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const statusCards = [
    { key: 'submitted', label: 'Submitted', icon: Clock, color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { key: 'under_review', label: 'Under Review', icon: AlertTriangle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'in_progress', label: 'In Progress', icon: FileText, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { key: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { key: 'closed', label: 'Closed', icon: CheckCircle, color: 'bg-slate-50 text-slate-700 border-slate-200' },
    { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Track your issues and their resolution status</p>
        </div>
        <Link to="/student/issues/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Issue
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statusCards.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className={`card p-4 border ${color}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold">{stats?.by_status?.[key] || 0}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 border border-indigo-200 bg-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-700">Total Issues</p>
            <p className="text-3xl font-bold text-indigo-900">{stats?.total || 0}</p>
          </div>
          <Link to="/student/issues" className="btn-secondary text-sm">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Issues</h2>
        {stats?.recent_issues?.length > 0 ? (
          <div className="space-y-3">
            {stats.recent_issues.map((issue) => (
              <Link
                key={issue._id}
                to={`/student/issues/${issue._id}`}
                className="card p-4 flex items-center justify-between hover:shadow-md transition group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate group-hover:text-indigo-600 transition">
                    {issue.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">
                      {new Date(issue.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                    <span className="text-xs text-slate-400">
                      {issue.department_id?.name || 'Unknown Dept'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <PriorityBadge priority={issue.priority} />
                  <StatusBadge status={issue.status} />
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600">No issues yet</p>
            <p className="text-sm text-slate-400 mt-1">Submit your first issue to get started</p>
            <Link to="/student/issues/new" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" /> Create Issue
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;