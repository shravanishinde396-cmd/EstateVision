import React from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../store/authSlice.js';
import toast from 'react-hot-toast';
import { Landmark, ArrowLeft, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const onSubmit = (data) => {
    dispatch(registerUser(data))
      .unwrap()
      .then((user) => {
        toast.success('Registered successfully!');
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'OWNER') navigate('/owner');
        else navigate('/tenant');
      })
      .catch((err) => {
        toast.error(err || 'Registration failed');
      });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2 text-indigo-400 font-bold text-2xl mb-6">
          <Landmark className="h-7 w-7 text-indigo-500" />
          <span>EstateVision</span>
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-white">Create your account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass px-10 py-8 rounded-2xl border border-slate-800 shadow-2xl">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-350">First name</label>
                <input
                  type="text"
                  {...register('firstName', { required: 'Required' })}
                  placeholder="John"
                  className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
                {errors.firstName && <span className="text-xs text-red-400 mt-1 block">{errors.firstName.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-350">Last name</label>
                <input
                  type="text"
                  {...register('lastName', { required: 'Required' })}
                  placeholder="Doe"
                  className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
                {errors.lastName && <span className="text-xs text-red-400 mt-1 block">{errors.lastName.message}</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-350">Email address</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="e.g. user@gmail.com"
                className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              />
              {errors.email && <span className="text-xs text-red-400 mt-1 block">{errors.email.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-350">Phone Number (10 digits starting with 6-9)</label>
              <input
                type="tel"
                {...register('phone', {
                  required: 'Phone is required',
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: 'Must be a 10-digit Indian phone number starting with 6-9',
                  },
                })}
                placeholder="9876543210"
                className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              />
              {errors.phone && <span className="text-xs text-red-400 mt-1 block">{errors.phone.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-350">Password</label>
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
                placeholder="••••••••"
                className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              />
              {errors.password && <span className="text-xs text-red-400 mt-1 block">{errors.password.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-350">I am a...</label>
              <select
                {...register('role', { required: 'Please select a role' })}
                className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              >
                <option value="TENANT">Tenant seeking properties</option>
                <option value="OWNER">Property Owner / Manager</option>
              </select>
              {errors.role && <span className="text-xs text-red-400 mt-1 block">{errors.role.message}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-sm"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Sign in here
            </Link>
          </p>

          <Link to="/" className="mt-6 flex justify-center items-center gap-1.5 text-xs text-slate-500 hover:text-slate-350 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
