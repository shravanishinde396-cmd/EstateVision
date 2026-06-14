import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Sparkles, Shield, BadgePercent, ArrowRight, TrendingUp, Cpu } from 'lucide-react';
import api from '../services/api.js';

export default function LandingPage() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/properties/trending')
      .then((res) => {
        setTrending(res.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative overflow-hidden bg-slate-950 text-white">
      {/* Background Neon Glows */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[600px] right-1/4 h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-sm font-medium text-indigo-400 mb-8">
          <Sparkles className="h-4 w-4" />
          <span>Next-Generation Real Estate Platform</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-500 bg-clip-text text-transparent max-w-5xl mx-auto leading-tight">
          Automated Property Management Powered by Artificial Intelligence
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto">
          Forecast rent prices, calculate accurate asset ROI, automate leases, and receive instant digital payments with the world's most advanced property SaaS platform.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/properties"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/35 transition-all"
          >
            Explore Marketplace
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-slate-900 border border-slate-800 px-6 py-3.5 text-base font-semibold text-slate-200 hover:bg-slate-800 transition-all"
          >
            Sign Up
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">Platform Core Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-card p-8 rounded-2xl flex flex-col items-start hover:border-indigo-500/30 transition-all group">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">AI Price Forecasting</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              XGBoost ML modeling predicts rental yield values based on location, amenities, furnishing status, and historical data to prevent pricing inaccuracies.
            </p>
          </div>
          {/* Card 2 */}
          <div className="glass-card p-8 rounded-2xl flex flex-col items-start hover:border-indigo-500/30 transition-all group">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl mb-6 group-hover:scale-110 transition-transform">
              <BadgePercent className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">ROI Estimations</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Input acquisition values, expected rates of appreciation, taxes, and interest plans to compute a 10-year investment grade projection report.
            </p>
          </div>
          {/* Card 3 */}
          <div className="glass-card p-8 rounded-2xl flex flex-col items-start hover:border-indigo-500/30 transition-all group">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl mb-6 group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Instant Rent Gateways</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Accept credit card, netbanking, and UPI payments securely. Signature verification secures all transactional updates.
            </p>
          </div>
        </div>
      </section>

      {/* Trending Properties Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-indigo-400" />
            <h2 className="text-3xl font-bold">Trending Marketplaces</h2>
          </div>
          <Link to="/properties" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
            See all properties <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : trending.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No properties active in the marketplace.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trending.map((p) => (
              <Link
                key={p._id}
                to={`/properties/${p.slug || p._id}`}
                className="glass-card rounded-2xl overflow-hidden hover:-translate-y-1 transition-all hover:border-indigo-500/30 group flex flex-col"
              >
                <div className="h-56 overflow-hidden bg-slate-800 relative">
                  <img
                    src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-4 right-4 bg-indigo-600 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    ₹{p.rentAmount.toLocaleString('en-IN')}/mo
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-200 mb-1 group-hover:text-indigo-400 transition-colors line-clamp-1">{p.title}</h3>
                    <p className="text-xs text-slate-400 mb-4">{p.area}, {p.city}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-4">
                    <span>{p.bedrooms} Beds · {p.bathrooms} Baths</span>
                    <span>{p.areaSqft} sqft</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
