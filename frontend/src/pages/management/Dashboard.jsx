import { useState, useEffect } from 'react';
import { 
  FileText, TrendingUp, Clock, CheckCircle, 
  AlertTriangle, Eye, BarChart3
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

const ManagementDashboard = () => {
  const [statusData, setStatusData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, catRes, monthRes, deptRes] = await Promise.all([
          api.get('/reports/status-count'),
          api.get('/reports/category-count'),
          api.get('/reports/monthly-trend'),
          api.get('/reports/department-performance')
        ]);
        
        setStatusData(statusRes.data.map(s => ({ 
          name: s._id?.replace(/_/g, ' '), 
          value: s.count, 
          status: s._id 
        })));
        
        setCategoryData(catRes.data.slice(0, 6).map(c => ({
          category: c._id?.primary_category?.replace(/_/g, ' '),
          count: c.count
        })));
        
        setMonthlyData(monthRes.data.slice(-6).map(m => ({
          month: `${m._id.month}/${m._id.year}`,
          issues: m.total
        })));

        setDeptData(deptRes.data.slice(0, 10));
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
  const pendingCount = (statusData.find(s => s.status === 'submitted')?.value || 0) +
                       (statusData.find(s => s.status === 'under_review')?.value || 0) +
                       (statusData.find(s => s.status === 'in_progress')?.value || 0);
  const resolutionRate = totalIssues > 0 ? (((resolvedCount + closedCount) / totalIssues) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Management Overview</h1>
          <p className="text-slate-500 mt-1">Campus-wide analytics and performance monitoring</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg">
          <Eye className="w-4 h-4 text-sky-700" />
          <span className="text-sm font-medium text-sky-900">Oversight Role - Read Only</span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">Your Role: Campus Oversight</p>
            <p className="text-sm text-amber-700 mt-1">
              As management, you monitor campus performance and view analytics.
              Department admins handle individual issue resolution and student approvals.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-sky-500 to-sky-700 text-white border-0">
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
          <Clock className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-xs font-medium uppercase opacity-90">Pending</p>
          <p className="text-3xl font-bold mt-1">{pendingCount.toLocaleString()}</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-0">
          <CheckCircle className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-xs font-medium uppercase opacity-90">Resolved</p>
          <p className="text-3xl font-bold mt-1">{(resolvedCount + closedCount).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Issues by Status</h2>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400">No data available</div>
          ) : (
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
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Monthly Issue Trend</h2>
          {monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip />
                <Bar dataKey="issues" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Department Performance</h2>
        </div>
        {deptData.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No department data available</p>
        ) : (
          <div className="space-y-3">
            {deptData.map((dept, i) => (
              <div key={dept._id || i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-slate-200 text-slate-700' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-indigo-100 text-indigo-700'
                  }`}>
                    #{i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{dept.department_name}</p>
                    <p className="text-xs text-slate-500">
                      {dept.total} total · {(dept.resolved || 0) + (dept.closed || 0)} resolved · {dept.pending || 0} pending
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-lg text-slate-900">{(dept.resolution_rate || 0).toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">Resolution Rate</p>
                  </div>
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        dept.resolution_rate >= 70 ? 'bg-emerald-500' :
                        dept.resolution_rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, dept.resolution_rate || 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Issue Categories</h2>
        {categoryData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-400">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" stroke="#64748B" fontSize={12} />
              <YAxis dataKey="category" type="category" stroke="#64748B" fontSize={12} width={130} />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ManagementDashboard;