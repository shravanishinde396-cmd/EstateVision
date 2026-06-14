import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Wrench, Clock, AlertCircle, MessageSquare, Send, Plus, Loader2 } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

export default function TenantMaintenance() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

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

  const onSubmitTicket = (data) => {
    setSubmittingTicket(true);
    api.post('/maintenance', data)
      .then((res) => {
        toast.success('Maintenance ticket submitted successfully!');
        reset();
        fetchTickets();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to submit ticket');
      })
      .finally(() => setSubmittingTicket(false));
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
        <h1 className="text-3xl font-extrabold text-white">Maintenance Tickets</h1>
        <p className="text-slate-400 text-sm mt-1">Submit tickets and discuss resolutions with property owners.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submit ticket column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-400" />
              Submit Repair Request
            </h2>
            <form onSubmit={handleSubmit(onSubmitTicket)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Request Title</label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  placeholder="e.g. Bathroom Leakage"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
                {errors.title && <span className="text-xs text-red-400 mt-1 block">{errors.title.message}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="PLUMBING">Plumbing</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="HVAC">HVAC / Air Conditioning</option>
                  <option value="APPLIANCE">Appliance Repair</option>
                  <option value="PEST_CONTROL">Pest Control</option>
                  <option value="OTHER">Other Issues</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                <select
                  {...register('priority', { required: 'Priority is required' })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="LOW">Low (Cosmetic)</option>
                  <option value="MEDIUM">Medium (Normal)</option>
                  <option value="HIGH">High (Urgent Repair)</option>
                  <option value="URGENT">Urgent (Safety Threat)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  rows="4"
                  {...register('description', { required: 'Description is required' })}
                  placeholder="Explain details of the issue..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
                {errors.description && <span className="text-xs text-red-400 mt-1 block">{errors.description.message}</span>}
              </div>

              <button
                type="submit"
                disabled={submittingTicket}
                className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg"
              >
                {submittingTicket ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </div>

        {/* Tickets and chat listing */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tickets List */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 overflow-y-auto max-h-[600px]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-400" />
              Ticket History
            </h2>
            <div className="divide-y divide-slate-850">
              {tickets.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No maintenance logs submitted.</p>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => selectTicket(t)}
                    className={`py-4 cursor-pointer transition-all ${
                      selectedTicket?._id === t._id ? 'text-indigo-400 font-semibold pl-2' : 'hover:pl-1 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold uppercase tracking-wider">{t.category}</span>
                      <span className="text-[10px] text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm line-clamp-1">{t.title}</h4>
                    <span className="inline-flex text-[9px] font-bold mt-2 bg-slate-800 px-2 py-0.5 rounded uppercase">
                      {t.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ticket Chat / Comments Drawer */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between max-h-[600px]">
            {selectedTicket ? (
              <>
                <div className="border-b border-slate-800 pb-4 mb-4">
                  <h3 className="font-bold text-white text-sm">{selectedTicket.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{selectedTicket.description}</p>
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
                        <p className="text-slate-300">{c.content}</p>
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
                <p className="text-xs">Select a maintenance ticket from history to view discussions and comments.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
