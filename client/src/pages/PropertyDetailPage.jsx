import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Sparkles, AlertCircle, Info, Calculator, Coins, TrendingUp, Loader2 } from 'lucide-react';
import api from '../services/api.js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PropertyDetailPage() {
  const { idOrSlug } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI states
  const [prediction, setPrediction] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);

  const [purchasePrice, setPurchasePrice] = useState('');
  const [appreciationRate, setAppreciationRate] = useState('6.0');
  const [roiReport, setRoiReport] = useState(null);
  const [roiLoading, setRoiLoading] = useState(false);

  const [adviceReport, setAdviceReport] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  useEffect(() => {
    api.get(`/properties/${idOrSlug}`)
      .then((res) => {
        setProperty(res.data.data);
        setPurchasePrice(res.data.data.rentAmount * 250); // rule of thumb initial price
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [idOrSlug]);

  const runPricePrediction = () => {
    if (!property) return;
    setPredictLoading(true);
    api.post('/ai/predict-price', {
      city: property.city,
      area: property.area,
      area_sqft: property.areaSqft,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      property_type: property.propertyType,
      furnishing: property.furnishingStatus,
    })
      .then((res) => setPrediction(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setPredictLoading(false));
  };

  const calculateROIReport = (e) => {
    e.preventDefault();
    if (!property) return;
    setRoiLoading(true);
    api.post('/ai/roi-calculate', {
      purchase_price: parseFloat(purchasePrice),
      monthly_rent: property.rentAmount,
      maintenance_monthly: property.maintenanceCharges || 0,
      property_tax_annual: property.rentAmount * 0.5, // estimate
      appreciation_rate: parseFloat(appreciationRate),
    })
      .then((res) => setRoiReport(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setRoiLoading(false));
  };

  const generateAIAdvice = () => {
    if (!property) return;
    setAdviceLoading(true);
    api.post('/ai/generate-advice', {
      title: property.title,
      city: property.city,
      area: property.area,
      rent_amount: property.rentAmount,
      deposit_amount: property.depositAmount,
      area_sqft: property.areaSqft,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      property_type: property.propertyType,
      description: property.description || '',
    })
      .then((res) => setAdviceReport(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setAdviceLoading(false));
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-xl font-bold text-white mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} className="text-lg font-semibold text-white mt-3 mb-1">{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={idx} className="text-sm font-bold text-white my-1">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const cleanLine = line.substring(2);
        const parts = cleanLine.split('**');
        return (
          <li key={idx} className="text-slate-300 text-sm ml-6 list-disc my-1.5 leading-relaxed">
            {parts.map((part, pidx) => pidx % 2 === 1 ? <strong key={pidx} className="text-emerald-400 font-semibold">{part}</strong> : part)}
          </li>
        );
      }
      if (line.startsWith('> ')) {
        return <blockquote key={idx} className="border-l-4 border-emerald-500 pl-4 italic text-slate-400 my-2">{line.replace('> ', '')}</blockquote>;
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      const parts = line.split('**');
      return (
        <p key={idx} className="text-slate-300 text-sm leading-relaxed my-1.5">
          {parts.map((part, pidx) => pidx % 2 === 1 ? <strong key={pidx} className="text-emerald-400 font-semibold">{part}</strong> : part)}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white">Property Not Found</h2>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Property Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Images */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
            <img
              src={property.images?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="glass p-6 rounded-2xl border border-slate-800">
            <h1 className="text-3xl font-extrabold text-white">{property.title}</h1>
            <p className="text-slate-400 mt-2">{property.address}, {property.city}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 border-t border-slate-800 pt-6">
              <div>
                <span className="block text-xs text-slate-500 uppercase font-semibold">Rent Amount</span>
                <span className="text-xl font-bold text-white">₹{property.rentAmount.toLocaleString('en-IN')}/mo</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 uppercase font-semibold">Deposit</span>
                <span className="text-xl font-bold text-white">₹{property.depositAmount.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 uppercase font-semibold">Size</span>
                <span className="text-xl font-bold text-white">{property.areaSqft} Sqft</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 uppercase font-semibold">Beds/Baths</span>
                <span className="text-xl font-bold text-white">{property.bedrooms}BHK / {property.bathrooms}BA</span>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-800 pt-6">
              <h3 className="font-bold text-lg text-white mb-2">Description</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{property.description}</p>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analytics Widgets */}
        <div className="space-y-6">
          {/* Price Prediction Widget */}
          <div className="glass p-6 rounded-2xl border border-indigo-950/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-4 text-indigo-400">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-bold text-lg text-white">AI Price Predictor</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Analyze marketplace factors to estimate fair lease values for this specific structure.
            </p>

            {prediction ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400 block">Predicted Optimal Rent</span>
                  <span className="text-2xl font-extrabold text-white">₹{prediction.predicted_price.toLocaleString('en-IN')}/mo</span>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                    <span>Min: ₹{prediction.price_range.min.toLocaleString()}</span>
                    <span>Max: ₹{prediction.price_range.max.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Confidence Score</span>
                  <span className="font-bold text-indigo-400">{(prediction.confidence_score * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Market Comparison</span>
                  <span className="font-semibold text-slate-200">{prediction.market_comparison.vs_area_percent}% vs Area avg</span>
                </div>
              </div>
            ) : (
              <button
                onClick={runPricePrediction}
                disabled={predictLoading}
                className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
              >
                {predictLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Run Price Prediction'}
              </button>
            )}
          </div>

          {/* ROI Calculator Widget */}
          <div className="glass p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 mb-4 text-emerald-400">
              <Calculator className="h-5 w-5" />
              <h3 className="font-bold text-lg text-white">ROI Estimator</h3>
            </div>
            <form onSubmit={calculateROIReport} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Acquisition Cost (₹)</label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Appreciation Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={appreciationRate}
                  onChange={(e) => setAppreciationRate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg"
              >
                Calculate ROI
              </button>
            </form>
          </div>

          {/* NVIDIA AI Advisor Widget */}
          <div className="glass p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-4 text-emerald-400">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-bold text-lg text-white">NVIDIA AI Advisor</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Get an in-depth professional real estate investment report generated by NVIDIA's high-performance AI models.
            </p>

            <button
              type="button"
              onClick={generateAIAdvice}
              disabled={adviceLoading}
              className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg"
            >
              {adviceLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : adviceReport ? 'Regenerate Advisor Report' : 'Request NVIDIA AI Advice'}
            </button>
          </div>
        </div>
      </div>

      {/* ROI Report Details */}
      {roiReport && (
        <div className="glass p-8 rounded-2xl border border-emerald-950/30 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-emerald-400">
              <Coins className="h-6 w-6" />
              <h3 className="font-bold text-xl text-white">Investment Grade Assessment</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-emerald-600/20 text-emerald-400 flex items-center justify-center rounded-2xl text-2xl font-black border border-emerald-500/20">
                {roiReport.grade}
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Investment Score</span>
                <span className="text-2xl font-extrabold text-white">{roiReport.investment_score}/100</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{roiReport.recommendation}</p>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
              <div>
                <span className="text-xs text-slate-500 block">Annual Gross Yield</span>
                <span className="text-lg font-bold text-white">{roiReport.gross_yield_percent}%</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Break Even</span>
                <span className="text-lg font-bold text-white">{roiReport.break_even_years} Years</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-bold text-white text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" />
              10-Year Wealth Projection
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={roiReport.ten_year_projection}>
                  <XAxis dataKey="year" stroke="#475569" />
                  <YAxis stroke="#475569" />
                  <Tooltip contentStyle={{ background: '#1e293b', borderColor: '#334155' }} labelStyle={{ color: '#fff' }} />
                  <Line type="monotone" dataKey="property_value" stroke="#34d399" strokeWidth={2} name="Asset Value" />
                  <Line type="monotone" dataKey="total_wealth" stroke="#6366f1" strokeWidth={2} name="Cumulative Returns" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* NVIDIA AI Advice Report Details */}
      {adviceReport && (
        <div className="glass p-8 rounded-2xl border border-emerald-950/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-48 w-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Sparkles className="h-6 w-6" />
              <h3 className="font-bold text-xl text-white">NVIDIA AI Investment Advice Report</h3>
            </div>
            <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full font-medium">
              Model: {adviceReport.model}
            </span>
          </div>
          <div className="space-y-2 select-text">
            {renderMarkdown(adviceReport.advice)}
          </div>
        </div>
      )}
    </div>
  );
}
