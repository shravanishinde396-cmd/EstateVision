import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = () => {
    api.get('/admin/properties/pending')
      .then((res) => {
        setProperties(res.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = (id, status) => {
    api.patch(`/admin/properties/${id}/approve`, { status })
      .then(() => {
        toast.success(`Property listing successfully marked as ${status}`);
        fetchPending();
      })
      .catch((err) => {
        toast.error('Listing approval process failed');
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
      <div>
        <h1 className="text-3xl font-extrabold text-white">Pending Approvals</h1>
        <p className="text-slate-400 text-sm mt-1">Review new property listings submitted by owners before publishing to marketplace.</p>
      </div>

      {properties.length === 0 ? (
        <div className="glass p-8 rounded-2xl border border-slate-800 text-center max-w-xl">
          <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-300">All caught up!</h3>
          <p className="text-slate-500 text-xs mt-1">No pending property listing approvals are waiting in queue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map((p) => (
            <div key={p._id} className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-slate-800">
              <div className="space-y-4">
                <div className="h-44 bg-slate-900 rounded-xl overflow-hidden relative border border-slate-800">
                  <img
                    src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80'}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="bg-indigo-600 text-white font-bold text-[10px] px-2.5 py-1 rounded uppercase">
                      ₹{p.rentAmount.toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-100 text-base line-clamp-1">{p.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{p.address}, {p.city}</p>
                  <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">{p.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 border-t border-slate-850 pt-4">
                  <p>Type: <span className="text-slate-300 font-semibold">{p.propertyType}</span></p>
                  <p>Furnishing: <span className="text-slate-300 font-semibold">{p.furnishingStatus}</span></p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-850 flex gap-4">
                <button
                  onClick={() => handleApprove(p._id, 'ACTIVE')}
                  className="flex-1 flex justify-center items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-xl text-xs transition-all shadow-md"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleApprove(p._id, 'REJECTED')}
                  className="flex-1 flex justify-center items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-red-400 border border-red-950 py-2 rounded-xl text-xs transition-all"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
