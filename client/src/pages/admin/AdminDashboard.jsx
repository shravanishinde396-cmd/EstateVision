import React, { useState, useEffect } from 'react';
import { Users, Building2, ShieldAlert, DollarSign, Activity, Loader2 } from 'lucide-react';
import api from '../../services/api.js';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/metrics'),
      api.get('/admin/audit-logs'),
    ])
      .then(([metricsRes, logsRes]) => {
        setMetrics(metricsRes.data.data);
        setLogs(logsRes.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Active Users', value: metrics?.totalUsers || 0, icon: Users, color: 'text-indigo-400' },
    { label: 'Total Listings', value: metrics?.totalProperties || 0, icon: Building2, color: 'text-blue-400' },
    { label: 'Pending Approvals', value: metrics?.pendingApprovals || 0, icon: ShieldAlert, color: 'text-yellow-400' },
    { label: 'Platform Transactions', value: `₹${(metrics?.totalTransactionsValue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">System Admin Control</h1>
        <p className="text-slate-400 text-sm mt-1">Monitor users, approve properties, and inspect audit trails.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase">{card.label}</span>
                <span className="text-2xl font-black text-white mt-1.5 block">{card.value}</span>
              </div>
              <div className={`p-3 bg-slate-800 rounded-xl ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Live System Activity Feed */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-400" />
          Recent Audit Trail Logs
        </h2>
        <div className="overflow-x-auto border-t border-slate-800 mt-4">
          <table className="w-full text-left text-sm text-slate-450">
            <thead>
              <tr className="border-b border-slate-850 text-slate-500 font-semibold">
                <th className="py-3">Triggered By</th>
                <th className="py-3">Action Type</th>
                <th className="py-3">Resource Target</th>
                <th className="py-3">IP Address</th>
                <th className="py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {logs.slice(0, 5).map((l, i) => (
                <tr key={i} className="hover:bg-slate-900/35">
                  <td className="py-3 text-slate-200">{l.user?.email || 'System / Cron'}</td>
                  <td className="py-3 font-semibold uppercase text-xs text-indigo-400">{l.action}</td>
                  <td className="py-3 truncate max-w-xs">{l.resource}</td>
                  <td className="py-3 font-mono text-xs">{l.ipAddress}</td>
                  <td className="py-3 text-right text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
