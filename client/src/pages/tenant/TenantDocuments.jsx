import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Upload, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

export default function TenantDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const fetchDocs = () => {
    api.get('/tenants/documents')
      .then((res) => {
        setDocuments(res.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const onSubmit = (data) => {
    if (!selectedFile) {
      toast.error('Please select a document file to upload');
      return;
    }

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('doc', selectedFile);
    formData.append('name', data.name);
    formData.append('documentType', data.documentType);

    api.post('/tenants/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then((res) => {
        toast.success('Document uploaded successfully!');
        reset();
        setSelectedFile(null);
        fetchDocs();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to upload document');
      })
      .finally(() => setUploadLoading(false));
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
        <h1 className="text-3xl font-extrabold text-white">Identity Documents</h1>
        <p className="text-slate-400 text-sm mt-1">Upload files for owner verification and lease checks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload form column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-indigo-400" />
              Upload Document
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Friendly Name</label>
                <input
                  type="text"
                  {...register('name', { required: true })}
                  placeholder="e.g. Passport scan"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Document Type</label>
                <select
                  {...register('documentType', { required: true })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="PASSPORT">Passport</option>
                  <option value="AADHAR">Aadhar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="LEASE_AGREEMENT">Signed Lease Agreement</option>
                  <option value="OTHER">Other Proof</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select File</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={uploadLoading}
                className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg"
              >
                {uploadLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Upload'}
              </button>
            </form>
          </div>
        </div>

        {/* Uploaded Documents List */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            Uploaded Documents
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {documents.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center sm:col-span-2">No verification documents uploaded yet.</p>
            ) : (
              documents.map((doc, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-8 w-8 text-indigo-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-200 text-sm truncate">{doc.name}</h4>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">{doc.documentType}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {doc.isVerified ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full uppercase">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Pending
                      </span>
                    )}
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      View doc ↗
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
