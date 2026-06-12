import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Mail, User, Lock, Shield, Building2, GraduationCap } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CreateAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [campuses, setCampuses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'department_admin',
    campus_id: '',
    department_id: '',
  });

  useEffect(() => {
    api.get('/campuses').then(res => setCampuses(res.data));
  }, []);

  useEffect(() => {
    if (form.campus_id) {
      api.get(`/departments?campus_id=${form.campus_id}`)
        .then(res => setDepartments(res.data))
        .catch(() => setDepartments([]));
    } else {
      setDepartments([]);
    }
  }, [form.campus_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'role' && value !== 'department_admin' ? { department_id: '' } : {}),
      ...(name === 'campus_id' ? { department_id: '' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      if (payload.role !== 'department_admin') {
        delete payload.department_id;
      }
      await api.post('/admins', payload);
      toast.success('Admin created successfully');
      navigate('/super/admins');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { 
      value: 'department_admin', 
      label: 'Department Admin', 
      desc: 'Hands-on issue handling',
      detail: 'Receives, assigns, and resolves issues. Also approves student registrations.'
    },
    { 
      value: 'management', 
      label: 'Management', 
      desc: 'Campus-wide oversight',
      detail: 'Views reports and analytics across all departments in a campus (read-only).'
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <button
        onClick={() => navigate('/super/admins')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Admins
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create New Admin</h1>
        <p className="text-slate-500 mt-1">Add a department admin or management user</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Admin Role</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roleOptions.map(option => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                    form.role === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={form.role === option.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <Shield className={`w-5 h-5 mt-0.5 shrink-0 ${form.role === option.value ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${form.role === option.value ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{option.desc}</p>
                      <p className="text-xs text-slate-400 mt-2">{option.detail}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input pl-10"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input pl-10"
                placeholder="admin@namal.edu.pk"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Campus</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                name="campus_id"
                value={form.campus_id}
                onChange={handleChange}
                className="input pl-10"
                required
              >
                <option value="">Select campus</option>
                {campuses.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {form.role === 'department_admin' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  name="department_id"
                  value={form.department_id}
                  onChange={handleChange}
                  className="input pl-10"
                  required
                  disabled={!form.campus_id}
                >
                  <option value="">Select department</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.type})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/super/admins')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdmin;