import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Shield, FileText, Calendar, User, Landmark, DollarSign, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../services/api.js';

export default function TenantDashboard() {
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leases/tenant/current')
      .then((res) => {
        setLease(res.data.data);
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
        <h1 className="text-3xl font-extrabold text-white">Tenant Portal</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your active lease, payments, and services.</p>
      </div>

      {!lease ? (
        <div className="glass p-8 rounded-2xl border border-slate-800 text-center max-w-2xl">
          <Landmark className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-200">No Active Lease Contract</h2>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            You do not currently have an active lease contract. Explore the marketplace to find properties and submit rental applications.
          </p>
          <RouterLink
            to="/properties"
            className="inline-flex items-center gap-2 mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
          >
            Find Properties
            <ArrowRight className="h-4 w-4" />
          </RouterLink>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lease Details */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              Active Lease Summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-800 pt-6">
              <div>
                <span className="block text-xs text-slate-500 uppercase font-semibold">Lease Address</span>
                <span className="text-base font-bold text-white mt-1 block">{lease.property?.address}, {lease.property?.city}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 uppercase font-semibold">Monthly Rent</span>
                <span className="text-base font-bold text-indigo-400 mt-1 block">₹{lease.monthlyRent.toLocaleString('en-IN')}/mo</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 uppercase font-semibold">Security Deposit</span>
                <span className="text-base font-bold text-white mt-1 block">₹{lease.securityDeposit.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 uppercase font-semibold">Start / End Date</span>
                <span className="text-sm font-semibold text-slate-300 mt-1 block">
                  {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Owner details card */}
          <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-400" />
                Landlord Contact
              </h2>
              <div className="border-t border-slate-800 pt-4 space-y-2 text-sm">
                <p className="font-bold text-white">{lease.owner?.firstName} {lease.owner?.lastName}</p>
                <p className="text-slate-400">📧 {lease.owner?.email}</p>
                <p className="text-slate-400">📞 {lease.owner?.phone}</p>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-800 pt-4 flex gap-4">
              <RouterLink
                to="/tenant/rent"
                className="flex-1 flex justify-center items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 text-xs shadow-lg transition-all"
              >
                <DollarSign className="h-4 w-4" />
                Pay Rent
              </RouterLink>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
