import { useEffect, useState } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data.unread_count);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getNotifPath = () => {
    if (user?.role === 'student') return '/student/notifications';
    if (user?.role === 'department_admin') return '/admin/notifications';
    if (user?.role === 'management') return '/management/notifications';
    if (user?.role === 'super_admin') return '/super/notifications';
    return '/login';
  };
  
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
      <div>
        <h2 className="font-semibold text-slate-900">
          Welcome back, {user?.name?.split(' ')[0]}
        </h2>
        <p className="text-xs text-slate-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          })}
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(getNotifPath())}
          className="relative p-2 rounded-lg hover:bg-slate-100 transition"
        >
          <Bell className="w-5 h-5 text-slate-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;