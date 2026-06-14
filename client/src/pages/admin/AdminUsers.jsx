import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Ban, UserCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tenantDocs, setTenantDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const fetchUsers = () => {
    api.get('/admin/users')
      .then((res) => {
        setUsers(res.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    api.patch(`/admin/users/${id}/status`, { status: newStatus })
      .then(() => {
        toast.success(`User status updated to ${newStatus}`);
        fetchUsers();
      })
      .catch((err) => {
        toast.error('Failed to update status');
      });
  };

  const handleVerifyDocument = (userId, docId) => {
    api.patch(`/admin/tenants/${userId}/documents/${docId}/verify`)
      .then(() => {
        toast.success('Document marked as verified!');
        // Refresh docs
        api.get(`/admin/tenants/${userId}/documents`)
          .then((res) => setTenantDocs(res.data.data || []));
      })
      .catch(() => toast.error('Verification update failed'));
  };

  const viewUserDocuments = (user) => {
    setSelectedUser(user);
    if (user.role !== 'TENANT') {
      setTenantDocs([]);
      return;
    }
    setDocsLoading(true);
    api.get(`/admin/tenants/${user._id}/documents`)
      .then((res) => {
        setTenantDocs(res.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setDocsLoading(false));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Users Directory</h1>
        <p className="text-slate-400 text-sm mt-1">Manage tenant and owner profiles, inspect verification credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users Table */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            Registered Accounts
          </h2>

          <div className="overflow-x-auto border-t border-slate-800 mt-4">
            <table className="w-full text-left text-sm text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3.5">Name / Email</th>
                  <th className="py-3.5">Phone</th>
                  <th className="py-3.5">Role</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {users.map((u) => (
                  <tr
                    key={u._id}
                    onClick={() => viewUserDocuments(u)}
                    className={`hover:bg-slate-900/35 cursor-pointer ${
                      selectedUser?._id === u._id ? 'bg-slate-900/40 text-indigo-400' : ''
                    }`}
                  >
                    <td className="py-3.5 font-bold text-slate-200">
                      {u.firstName} {u.lastName}
                      <span className="text-xs text-slate-500 block font-normal">{u.email}</span>
                    </td>
                    <td className="py-3.5 font-mono text-xs">{u.phone || 'N/A'}</td>
                    <td className="py-3.5 text-xs font-semibold">{u.role}</td>
                    <td className="py-3.5 text-xs uppercase font-bold">
                      <span className={`px-2 py-0.5 rounded-full ${
                        u.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleStatus(u._id, u.status)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          u.status === 'ACTIVE'
                            ? 'border-red-950 text-red-400 hover:bg-red-550/10'
                            : 'border-emerald-950 text-emerald-400 hover:bg-emerald-550/10'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? <Ban className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification details Panel */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between max-h-[600px] overflow-y-auto">
          {selectedUser ? (
            <div>
              <div className="border-b border-slate-800 pb-4 mb-4">
                <h3 className="font-bold text-white text-base">{selectedUser.firstName} {selectedUser.lastName}</h3>
                <span className="text-[10px] bg-slate-800 text-indigo-400 px-2 py-0.5 rounded uppercase font-bold">{selectedUser.role}</span>
              </div>

              {selectedUser.role !== 'TENANT' ? (
                <p className="text-xs text-slate-500 py-8 text-center">Verification credentials only required for Tenant roles.</p>
              ) : docsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                </div>
              ) : tenantDocs.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No identity files uploaded yet.</p>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Uploaded Verification Files</h4>
                  {tenantDocs.map((doc) => (
                    <div key={doc._id} className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{doc.name}</p>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">{doc.documentType}</span>
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 block mt-1 hover:underline">View File ↗</a>
                      </div>
                      <div>
                        {doc.isVerified ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => handleVerifyDocument(selectedUser._id, doc._id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] px-2.5 py-1 rounded uppercase transition-all shadow-md"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-6 py-20">
              <ShieldCheck className="h-8 w-8 mb-2" />
              <p className="text-xs">Select a user profile from accounts table to view verification documents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
