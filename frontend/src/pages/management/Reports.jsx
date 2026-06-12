import { useState, useEffect } from 'react';
import { Clock, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';

const Reports = () => {
  const [resolutionMetrics, setResolutionMetrics] = useState([]);
  const [deptPerformance, setDeptPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRes, deptRes] = await Promise.all([
          api.get('/reports/resolution-metrics'),
          api.get('/reports/department-performance')
        ]);
        setResolutionMetrics(resRes.data);
        setDeptPerformance(deptRes.data.slice(0, 10).map(d => ({
          name: d.department_name,
          resolved: d.resolved || 0,
          pending: d.pending || 0,
          rejected: d.rejected || 0,
        })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics Reports</h1>
        <p className="text-slate-500 mt-1">Detailed performance metrics across your campus</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Resolution Time by Category</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">Average hours taken to resolve issues per category</p>
        
        {resolutionMetrics.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No resolution data available yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Avg Hours</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Min</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Max</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Resolved</th>
                </tr>
              </thead>
              <tbody>
                {resolutionMetrics.map((m, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900 capitalize">
                      {m._id?.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold ${
                        m.avg_hours < 24 ? 'text-emerald-600' :
                        m.avg_hours < 72 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {(m.avg_hours || 0).toFixed(1)}h
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 text-sm">{(m.min_hours || 0).toFixed(1)}h</td>
                    <td className="py-3 px-4 text-right text-slate-600 text-sm">{(m.max_hours || 0).toFixed(1)}h</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">{m.count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-slate-900">Department Performance Comparison</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">Compare how each department handles issues</p>

        {deptPerformance.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No department data</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={deptPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                stroke="#64748B" 
                fontSize={11} 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="resolved" stackId="a" fill="#10B981" name="Resolved" />
              <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
              <Bar dataKey="rejected" stackId="a" fill="#F43F5E" name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Reports;