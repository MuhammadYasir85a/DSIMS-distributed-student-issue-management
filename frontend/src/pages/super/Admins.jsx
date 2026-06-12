import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Trophy, ArrowRight, ChevronUp, ChevronDown, UserPlus } from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const SuperAdminAdmins = () => {
  const [view, setView] = useState('list');
  const [admins, setAdmins] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ role: '', status: '', search: '' });
  const [sortOrder, setSortOrder] = useState('best');

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      const res = await api.get(`/admins?${params}`);
      setAdmins(res.data.admins);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admins/leaderboard?days=90&sort=${sortOrder}`);
      setLeaderboard(res.data.leaderboard);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'list') fetchAdmins();
    else fetchLeaderboard();
  }, [view, page, filters.role, filters.status, sortOrder]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAdmins();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Admins</h1>
          <p className="text-slate-500 mt-1">View, monitor, and manage all system administrators</p>
        </div>
        <Link to="/super/admins/new" className="btn-primary">
          <UserPlus className="w-4 h-4" /> New Admin
        </Link>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            view === 'list' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          All Admins
        </button>
        <button
          onClick={() => setView('leaderboard')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition flex items-center gap-2 ${
            view === 'leaderboard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Trophy className="w-4 h-4" /> Leaderboard
        </button>
      </div>

      {view === 'list' ? (
        <>
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={filters.search}
                    onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                    className="input pl-10"
                  />
                </div>
                <button type="submit" className="btn-primary">Search</button>
              </form>

              <select
                value={filters.role}
                onChange={(e) => { setFilters(f => ({ ...f, role: e.target.value })); setPage(1); }}
                className="input max-w-[180px]"
              >
                <option value="">All Roles</option>
                <option value="department_admin">Department Admin</option>
                <option value="management">Management</option>
                <option value="super_admin">Super Admin</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
                className="input max-w-[150px]"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : admins.length === 0 ? (
            <EmptyState title="No admins found" message="Try different filters" />
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <Link
                  key={admin._id}
                  to={`/super/admins/${admin._id}`}
                  className="card p-5 flex items-center justify-between hover:shadow-md transition group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                      admin.role === 'super_admin' ? 'bg-gradient-to-br from-rose-500 to-rose-700' :
                      admin.role === 'management' ? 'bg-gradient-to-br from-sky-500 to-sky-700' :
                      'bg-gradient-to-br from-indigo-500 to-indigo-700'
                    }`}>
                      {admin.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition truncate">
                        {admin.name}
                      </p>
                      <p className="text-sm text-slate-500 truncate">{admin.email}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="bg-slate-100 px-2 py-0.5 rounded capitalize">
                          {admin.role?.replace(/_/g, ' ')}
                        </span>
                        {admin.campus_id?.name && <span>{admin.campus_id.name}</span>}
                        {admin.department_id?.name && <span>{admin.department_id.name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className={`badge ${
                      admin.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {admin.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                </Link>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm">
                    Previous
                  </button>
                  <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm">
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-slate-900">Performance Rankings (90 days)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder('best')}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${
                  sortOrder === 'best' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ChevronUp className="w-4 h-4" /> Best First
              </button>
              <button
                onClick={() => setSortOrder('worst')}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${
                  sortOrder === 'worst' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ChevronDown className="w-4 h-4" /> Worst First
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : leaderboard.length === 0 ? (
            <EmptyState title="No data yet" message="Performance rankings appear after feedback is collected" />
          ) : (
            <div className="space-y-3">
              {leaderboard.map((admin, i) => (
                <Link
                  key={admin._id}
                  to={`/super/admins/${admin._id}`}
                  className="card p-5 hover:shadow-md transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      i === 0 && sortOrder === 'best' ? 'bg-amber-100 text-amber-700' :
                      i === 1 && sortOrder === 'best' ? 'bg-slate-100 text-slate-700' :
                      i === 2 && sortOrder === 'best' ? 'bg-orange-100 text-orange-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      #{i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition truncate">
                        {admin.admin_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {admin.department_name} · {admin.campus_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="font-bold text-lg text-slate-900">{admin.avg_rating}</span>
                          <span className="text-sm text-slate-500">/5</span>
                        </div>
                        <p className="text-xs text-slate-500">{admin.total_feedbacks} feedbacks</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SuperAdminAdmins;