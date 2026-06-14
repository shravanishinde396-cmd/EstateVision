import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import {
  Home,
  LayoutDashboard,
  Building2,
  FileText,
  Wrench,
  DollarSign,
  User,
  Users,
  Bell,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  Landmark,
} from 'lucide-react';
import { logoutUser } from '../store/authSlice.js';
import toast from 'react-hot-toast';

export default function DashboardLayout() {
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  // Real-time socket notification setup
  useEffect(() => {
    if (!user) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      auth: { token: localStorage.getItem('token') },
    });

    socket.on('notification:new', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      toast.success(notif.title);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const getNavLinks = () => {
    if (!user) return [];
    if (user.role === 'ADMIN') {
      return [
        { label: 'Overview', path: '/admin', icon: LayoutDashboard },
        { label: 'Users Directory', path: '/admin/users', icon: Users },
        { label: 'Pending Approvals', path: '/admin/properties', icon: ShieldAlert },
        { label: 'Audit Logs', path: '/admin/logs', icon: ShieldAlert },
      ];
    }
    if (user.role === 'OWNER') {
      return [
        { label: 'Overview', path: '/owner', icon: LayoutDashboard },
        { label: 'My Properties', path: '/owner/properties', icon: Building2 },
        { label: 'Lease Contracts', path: '/owner/leases', icon: FileText },
        { label: 'Maintenance', path: '/owner/maintenance', icon: Wrench },
        { label: 'Revenue & ROI', path: '/owner/revenue', icon: DollarSign },
      ];
    }
    // Tenant Links
    return [
      { label: 'Overview', path: '/tenant', icon: LayoutDashboard },
      { label: 'Pay Rent', path: '/tenant/rent', icon: DollarSign },
      { label: 'Maintenance', path: '/tenant/maintenance', icon: Wrench },
      { label: 'My Documents', path: '/tenant/documents', icon: FileText },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transition-transform md:translate-x-0 md:static ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2 text-indigo-400 font-bold text-xl">
            <Landmark className="h-6 w-6 text-indigo-500" />
            <span>EstateVision</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-white">
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-850 shadow-2xl z-50 overflow-hidden py-2">
                  <h3 className="px-4 py-2 text-sm font-semibold border-b border-slate-800 text-indigo-400">Notifications</h3>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-4 text-xs text-slate-500 text-center">No new notifications</p>
                    ) : (
                      notifications.map((n, i) => (
                        <div key={i} className="px-4 py-3 border-b border-slate-800 hover:bg-slate-800/40 text-xs">
                          <p className="font-semibold text-slate-200">{n.title}</p>
                          <p className="text-slate-400 mt-1">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown Header */}
            <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.firstName?.charAt(0) || <User className="h-4 w-4" />}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-200">{user?.fullName}</p>
                <span className="text-[10px] bg-slate-800 text-indigo-400 px-2 py-0.5 rounded-full uppercase font-medium">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Route Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
