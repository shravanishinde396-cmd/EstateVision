import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle2, MessageSquare, Send, UserCheck, Loader2 } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

export default function OwnerMaintenance() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  // Assign technician form
  const [assigningId, setAssigningId] = useState(null);
  const [assignedTo, setAssignedTo] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const fetchTickets = () => {
    api.get('/maintenance')
      .then((res) => {
        setTickets(res.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const selectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setComments(ticket.comments || []);
  };

  const handleUpdateStatus = (id, status) => {
    api.patch(`/maintenance/${id}/status`, { status })
      .then(() => {
        toast.success(`Ticket status updated to ${status}`);
        fetchTickets();
        if (selectedTicket?._id === id) {
          setSelectedTicket((prev) => ({ ...prev, status }));
        }
      })
      .catch((err) => {
        toast.error('Failed to update status');
      });
  };

  const handleAssignTechnician = (e, id) => {
    e.preventDefault();
    if (!assignedTo) {
      toast.error('Technician details required');
      return;
    }

    api.patch(`/maintenance/${id}/assign`, { assignedTo, scheduledAt })
      .then(() => {
        toast.success('Technician assigned successfully!');
        setAssigningId(null);
        setAssignedTo('');
        setScheduledAt('');
        fetchTickets();
      })
      .catch((err) => {
        toast.error('Failed to assign technician');
      });
  };

  const onSubmitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTicket) return;

    api.post(`/maintenance/${selectedTicket._id}/comments`, { content: commentText })
      .then((res) => {
        setComments((prev) => [...prev, res.data.data]);
        setCommentText('');
      })
      .catch((err) => {
        toast.error('Failed to post comment');
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
        <h1 className="text-3xl font-extrabold text-white">Maintenance Manager</h1>
        <p className="text-slate-400 text-sm mt-1">Review tenant repair requests, dispatch technicians, and manage logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4 overflow-y-auto max-h-[600px]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wrench className="h-5 w-5 text-indigo-400" />
            Repair Tickets Ledger
          </h2>

          <div className="overflow-x-auto border-t border-slate-800 mt-4">
            <table className="w-full text-left text-sm text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3.5">Property / Tenant</th>
                  <th className="py-3.5">Category</th>
                  <th className="py-3.5">Priority</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-xs text-slate-500">No repair requests logged.</td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr
                      key={t._id}
                      onClick={() => selectTicket(t)}
                      className={`hover:bg-slate-900/35 cursor-pointer ${
                        selectedTicket?._id === t._id ? 'bg-slate-900/40 text-indigo-400' : ''
                      }`}
                    >
                      <td className="py-3.5 font-bold text-slate-200">
                        {t.property?.title}
                        <span className="text-[10px] text-slate-500 block font-normal">Tenant: {t.tenant?.firstName} {t.tenant?.lastName}</span>
                      </td>
                      <td className="py-3.5 uppercase text-xs">{t.category}</td>
                      <td className="py-3.5 text-xs font-semibold">{t.priority}</td>
                      <td className="py-3.5 uppercase text-[10px] font-bold">
                        <span className={`px-2 py-0.5 rounded-full ${
                          t.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-indigo-400 bg-indigo-500/10'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-y-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setAssigningId(assigningId === t._id ? null : t._id)}
                            className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                          >
                            Assign Tech
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(t._id, 'COMPLETED')}
                            className="bg-emerald-600/20 text-emerald-450 hover:bg-emerald-600/35 border border-emerald-500/10 p-1.5 rounded-lg"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </div>

                        {assigningId === t._id && (
                          <form
                            onSubmit={(e) => handleAssignTechnician(e, t._id)}
                            className="mt-2 p-3 bg-slate-900 rounded-lg text-left max-w-xs ml-auto border border-slate-800 space-y-3"
                          >
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Technician (Name & Phone)</label>
                              <input
                                type="text"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                placeholder="e.g. Electrician Ram (98765)"
                                className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Schedule At</label>
                              <input
                                type="date"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100"
                              />
                            </div>
                            <button
                              type="submit"
                              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 rounded text-xs"
                            >
                              Dispatch Technician
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Ticket Comments */}
        <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between max-h-[600px]">
          {selectedTicket ? (
            <>
              <div className="border-b border-slate-800 pb-4 mb-4">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block mb-1">{selectedTicket.category}</span>
                <h3 className="font-bold text-white text-sm">{selectedTicket.title}</h3>
                <p className="text-xs text-slate-450 mt-1 leading-relaxed">{selectedTicket.description}</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
                {comments.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-8">No comments on this request.</p>
                ) : (
                  comments.map((c, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-850 p-3 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between text-[10px] text-indigo-400 font-semibold">
                        <span>{c.author?.firstName || 'User'}</span>
                        <span className="text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-350">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={onSubmitComment} className="flex gap-2 border-t border-slate-800 pt-4">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 p-2.5 rounded-xl text-white transition-all shadow-lg"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-6">
              <MessageSquare className="h-8 w-8 mb-2" />
              <p className="text-xs">Select a maintenance request from ledger to view comments and chat with tenant.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
