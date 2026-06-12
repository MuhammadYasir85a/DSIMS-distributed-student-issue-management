import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, FileText, AlertTriangle, TrendingUp, Building2, 
  Star, Shield, ArrowRight, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';

const STATUS_COLORS = {
  submitted: '#0EA5E9',
  under_review: '#F59E0B',
  in_progress: '#6366F1',
  resolved: '#10B981',
  closed: '#64748B',
  rejected: '#F43F5E'
};

const SuperAdminDashboard = () => {
  const [statusData, setStatusData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [escalatedCount, setEscalatedCount] = useState(0);
  const [activeAdminsCount, setActiveAdminsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, catRes, monthRes, perfRes, escalRes, adminsRes] = await Promise.all([
          api.get('/reports/status-count'),
          api.get('/reports/category-count'),
          api.get('/reports/monthly-trend'),
          api.get('/feedback/admin-performance?days=90'),
          api.get('/feedback/escalated?unreviewed=true&limit=1'),
          api.get('/admins?status=active&limit=1&page=1')
        ]);
        
        setStatusData(statusRes.data.map(s => ({ 
          name: s._id?.replace(/_/g, ' '), 
          value: s.count, 
          status: s._id 
        })));
        
        setCategoryData(catRes.data.slice(0, 8).map(c => ({
          category: c._id?.primary_category?.replace(/_/g, ' '),
          count: c.count
        })));
        
        setMonthlyData(monthRes.data.slice(-6).map(m => ({
          month: `${m._id.month}/${m._id.year}`,
          issues: m.total
        })));
        
        setPerformanceData(perfRes.data);
        setEscalatedCount(escalRes.data.unreviewed_count || 0);

        // Get total active admins count from the same endpoint Manage Admins uses
        const total = adminsRes.data.total 
                   || adminsRes.data.totalCount 
                   || (adminsRes.data.totalPages ? adminsRes.data.totalPages * 10 : 0)
                   || (adminsRes.data.admins ? adminsRes.data.admins.length : 0);
        setActiveAdminsCount(total);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const totalIssues = statusData.reduce((sum, s) => sum + s.value, 0);
  const resolvedCount = statusData.find(s => s.status === 'resolved')?.value || 0;
  const closedCount = statusData.find(s => s.status === 'closed')?.value || 0;
  const resolutionRate = totalIssues > 0 ? (((resolvedCount + closedCount) / totalIssues) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
        <p className="text-slate-500 mt-1">Cross-campus analytics and admin performance monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-0">
          <FileText className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-xs font-medium uppercase opacity-90">Total Issues</p>
          <p className="text-3xl font-bold mt-1">{totalIssues.toLocaleString()}</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0">
          <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-xs font-medium uppercase opacity-90">Resolution Rate</p>
          <p className="text-3xl font-bold mt-1">{resolutionRate}%</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-amber-500 to-amber-700 text-white border-0">
          <Users className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-xs font-medium uppercase opacity-90">Active Admins</p>
          <p className="text-3xl font-bold mt-1">{activeAdminsCount}</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-rose-500 to-rose-700 text-white border-0">
          <AlertTriangle className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-xs font-medium uppercase opacity-90">Escalations</p>
          <p className="text-3xl font-bold mt-1">{escalatedCount}</p>
        </div>
      </div>

      {(escalatedCount > 0 || performanceData?.flagged_admins > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {escalatedCount > 0 && (
            <Link to="/super/feedback" className="card p-5 bg-rose-50 border border-rose-200 hover:shadow-md transition group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-rose-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-rose-900">{escalatedCount} Unreviewed Escalations</p>
                    <p className="text-sm text-rose-700">Click to review flagged feedback</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-rose-600 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          )}

          {performanceData?.flagged_admins > 0 && (
            <Link to="/super/admins" className="card p-5 bg-amber-50 border border-amber-200 hover:shadow-md transition group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">{performanceData.flagged_admins} Admins Need Review</p>
                    <p className="text-sm text-amber-700">Performance below threshold</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Issues by Status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] || '#64748B'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Monthly Trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip />
              <Bar dataKey="issues" fill="#6366F1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Issue Categories</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis type="number" stroke="#64748B" fontSize={12} />
            <YAxis dataKey="category" type="category" stroke="#64748B" fontSize={12} width={120} />
            <Tooltip />
            <Bar dataKey="count" fill="#10B981" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/super/admins" className="card p-5 hover:shadow-md transition group">
          <Building2 className="w-8 h-8 text-indigo-600 mb-3" />
          <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">Manage Admins</p>
          <p className="text-sm text-slate-500 mt-1">View, suspend, or reactivate admins</p>
        </Link>

        <Link to="/super/feedback" className="card p-5 hover:shadow-md transition group">
          <Star className="w-8 h-8 text-amber-600 mb-3" />
          <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">Review Feedback</p>
          <p className="text-sm text-slate-500 mt-1">Investigate escalated complaints</p>
        </Link>

        <Link to="/super/issues" className="card p-5 hover:shadow-md transition group">
          <Activity className="w-8 h-8 text-emerald-600 mb-3" />
          <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">All Issues</p>
          <p className="text-sm text-slate-500 mt-1">Cross-campus issue monitoring</p>
        </Link>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;