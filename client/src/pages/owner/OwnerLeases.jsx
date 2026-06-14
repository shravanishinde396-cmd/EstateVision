import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Plus, Ban, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

export default function OwnerLeases() {
  const [leases, setLeases] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Renewal thunk states
  const [renewingId, setRenewingId] = useState(null);
  const [newEndDate, setNewEndDate] = useState('');
  const [newRent, setNewRent] = useState('');

  const fetchLeaseData = () => {
    Promise.all([
      api.get('/leases'),
      api.get('/properties/owner/mine'),
    ])
      .then(([leasesRes, propertiesRes]) => {
        setLeases(leasesRes.data.data || []);
        // Only allow leasing active/approved properties
        setProperties(propertiesRes.data.data?.filter((p) => p.status === 'ACTIVE') || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeaseData();
  }, []);

  const onSubmit = (data) => {
    api.post('/leases', data)
      .then((res) => {
        toast.success('Lease agreement established successfully!');
        setShowForm(false);
        reset();
        fetchLeaseData();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to establish lease');
      });
  };

  const handleTerminate = (id) => {
    if (!window.confirm('Are you sure you want to terminate this lease?')) return;

    api.post(`/leases/${id}/terminate`, { terminationReason: 'Terminated by owner' })
      .then(() => {
        toast.success('Lease terminated successfully');
        fetchLeaseData();
      })
      .catch((err) => {
        toast.error('Termination failed');
      });
  };

  const handleRenew = (id) => {
    if (!newEndDate) {
      toast.error('Please enter a new end date');
      return;
    }

    api.post(`/leases/${id}/renew`, { newEndDate, newRent: newRent ? parseFloat(newRent) : undefined })
      .then(() => {
        toast.success('Lease renewed successfully!');
        setRenewingId(null);
        setNewEndDate('');
        setNewRent('');
        fetchLeaseData();
      })
      .catch((err) => {
        toast.error('Renewal failed');
      });
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Lease Contracts</h1>
          <p className="text-slate-400 text-sm mt-1">Manage active rental agreements, renewals, and terminations.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg"
        >
          <Plus className="h-5 w-5" />
          {showForm ? 'Close form' : 'Create Lease'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="glass p-8 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white mb-4">Establish Tenant Lease Agreement</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Property</label>
              <select
                {...register('property', { required: true })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              >
                {properties.length === 0 ? (
                  <option value="">No active/approved properties listed</option>
                ) : (
                  properties.map((p) => (
                    <option key={p._id} value={p._id}>{p.title} - ₹{p.rentAmount}/mo</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tenant ID (User Mongoose ID)</label>
              <input
                type="text"
                {...register('tenant', { required: 'Tenant User ID is required' })}
                placeholder="Paste tenant user object ID"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              />
              {errors.tenant && <span className="text-xs text-red-400 mt-1 block">{errors.tenant.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
              <input
                type="date"
                {...register('startDate', { required: true })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
              <input
                type="date"
                {...register('endDate', { required: true })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Monthly Rent (₹)</label>
              <input
                type="number"
                {...register('monthlyRent', { required: true })}
                placeholder="45000"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Security Deposit (₹)</label>
              <input
                type="number"
                {...register('securityDeposit', { required: true })}
                placeholder="150000"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg"
          >
            Establish Lease agreement
          </button>
        </form>
      )}

      {/* Leases ledger table */}
      <div className="glass-card p-6 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                <th className="py-3.5">Property Unit</th>
                <th className="py-3.5">Tenant Details</th>
                <th className="py-3.5">Start / End</th>
                <th className="py-3.5">Rent / Deposit</th>
                <th className="py-3.5">Status</th>
                <th className="py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {leases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-xs text-slate-500">No lease agreements drafted.</td>
                </tr>
              ) : (
                leases.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-900/35">
                    <td className="py-3.5 font-bold text-slate-200">
                      {l.property?.title || 'Unknown Property'}
                    </td>
                    <td className="py-3.5">
                      <p className="text-slate-100">{l.tenant?.firstName} {l.tenant?.lastName}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {l.tenant?._id}</p>
                    </td>
                    <td className="py-3.5 text-xs">
                      {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 font-semibold text-slate-200">
                      ₹{l.monthlyRent.toLocaleString('en-IN')}/mo <span className="text-[10px] text-slate-500 block">Dep: ₹{l.securityDeposit.toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 uppercase text-xs">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        l.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-450 bg-red-500/10'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-y-2">
                      {l.status === 'ACTIVE' && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setRenewingId(renewingId === l._id ? null : l._id)}
                            className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Renew
                          </button>
                          <button
                            onClick={() => handleTerminate(l._id)}
                            className="flex items-center gap-1 bg-slate-900 border border-red-950 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 font-semibold"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Terminate
                          </button>
                        </div>
                      )}

                      {/* Inline Renewal Input Form */}
                      {renewingId === l._id && (
                        <div className="mt-2 p-3 bg-slate-900 rounded-lg text-left max-w-xs ml-auto border border-slate-800 space-y-3">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">New End Date</label>
                            <input
                              type="date"
                              value={newEndDate}
                              onChange={(e) => setNewEndDate(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">New Rent (Optional)</label>
                            <input
                              type="number"
                              value={newRent}
                              onChange={(e) => setNewRent(e.target.value)}
                              placeholder="e.g. 50000"
                              className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100"
                            />
                          </div>
                          <button
                            onClick={() => handleRenew(l._id)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 rounded text-xs"
                          >
                            Confirm Renewal
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
