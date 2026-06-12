import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, FileText, AlertTriangle, Power, Shield, Mail, Building2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

const AdminDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get(`/admins/${id}`);
      setData(res.data);
    } catch (err) {
      toast.error('Admin not found');
      navigate('/super/admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusChange = async () => {
    if (reason.length < 20) {
      toast.error('Reason must be at least 20 characters');
      return;
    }
    setActionLoading(true);
    try {
      const new_status = data.admin.status === 'active' ? 'inactive' : 'active';
      await api.patch(`/admins/${id}/status`, { new_status, reason });
      toast.success(`Admin ${new_status === 'inactive' ? 'suspended' : 'reactivated'}`);
      setShowSuspendModal(false);
      setReason('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!data) return null;

  const { admin, issue_stats, feedback_stats, recent_issues } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate('/super/admins')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to Admins
      </button>

      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shrink-0 ${
            admin.role === 'super_admin' ? 'bg-gradient-to-br from-rose-500 to-rose-700' :
            admin.role === 'management' ? 'bg-gradient-to-br from-sky-500 to-sky-700' :
            'bg-gradient-to-br from-indigo-500 to-indigo-700'
          }`}>
            {admin.name?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{admin.name}</h1>
                <p className="text-slate-500 capitalize">{admin.role?.replace(/_/g, ' ')}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Mail className="w-4 h-4" /> {admin.email}
                  </span>
                  {admin.campus_id?.name && (
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Building2 className="w-4 h-4" /> {admin.campus_id.name}
                    </span>
                  )}
                </div>
                {admin.department_id?.name && (
                  <p className="text-sm text-slate-500 mt-1">Department: {admin.department_id.name}</p>
                )}
              </div>

              <span className={`badge ${
                admin.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {admin.status}
              </span>
            </div>

            {admin.role !== 'super_admin' && (
              <button
                onClick={() => setShowSuspendModal(true)}
                className={admin.status === 'active' ? 'btn-danger mt-4 text-sm' : 'btn-success mt-4 text-sm'}
              >
                <Power className="w-4 h-4" />
                {admin.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900">Issue Statistics</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Total Assigned</span>
              <span className="font-bold text-slate-900">{issue_stats?.total_assigned || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Resolved</span>
              <span className="font-bold text-emerald-600">{issue_stats?.by_status?.resolved || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Closed</span>
              <span className="font-bold text-slate-600">{issue_stats?.by_status?.closed || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">In Progress</span>
              <span className="font-bold text-indigo-600">{issue_stats?.by_status?.in_progress || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Rejected</span>
              <span className="font-bold text-rose-600">{issue_stats?.by_status?.rejected || 0}</span>
            </div>
            <div className="flex justify-between py-3 mt-2 bg-indigo-50 px-3 rounded-lg">
              <span className="text-sm font-medium text-indigo-700">Resolution Rate</span>
              <span className="font-bold text-indigo-900">{issue_stats?.resolution_rate || 0}%</span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-slate-900">Feedback Statistics</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Total Feedbacks</span>
              <span className="font-bold text-slate-900">{feedback_stats?.total_feedbacks || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Average Rating</span>
              <span className="font-bold text-amber-600 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {feedback_stats?.average_rating || 0}/5
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">High Ratings (4-5)</span>
              <span className="font-bold text-emerald-600">{feedback_stats?.high_ratings || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Low Ratings (1-2)</span>
              <span className="font-bold text-rose-600">{feedback_stats?.low_ratings || 0}</span>
            </div>
            <div className="flex justify-between py-3 mt-2 bg-rose-50 px-3 rounded-lg">
              <span className="text-sm font-medium text-rose-700 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Disputed Resolutions
              </span>
              <span className="font-bold text-rose-900">{feedback_stats?.disputed_resolutions || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {recent_issues?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Recently Handled Issues</h2>
          <div className="space-y-2">
            {recent_issues.map(issue => (
              <div key={issue._id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{issue.title}</p>
                  <p className="text-xs text-slate-500">{new Date(issue.updatedAt).toLocaleDateString()}</p>
                </div>
                <span className={`badge ${
                  issue.status === 'resolved' || issue.status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                  issue.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {issue.status?.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {admin.status === 'active' ? 'Suspend Admin' : 'Reactivate Admin'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {admin.status === 'active'
                ? `This will prevent ${admin.name} from logging in.`
                : `This will restore ${admin.name}'s access.`}
            </p>

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason (min 20 characters)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input min-h-[100px]"
              placeholder="Explain why you are taking this action..."
            />

            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setShowSuspendModal(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={handleStatusChange}
                disabled={actionLoading}
                className={admin.status === 'active' ? 'btn-danger' : 'btn-success'}
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDetail;