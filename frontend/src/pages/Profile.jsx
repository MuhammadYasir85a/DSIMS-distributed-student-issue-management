import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, GraduationCap, Lock, Save, Shield } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [contactForm, setContactForm] = useState({ contact_no: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [contactSaving, setContactSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        setProfile(res.data.user);
        setContactForm({ contact_no: res.data.user.contact_no || '' });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleContactUpdate = async (e) => {
    e.preventDefault();
    setContactSaving(true);
    try {
      await api.patch('/auth/me', { contact_no: contactForm.contact_no });
      toast.success('Contact updated successfully');
      const res = await api.get('/auth/me');
      setProfile(res.data.user);
      setUser({ ...user, contact_no: contactForm.contact_no });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setContactSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setPasswordSaving(true);
    try {
      await api.patch('/auth/me', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!profile) return null;

  const roleConfig = {
    student: { label: 'Student', color: 'bg-indigo-100 text-indigo-700' },
    department_admin: { label: 'Department Admin', color: 'bg-sky-100 text-sky-700' },
    management: { label: 'Management', color: 'bg-amber-100 text-amber-700' },
    super_admin: { label: 'Super Admin', color: 'bg-rose-100 text-rose-700' },
  };

  const role = roleConfig[profile.role] || roleConfig.student;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">View and update your account information</p>
      </div>

      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-3xl shrink-0">
            {profile.name?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                <p className="text-slate-500">{profile.email}</p>
              </div>
              <span className={`badge ${role.color}`}>
                <Shield className="w-3 h-3" />
                {role.label}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {profile.student_id && (
                <div className="text-sm">
                  <p className="text-slate-500 text-xs uppercase">Student ID</p>
                  <p className="font-medium text-slate-900">{profile.student_id}</p>
                </div>
              )}
              {profile.semester && (
                <div className="text-sm">
                  <p className="text-slate-500 text-xs uppercase">Semester</p>
                  <p className="font-medium text-slate-900">{profile.semester}</p>
                </div>
              )}
              {profile.campus_id?.name && (
                <div className="text-sm">
                  <p className="text-slate-500 text-xs uppercase">Campus</p>
                  <p className="font-medium text-slate-900">{profile.campus_id.name}</p>
                </div>
              )}
              {profile.department_id?.name && (
                <div className="text-sm">
                  <p className="text-slate-500 text-xs uppercase">Department</p>
                  <p className="font-medium text-slate-900">{profile.department_id.name}</p>
                </div>
              )}
              <div className="text-sm">
                <p className="text-slate-500 text-xs uppercase">Account Status</p>
                <p className="font-medium text-emerald-600 capitalize">{profile.status}</p>
              </div>
              {profile.last_login && (
                <div className="text-sm">
                  <p className="text-slate-500 text-xs uppercase">Last Login</p>
                  <p className="font-medium text-slate-900">{new Date(profile.last_login).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {profile.role === 'student' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Update Contact</h2>
          <form onSubmit={handleContactUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={contactForm.contact_no}
                  onChange={(e) => setContactForm({ contact_no: e.target.value })}
                  className="input pl-10"
                  placeholder="03001234567"
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={contactSaving} className="btn-primary">
              <Save className="w-4 h-4" />
              {contactSaving ? 'Saving...' : 'Update Contact'}
            </button>
          </form>
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Change Password</h2>
        <p className="text-sm text-slate-500 mb-4">Keep your account secure with a strong password</p>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm(f => ({ ...f, current_password: e.target.value }))}
                className="input pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm(f => ({ ...f, new_password: e.target.value }))}
                  className="input pl-10"
                  placeholder="Min 8 characters"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))}
                  className="input pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={passwordSaving} className="btn-primary">
            <Save className="w-4 h-4" />
            {passwordSaving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;