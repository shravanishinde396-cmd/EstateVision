import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Home, LayoutDashboard, LogOut, Menu, X, Landmark } from 'lucide-react';
import { logoutUser } from '../store/authSlice.js';

export default function MainLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'OWNER') return '/owner';
    return '/tenant';
  };

  const navLinks = [
    { label: 'Search Properties', path: '/properties' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 text-indigo-400 font-bold text-xl">
                <Landmark className="h-6 w-6 text-indigo-500" />
                <span>EstateVision</span>
              </Link>
              <nav className="hidden md:flex gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm font-medium transition-colors hover:text-indigo-400 ${
                      location.pathname === link.path ? 'text-indigo-400' : 'text-slate-300'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-slate-300 hover:text-red-400 text-sm font-semibold transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-slate-300 hover:text-white text-sm font-semibold">
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-slate-300 hover:text-white focus:outline-none"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block text-slate-300 hover:text-indigo-400 font-medium py-2"
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-slate-800 my-2" />
            {isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <Link
                  to={getDashboardLink()}
                  onClick={() => setIsOpen(false)}
                  className="flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="flex justify-center items-center gap-2 text-slate-300 hover:text-red-400 font-semibold py-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-center text-slate-300 hover:text-white font-semibold py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="text-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xl">
            <Landmark className="h-6 w-6 text-indigo-500" />
            <span>EstateVision</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} EstateVision. Built with MERN Stack + AI Analytics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
