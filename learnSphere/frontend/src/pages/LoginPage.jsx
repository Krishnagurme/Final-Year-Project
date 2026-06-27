import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/index.js';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice.js';
import Navbar from '../components/Navbar.jsx';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login({ email, password });
      const loginData = response.data.data;
      const token = loginData.token || loginData.accessToken;
      const user = loginData.user;

      if (!token || !user) {
        throw new Error('Login response was missing credentials');
      }

      dispatch(setCredentials({ user, token }));

      if (user.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/login');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white relative">
      {/* Left Pane: The Workspace (Form) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-24 pt-32 md:pt-12 min-h-screen">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 mt-2 text-lg">Enter your details to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 cursor-pointer">Email address</label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all duration-300 text-slate-900 placeholder-slate-400"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 cursor-pointer">Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all duration-300 text-slate-900 placeholder-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 cursor-pointer">Account type</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all duration-300 text-slate-900 appearance-none" 
                value={role} 
                onChange={e => setRole(e.target.value)}
              >
                <option value="STUDENT">Student</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl text-md font-semibold transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-md shadow-slate-900/10"
            >
              {loading ? 'Authenticating...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-slate-500 mt-8 text-sm">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              Create an account
            </a>
          </p>
        </div>
      </div>

      {/* Right Pane: The Brand */}
      <div className="hidden md:flex w-1/2 bg-[#0a0f1c] bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0a0f1c] to-indigo-900/40 items-center justify-center relative overflow-hidden min-h-screen">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[128px] opacity-20"></div>
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[128px] opacity-20"></div>
        
        <div className="relative z-10 p-12 max-w-lg text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white text-3xl font-extrabold mx-auto mb-10 shadow-xl shadow-blue-500/30 ring-1 ring-white/10">
            LS
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Accelerate your potential.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed font-medium">
            Join the platform that is empowering learning journeys with cutting-edge AI and dynamic mechanics.
          </p>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
