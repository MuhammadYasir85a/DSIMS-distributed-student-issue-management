import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, AlertTriangle, CheckCircle, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Spinner from '../../components/ui/Spinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/issues/dashboard/admin');
        setStats(res.data);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const statusCards = [
    { key: 'submitted', label: 'New', icon: Clock, color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { key: 'under_review', label: 'Under Review', icon: AlertTriangle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'in_progress', label: 'In Progress', icon: FileText, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { key: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ];

  const priorityCards = [
    { key: 'urgent', label: 'Urgent', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { key: 'high', label: 'High', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'medium', label: 'Medium', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { key: 'low', label: 'Low', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Department Dashboard</h1>
        <p className="text-slate-500 mt-1">Monitor and handle student issues efficiently</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className={`card p-5 border ${color}`}>
            <div className="flex items-center justify-between mb-3">
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-3xl font-bold">{stats?.by_status?.[key] || 0}</p>
          </div>
        ))}
      </div>

      {stats?.pending_approvals > 0 && (
        <div className="card p-5 bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <p className="font-semibold text-amber-900">Pending Student Approvals</p>
              <p className="text-sm text-amber-700">{stats.pending_approvals} student(s) awaiting your approval</p>
            </div>
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Issues by Priority</h2>
        <div className="grid grid-cols-4 gap-4">
          {priorityCards.map(({ key, label, color }) => (
            <div key={key} className={`p-4 rounded-lg border ${color}`}>
              <p className="text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
              <p className="text-2xl font-bold">{stats?.by_priority?.[key] || 0}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Issues</h2>
          <Link to="/admin/issues" className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {stats?.recent_issues?.length > 0 ? (
          <div className="space-y-3">
            {stats.recent_issues.map((issue) => (
              <Link
                key={issue._id}
                to={`/admin/issues/${issue._id}`}
                className="card p-4 flex items-center justify-between hover:shadow-md transition group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate group-hover:text-indigo-600 transition">
                    {issue.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>
                      {issue.is_anonymous ? 'Anonymous' : (issue.student_id?.name || 'Unknown')}
                    </span>
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <PriorityBadge priority={issue.priority} />
                  <StatusBadge status={issue.status} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No recent issues</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;