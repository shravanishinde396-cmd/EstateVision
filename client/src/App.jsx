import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { fetchCurrentUser } from './store/authSlice.js';

// Layouts
import MainLayout from './layouts/MainLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

// Public Pages
import LandingPage from './pages/LandingPage.jsx';
import PropertiesPage from './pages/PropertiesPage.jsx';
import PropertyDetailPage from './pages/PropertyDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// Protected Tenant Portal
import TenantDashboard from './pages/tenant/TenantDashboard.jsx';
import TenantRentPayment from './pages/tenant/TenantRentPayment.jsx';
import TenantMaintenance from './pages/tenant/TenantMaintenance.jsx';
import TenantDocuments from './pages/tenant/TenantDocuments.jsx';

// Protected Owner Portal
import OwnerDashboard from './pages/owner/OwnerDashboard.jsx';
import OwnerProperties from './pages/owner/OwnerProperties.jsx';
import OwnerLeases from './pages/owner/OwnerLeases.jsx';
import OwnerMaintenance from './pages/owner/OwnerMaintenance.jsx';
import OwnerRevenue from './pages/owner/OwnerRevenue.jsx';

// Protected Admin Portal
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminProperties from './pages/admin/AdminProperties.jsx';
import AdminAuditLogs from './pages/admin/AdminAuditLogs.jsx';

// Guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
    </div>
  );
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainLayout><LandingPage /></MainLayout>} />
        <Route path="/properties" element={<MainLayout><PropertiesPage /></MainLayout>} />
        <Route path="/properties/:idOrSlug" element={<MainLayout><PropertyDetailPage /></MainLayout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard Tenant Routes */}
        <Route path="/tenant" element={<ProtectedRoute><RoleRoute allowedRoles={['TENANT']}><DashboardLayout /></RoleRoute></ProtectedRoute>}>
          <Route index element={<TenantDashboard />} />
          <Route path="rent" element={<TenantRentPayment />} />
          <Route path="maintenance" element={<TenantMaintenance />} />
          <Route path="documents" element={<TenantDocuments />} />
        </Route>

        {/* Dashboard Owner Routes */}
        <Route path="/owner" element={<ProtectedRoute><RoleRoute allowedRoles={['OWNER']}><DashboardLayout /></RoleRoute></ProtectedRoute>}>
          <Route index element={<OwnerDashboard />} />
          <Route path="properties" element={<OwnerProperties />} />
          <Route path="leases" element={<OwnerLeases />} />
          <Route path="maintenance" element={<OwnerMaintenance />} />
          <Route path="revenue" element={<OwnerRevenue />} />
        </Route>

        {/* Dashboard Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><DashboardLayout /></RoleRoute></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="logs" element={<AdminAuditLogs />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
