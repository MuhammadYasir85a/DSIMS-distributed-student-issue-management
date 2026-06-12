import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, Bell, User, Users, MessageSquare, 
  Plus, Shield, UserCheck, BarChart3
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  
  const studentLinks = [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/issues', label: 'My Issues', icon: FileText },
    { to: '/student/issues/new', label: 'New Issue', icon: Plus },
    { to: '/student/notifications', label: 'Notifications', icon: Bell },
    { to: '/student/profile', label: 'Profile', icon: User },
  ];
  
  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/issues', label: 'Department Issues', icon: FileText },
    { to: '/admin/pending-students', label: 'Pending Students', icon: UserCheck },
    { to: '/admin/feedback', label: 'My Feedback', icon: MessageSquare },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/profile', label: 'Profile', icon: User },
  ];

  const managementLinks = [
    { to: '/management', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/management/reports', label: 'Reports', icon: BarChart3 },
    { to: '/management/notifications', label: 'Notifications', icon: Bell },
    { to: '/management/profile', label: 'Profile', icon: User },
  ];
  
  const superLinks = [
    { to: '/super', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/super/issues', label: 'All Issues', icon: FileText },
    { to: '/super/admins', label: 'Manage Admins', icon: Users },
    { to: '/super/feedback', label: 'Escalations', icon: MessageSquare },
    { to: '/super/notifications', label: 'Notifications', icon: Bell },
    { to: '/super/profile', label: 'Profile', icon: User },
  ];
  
  const links = user?.role === 'student' ? studentLinks
              : user?.role === 'department_admin' ? adminLinks
              : user?.role === 'management' ? managementLinks
              : user?.role === 'super_admin' ? superLinks
              : [];

  const roleColor = user?.role === 'super_admin' ? 'from-rose-500 to-rose-700'
                  : user?.role === 'management' ? 'from-sky-500 to-sky-700'
                  : 'from-indigo-500 to-indigo-700';

  const roleLabel = user?.role === 'super_admin' ? 'Super Admin'
                  : user?.role === 'management' ? 'Management'
                  : user?.role === 'department_admin' ? 'Department Admin'
                  : 'Student';
  
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${roleColor} rounded-xl flex items-center justify-center`}>
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900">DSIMS</h1>
            <p className="text-xs text-slate-500">{roleLabel} Portal</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${roleColor} rounded-full flex items-center justify-center text-white font-bold`}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;