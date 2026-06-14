import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, Grid, Map as MapIcon, Loader2 } from 'lucide-react';
import api from '../services/api.js';

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    propertyType: '',
    minRent: '',
    maxRent: '',
    bedrooms: '',
  });

  const fetchFilteredProperties = () => {
    setLoading(true);
    // Clean empty values
    const query = {};
    Object.keys(filters).forEach((k) => {
      if (filters[k]) query[k] = filters[k];
    });

    api.get('/properties', { params: query })
      .then((res) => {
        setProperties(res.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFilteredProperties();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFilteredProperties();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Find Your Perfect Lease</h1>
          <p className="text-slate-400 text-sm mt-1">Explore real estate verified by AI analysis</p>
        </div>
        <button
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm font-semibold text-indigo-400 hover:text-white transition-all hover:bg-slate-800"
        >
          {showMap ? <Grid className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
          {showMap ? 'Show Grid View' : 'Show Split Map View'}
        </button>
      </div>

      {/* Filters Bar */}
      <form onSubmit={handleSearchSubmit} className="glass p-6 rounded-2xl mb-8 border border-slate-800/80">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Search Properties</label>
            <div className="relative">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by keywords or address..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <Search className="absolute right-3.5 top-3 h-5 w-5 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">City</label>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              placeholder="e.g. Mumbai"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Property Type</label>
            <select
              name="propertyType"
              value={filters.propertyType}
              onChange={handleFilterChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">All Types</option>
              <option value="APARTMENT">Apartment</option>
              <option value="HOUSE">House</option>
              <option value="VILLA">Villa</option>
              <option value="STUDIO">Studio</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Max Rent (₹)</label>
            <input
              type="number"
              name="maxRent"
              value={filters.maxRent}
              onChange={handleFilterChange}
              placeholder="e.g. 50000"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Main Content Layout */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        </div>
      ) : showMap ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-280px)] min-h-[500px]">
          {/* Left Grid */}
          <div className="overflow-y-auto pr-2 space-y-4">
            {properties.map((p) => (
              <Link
                key={p._id}
                to={`/properties/${p.slug || p._id}`}
                className="glass-card flex items-center p-4 rounded-xl overflow-hidden hover:border-indigo-500/25 transition-all group gap-4"
              >
                <div className="h-28 w-28 flex-shrink-0 bg-slate-800 rounded-lg overflow-hidden relative">
                  <img
                    src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=300&q=80'}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">{p.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{p.address}</p>
                  <p className="text-sm font-bold text-indigo-400 mt-2">₹{p.rentAmount.toLocaleString('en-IN')}/mo</p>
                </div>
              </Link>
            ))}
          </div>
          {/* Right Mock Map */}
          <div className="glass-card rounded-2xl relative overflow-hidden flex flex-col items-center justify-center p-6 border border-slate-800">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />
            <MapPin className="h-10 w-10 text-indigo-500 mb-2 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-200">Interactive Location Map</h3>
            <p className="text-xs text-slate-400 text-center mt-1 max-w-sm">Showing {properties.length} properties plotted geographically in target area.</p>
            {/* Coordinate plot visualizer */}
            <div className="mt-8 flex gap-3 flex-wrap justify-center">
              {properties.map((p, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-full text-[10px] text-slate-300">
                  📍 {p.area} ({p.location?.coordinates?.join(', ')})
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Regular grid view */
        properties.length === 0 ? (
          <p className="text-center text-slate-500 py-16">No properties found matching current filter specifications.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {properties.map((p) => (
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
        )
      )}
    </div>
  );
}
