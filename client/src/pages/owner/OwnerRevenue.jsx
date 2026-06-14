import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, Landmark, TrendingUp, Loader2 } from 'lucide-react';
import api from '../../services/api.js';

export default function OwnerRevenue() {
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/owner/revenue'),
      api.get('/analytics/owner/occupancy'),
    ])
      .then(([revenueRes, occupancyRes]) => {
        setRevenueTrend(revenueRes.data.data || []);
        setOccupancyData(occupancyRes.data.data || []);
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
        <h1 className="text-3xl font-extrabold text-white">Revenue & occupancy Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Aggregated rent earnings and classification occupancy rates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trend Graph */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            Rent Earnings Trend (Expected vs Actual)
          </h2>
          <div className="h-72">
            {revenueTrend.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-20">No financial history logs.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#475569" />
                  <YAxis stroke="#475569" />
                  <Tooltip contentStyle={{ background: '#1e293b', borderColor: '#334155' }} labelStyle={{ color: '#fff' }} />
                  <Area type="monotone" dataKey="actual" stroke="#818cf8" fillOpacity={1} fill="url(#colorActual)" name="Actual Rent Received" />
                  <Area type="monotone" dataKey="expected" stroke="#10b981" fillOpacity={0} name="Expected Rent" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Occupancy rates class grid */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Landmark className="h-5 w-5 text-indigo-400" />
            Occupancy by Property Type
          </h2>
          <div className="h-72">
            {occupancyData.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-20">No units owned listed.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyData}>
                  <XAxis dataKey="type" stroke="#475569" />
                  <YAxis stroke="#475569" />
                  <Tooltip contentStyle={{ background: '#1e293b', borderColor: '#334155' }} />
                  <Bar dataKey="occupancyRate" fill="#818cf8" name="Occupancy %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
