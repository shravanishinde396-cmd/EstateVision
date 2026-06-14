import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Loader2 } from 'lucide-react';
import api from '../../services/api.js';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs')
      .then((res) => {
        setLogs(res.data.data || []);
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">System Audit Trail</h1>
        <p className="text-slate-400 text-sm mt-1">Detailed history logs of system resource manipulations and user state mutations.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-400" />
          Audit Logs
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
              {logs.map((l, i) => (
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
