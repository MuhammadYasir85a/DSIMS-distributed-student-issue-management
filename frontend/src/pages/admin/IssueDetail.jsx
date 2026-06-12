import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, UserPlus, Edit, CheckCircle, XCircle, PlayCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Spinner from '../../components/ui/Spinner';

const AdminIssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ new_status: '', message: '', resolution_summary: '' });
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: '', edit_reason: '' });

  const fetchIssue = async () => {
    try {
      const res = await api.get(`/issues/${id}`);
      setIssue(res.data);
      setEditForm({
        title: res.data.title,
        description: res.data.description,
        priority: res.data.priority,
        edit_reason: ''
      });
    } catch (err) {
      toast.error('Issue not found');
      navigate('/admin/issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssue(); }, [id]);

  const handleAssign = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/issues/${id}/assign`);
      setIssue(res.data.issue);
      toast.success('Issue assigned to you');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (statusForm.new_status === 'resolved' && statusForm.resolution_summary.length < 30) {
      toast.error('Resolution summary must be at least 30 characters');
      return;
    }
    if (statusForm.new_status === 'rejected' && statusForm.message.length < 20) {
      toast.error('Rejection reason must be at least 20 characters');
      return;
    }
    setActionLoading(true);
    try {
      const payload = { new_status: statusForm.new_status };
      if (statusForm.message) payload.message = statusForm.message;
      if (statusForm.resolution_summary) payload.resolution_summary = statusForm.resolution_summary;
      const res = await api.patch(`/issues/${id}/status`, payload);
      setIssue(res.data.issue);
      setShowStatusModal(false);
      setStatusForm({ new_status: '', message: '', resolution_summary: '' });
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (editForm.edit_reason.length < 15) {
      toast.error('Edit reason must be at least 15 characters');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.patch(`/issues/${id}/admin-edit`, editForm);
      setIssue(res.data.issue);
      setShowEditModal(false);
      toast.success('Issue updated');
      fetchIssue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to edit');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!issue) return null;

  const allowedTransitions = issue.allowed_status_transitions || [];
  const isAssignedToMe = issue.assigned_to_admin_id?._id || issue.assigned_to_admin_id;
  const canAssign = !issue.assigned_to_admin_id && !['closed', 'rejected'].includes(issue.status);
  const canEdit = !['closed', 'rejected'].includes(issue.status);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <button onClick={() => navigate('/admin/issues')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Issues
      </button>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{issue.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <span className="text-xs text-slate-500">{issue.primary_category?.replace(/_/g, ' ')} / {issue.subcategory}</span>
            </div>
          </div>
        </div>

        <p className="text-slate-700 leading-relaxed mb-6">{issue.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500">Reporter</p>
            <p className="font-medium text-slate-900 text-sm truncate">
              {issue.is_anonymous ? 'Anonymous' : (issue.student_id?.name || 'N/A')}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500">Department</p>
            <p className="font-medium text-slate-900 text-sm truncate">{issue.department_id?.name || 'N/A'}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500">Created</p>
            <p className="font-medium text-slate-900 text-sm">{new Date(issue.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500">Assigned To</p>
            <p className="font-medium text-slate-900 text-sm truncate">
              {issue.assigned_to_admin_id?.name || 'Unassigned'}
            </p>
          </div>
        </div>

        {issue.resolution_summary && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-emerald-800 mb-1">Resolution Summary</p>
            <p className="text-sm text-emerald-700">{issue.resolution_summary}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {canAssign && (
            <button onClick={handleAssign} disabled={actionLoading} className="btn-primary">
              <UserPlus className="w-4 h-4" /> Assign to Me
            </button>
          )}

          {allowedTransitions.includes('in_progress') && isAssignedToMe && (
            <button
              onClick={() => { setStatusForm({ new_status: 'in_progress', message: '', resolution_summary: '' }); setShowStatusModal(true); }}
              className="btn-secondary"
            >
              <PlayCircle className="w-4 h-4" /> Move to In Progress
            </button>
          )}

          {allowedTransitions.includes('resolved') && (
            <button
              onClick={() => { setStatusForm({ new_status: 'resolved', message: '', resolution_summary: '' }); setShowStatusModal(true); }}
              className="btn-success"
            >
              <CheckCircle className="w-4 h-4" /> Mark Resolved
            </button>
          )}

          {allowedTransitions.includes('closed') && (
            <button
              onClick={() => { setStatusForm({ new_status: 'closed', message: '', resolution_summary: '' }); setShowStatusModal(true); }}
              className="btn-secondary"
            >
              <CheckCircle className="w-4 h-4" /> Close
            </button>
          )}

          {allowedTransitions.includes('rejected') && (
            <button
              onClick={() => { setStatusForm({ new_status: 'rejected', message: '', resolution_summary: '' }); setShowStatusModal(true); }}
              className="btn-danger"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          )}

          {canEdit && (
            <button onClick={() => setShowEditModal(true)} className="btn-secondary">
              <Edit className="w-4 h-4" /> Edit Content
            </button>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Activity Timeline</h2>
        <div className="space-y-4">
          {issue.updates?.map((update, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                {i < issue.updates.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
              </div>
              <div className="flex-1 pb-4">
                <p className="text-sm font-medium text-slate-900">{update.message}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="capitalize">{update.updater_role?.replace(/_/g, ' ')}</span>
                  {update.new_status && update.new_status !== update.old_status && <StatusBadge status={update.new_status} />}
                  <span>{new Date(update.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Update Status</h3>
            <p className="text-sm text-slate-500 mb-4">Change status to: <strong className="capitalize">{statusForm.new_status?.replace(/_/g, ' ')}</strong></p>

            {statusForm.new_status === 'resolved' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Resolution Summary (min 30 chars)</label>
                <textarea
                  value={statusForm.resolution_summary}
                  onChange={(e) => setStatusForm(f => ({ ...f, resolution_summary: e.target.value }))}
                  className="input min-h-[100px]"
                  placeholder="Explain how the issue was resolved..."
                />
              </div>
            )}

            {statusForm.new_status === 'rejected' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason (min 20 chars)</label>
                <textarea
                  value={statusForm.message}
                  onChange={(e) => setStatusForm(f => ({ ...f, message: e.target.value }))}
                  className="input min-h-[100px]"
                  placeholder="Explain why this issue is being rejected..."
                />
              </div>
            )}

            {!['resolved', 'rejected'].includes(statusForm.new_status) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Optional Message</label>
                <textarea
                  value={statusForm.message}
                  onChange={(e) => setStatusForm(f => ({ ...f, message: e.target.value }))}
                  className="input min-h-[80px]"
                  placeholder="Add a note..."
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowStatusModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleStatusUpdate} disabled={actionLoading} className="btn-primary">
                {actionLoading ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Issue Content</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="input min-h-[100px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm(f => ({ ...f, priority: e.target.value }))}
                  className="input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Edit (min 15 chars)</label>
                <textarea
                  value={editForm.edit_reason}
                  onChange={(e) => setEditForm(f => ({ ...f, edit_reason: e.target.value }))}
                  className="input min-h-[80px]"
                  placeholder="Why are you editing this issue?"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleEdit} disabled={actionLoading} className="btn-primary">
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIssueDetail;