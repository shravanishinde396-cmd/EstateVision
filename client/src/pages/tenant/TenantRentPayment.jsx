import React, { useState, useEffect } from 'react';
import { CreditCard, FileText, CheckCircle2, ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function TenantRentPayment() {
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Fetch lease and payments history in parallel
    Promise.all([
      api.get('/leases/tenant/current'),
      api.get('/payments/history'),
    ])
      .then(([leaseRes, historyRes]) => {
        setLease(leaseRes.data.data);
        setHistory(historyRes.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handlePayRent = async () => {
    if (!lease) return;
    setPayLoading(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Razorpay SDK failed to load. Are you offline?');
      setPayLoading(false);
      return;
    }

    try {
      const today = new Date();
      const month = today.getMonth() + 1; // 1-indexed
      const year = today.getFullYear();

      // Create Order
      const { data } = await api.post('/payments/create-order', {
        leaseId: lease._id,
        month,
        year,
      });

      const orderData = data.data;

      const options = {
        key: orderData.key,
        amount: orderData.orderId.amount, // in paise
        currency: orderData.currency,
        name: 'EstateVision',
        description: `Rent Payment for ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            const verifyPayload = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            };

            const verification = await api.post('/payments/verify', verifyPayload);
            if (verification.data.success) {
              toast.success('Rent paid successfully! Receipt sent via email.');
              // Refresh history
              const historyRes = await api.get('/payments/history');
              setHistory(historyRes.data.data || []);
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
          }
        },
        prefill: {
          name: orderData.prefill.name,
          email: orderData.prefill.email,
        },
        theme: {
          color: '#6366f1',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setPayLoading(false);
    }
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
        <h1 className="text-3xl font-extrabold text-white">Rent Portal</h1>
        <p className="text-slate-400 text-sm mt-1">Make secure digital payments via Razorpay Gateway.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment actions column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-indigo-950/35 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-400" />
              Pay Rent Dues
            </h2>

            {lease ? (
              <div className="space-y-6">
                <div>
                  <span className="block text-xs text-slate-500 uppercase font-semibold">Active Lease Monthly Rent</span>
                  <span className="text-3xl font-black text-white">₹{lease.monthlyRent.toLocaleString('en-IN')}</span>
                </div>

                <div className="border-t border-slate-800 pt-4 text-xs text-slate-400 space-y-1">
                  <p className="flex justify-between"><span>Base Rent:</span> <span className="font-semibold text-slate-200">₹{lease.monthlyRent.toLocaleString()}</span></p>
                  <p className="flex justify-between"><span>Grace Period:</span> <span className="font-semibold text-slate-200">Till 5th of Month</span></p>
                </div>

                <button
                  onClick={handlePayRent}
                  disabled={payLoading}
                  className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-sm"
                >
                  {payLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Pay Now via Razorpay'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No active lease found to pay rent.</p>
            )}
          </div>

          <div className="glass p-6 rounded-2xl border border-slate-800 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Secure Checkout</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                All transactions are encrypted. Signature validation checks occur server-side immediately upon execution.
              </p>
            </div>
          </div>
        </div>

        {/* Payment history column */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            Payment History Ledger
          </h2>

          <div className="overflow-x-auto border-t border-slate-800 mt-4">
            <table className="w-full text-left text-sm text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3.5">For Period</th>
                  <th className="py-3.5">Total Paid</th>
                  <th className="py-3.5">Transaction ID</th>
                  <th className="py-3.5">Method</th>
                  <th className="py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-xs text-slate-500">No completed rent transactions on file.</td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h._id} className="hover:bg-slate-900/35">
                      <td className="py-3.5 font-medium text-slate-200">
                        {new Date(h.forYear, h.forMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 font-bold text-slate-100">₹{h.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 font-mono text-[10px]">{h.razorpayPaymentId || 'N/A'}</td>
                      <td className="py-3.5 uppercase text-xs">{h.paymentMethod || 'UPI'}</td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full uppercase">
                          <CheckCircle2 className="h-3 w-3" />
                          Success
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
