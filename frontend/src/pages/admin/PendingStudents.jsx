import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, UserCheck } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const PendingStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pending-students?limit=50');
      setStudents(res.data.students);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/approve/${id}`);
      toast.success('Student approved');
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (rejectReason.length < 20) {
      toast.error('Reason must be at least 20 characters');
      return;
    }
    setActionLoading(rejectModal._id);
    try {
      await api.patch(`/admin/reject/${rejectModal._id}`, { reject_reason: rejectReason });
      toast.success('Student rejected');
      setRejectModal(null);
      setRejectReason('');
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pending Student Approvals</h1>
        <p className="text-slate-500 mt-1">Review and approve new student registrations in your department</p>
      </div>

      {!loading && students.length > 0 && (
        <div className="card p-4 bg-indigo-50 border border-indigo-200 flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-indigo-600" />
          <p className="text-sm text-indigo-900">
            <strong>{students.length}</strong> student{students.length !== 1 ? 's' : ''} waiting for approval
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : students.length === 0 ? (
        <EmptyState 
          icon={CheckCircle} 
          title="All caught up!" 
          message="No pending student approvals at this time." 
        />
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <div key={student._id} className="card p-5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {student.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{student.name}</p>
                  <p className="text-sm text-slate-500 truncate">{student.email}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>ID: {student.student_id}</span>
                    <span>Semester {student.semester}</span>
                    {student.department_id?.name && <span>{student.department_id.name}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setRejectModal(student)}
                  disabled={actionLoading === student._id}
                  className="btn-danger text-sm"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => handleApprove(student._id)}
                  disabled={actionLoading === student._id}
                  className="btn-success text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  {actionLoading === student._id ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reject Student</h3>
            <p className="text-sm text-slate-600 mb-4">
              You are rejecting <strong>{rejectModal.name}</strong>. They will be notified.
            </p>

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rejection Reason (min 20 characters)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input min-h-[100px]"
              placeholder="Explain why this student registration is being rejected..."
            />

            <div className="flex gap-3 justify-end mt-4">
              <button 
                onClick={() => { setRejectModal(null); setRejectReason(''); }} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject} 
                disabled={actionLoading} 
                className="btn-danger"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingStudents;