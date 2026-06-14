import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, FileText, Wrench, DollarSign, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../services/api.js';

export default function OwnerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/owner/overview')
      .then((res) => {
        setAnalytics(res.data.data);
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
    { label: 'Total Properties', value: analytics?.totalProperties || 0, icon: Building2, color: 'text-blue-400' },
    { label: 'Occupied Units', value: `${analytics?.rentedProperties || 0} (${analytics?.occupancyRate || 0}%)`, icon: Building2, color: 'text-indigo-400' },
    { label: 'Active Leases', value: analytics?.activeLeases || 0, icon: FileText, color: 'text-emerald-400' },
    { label: 'Total Earnings', value: `₹${(analytics?.totalEarnings || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-yellow-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Owner Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Monitor occupancy rates, revenue, and maintenance logs.</p>
      </div>

      {/* Grid of stats */}
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

      {/* Quick Actions */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold text-white">Quick Tasks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/owner/properties"
            className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500/20 hover:bg-slate-800/40 transition-all group"
          >
            <div>
              <h3 className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">Add Property</h3>
              <p className="text-xs text-slate-500 mt-0.5">List a new structure in the marketplace</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </Link>

          <Link
            to="/owner/leases"
            className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500/20 hover:bg-slate-800/40 transition-all group"
          >
            <div>
              <h3 className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">Draft Lease</h3>
              <p className="text-xs text-slate-500 mt-0.5">Establish tenancy agreement contract</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </Link>

          <Link
            to="/owner/maintenance"
            className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500/20 hover:bg-slate-800/40 transition-all group"
          >
            <div>
              <h3 className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">Assign Technician</h3>
              <p className="text-xs text-slate-500 mt-0.5">Handle {analytics?.pendingTickets || 0} pending maintenance requests</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
