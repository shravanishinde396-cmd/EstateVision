import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, Plus, Upload, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

export default function OwnerProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchProperties = () => {
    api.get('/properties/owner/mine')
      .then((res) => {
        setProperties(res.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const onSubmit = (data) => {
    api.post('/properties', data)
      .then((res) => {
        toast.success('Property registered successfully! Awaiting admin activation.');
        setShowAddForm(false);
        reset();
        fetchProperties();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to list property');
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    api.delete(`/properties/${id}`)
      .then(() => {
        toast.success('Property deleted');
        fetchProperties();
      })
      .catch((err) => {
        toast.error('Failed to delete property');
      });
  };

  const handleImageUpload = (e, id) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingId(id);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    api.post(`/properties/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then((res) => {
        toast.success('Images uploaded successfully!');
        fetchProperties();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Upload failed');
      })
      .finally(() => setUploadingId(null));
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
          <h1 className="text-3xl font-extrabold text-white">My Properties</h1>
          <p className="text-slate-400 text-sm mt-1">List structures and upload image folders.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25"
        >
          <Plus className="h-5 w-5" />
          {showAddForm ? 'Close form' : 'Add Property'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="glass p-8 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white mb-4">Register New Property</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Title</label>
              <input
                type="text"
                {...register('title', { required: 'Title is required' })}
                placeholder="e.g. Luxury 2BHK Apartment in Bandra"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              {errors.title && <span className="text-xs text-red-400 mt-1 block">{errors.title.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Property Type</label>
              <select
                {...register('propertyType', { required: true })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="VILLA">Villa</option>
                <option value="STUDIO">Studio</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rent Amount (₹)</label>
              <input
                type="number"
                {...register('rentAmount', { required: true })}
                placeholder="e.g. 45000"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deposit Amount (₹)</label>
              <input
                type="number"
                {...register('depositAmount', { required: true })}
                placeholder="e.g. 150000"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Area (Sqft)</label>
              <input
                type="number"
                {...register('areaSqft', { required: true })}
                placeholder="e.g. 1200"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Furnishing Status</label>
              <select
                {...register('furnishingStatus', { required: true })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="FURNISHED">Fully Furnished</option>
                <option value="SEMI_FURNISHED">Semi Furnished</option>
                <option value="UNFURNISHED">Unfurnished</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">City</label>
              <input
                type="text"
                {...register('city', { required: true })}
                placeholder="Mumbai"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Area Locality</label>
              <input
                type="text"
                {...register('area', { required: true })}
                placeholder="Bandra West"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">State</label>
              <input
                type="text"
                {...register('state', { required: true })}
                placeholder="Maharashtra"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bedrooms</label>
              <input
                type="number"
                {...register('bedrooms', { required: true })}
                placeholder="2"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bathrooms</label>
              <input
                type="number"
                {...register('bathrooms', { required: true })}
                placeholder="2"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pincode</label>
              <input
                type="text"
                {...register('pincode', { required: true })}
                placeholder="400050"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Address</label>
              <input
                type="text"
                {...register('address', { required: true })}
                placeholder="Plot 12, Link Road"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
            <textarea
              rows="4"
              {...register('description', { required: 'Description is required' })}
              placeholder="Describe amenities, location features, proximity..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg"
          >
            Create Property Listing
          </button>
        </form>
      )}

      {/* Properties List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {properties.length === 0 ? (
          <p className="text-slate-500 text-xs py-8 text-center md:col-span-2">You haven't listed any property units.</p>
        ) : (
          properties.map((p) => (
            <div key={p._id} className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-slate-800">
              <div className="space-y-4">
                <div className="h-44 bg-slate-900 rounded-xl overflow-hidden relative border border-slate-800">
                  <img
                    src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80'}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span className="bg-indigo-600 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                      ₹{p.rentAmount.toLocaleString('en-IN')}/mo
                    </span>
                    <span className="bg-slate-900 text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                      {p.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-100 text-base line-clamp-1">{p.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{p.address}, {p.city}</p>
                </div>
              </div>

              {/* Upload controls & actions */}
              <div className="mt-6 pt-4 border-t border-slate-850 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="p-2 text-slate-400 hover:text-red-400 bg-slate-900 rounded-lg border border-slate-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleImageUpload(e, p._id)}
                    className="hidden"
                    id={`image-upload-${p._id}`}
                  />
                  <label
                    htmlFor={`image-upload-${p._id}`}
                    className="cursor-pointer flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-indigo-950 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  >
                    {uploadingId === p._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        Upload Images
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
