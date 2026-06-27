import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice.js';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Settings } from 'lucide-react';
import logo2 from '../logo2.svg';
import '../styles/Navbar.css';

const Navbar = ({ variant = 'default' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isAuth = variant === 'auth';

  return (
    <nav className={isAuth 
      ? "absolute top-0 w-full z-50 bg-transparent transition-all" 
      : "sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all duration-300"}>
      <div className="px-5 sm:px-8 py-3 flex justify-between items-center max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-3 group relative">
            <div className="absolute -inset-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-15 blur-lg transition duration-500"></div>
            <img 
              src={logo2} 
              alt="LearnSphere Logo" 
              className="h-10 w-auto group-hover:scale-110 transition-transform duration-500 drop-shadow-md relative z-10" 
            />
            <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hidden sm:inline relative z-10 drop-shadow-sm">
              LearnSphere
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end mr-1">
                  <span className={`text-[10px] ${isAuth ? "text-slate-400" : "text-gray-400"} font-bold uppercase tracking-widest`}>Welcome back</span>
                  <span className={`capitalize text-base font-extrabold leading-tight bg-clip-text text-transparent bg-gradient-to-r ${isAuth ? "from-slate-100 to-slate-300" : "from-gray-700 to-gray-900"}`}>
                    {user?.firstName}
                  </span>
                </div>
                <div className="h-8 w-px bg-gray-200/60 hidden sm:block"></div>
                <button onClick={handleLogout} className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-red-600 bg-red-50/80 rounded-xl hover:bg-red-500 hover:text-white focus:outline-none transition-all duration-300 shadow-[0_2px_10px_rgba(239,68,68,0.05)] hover:shadow-[0_4px_15px_rgba(239,68,68,0.2)] hover:-translate-y-0.5">
                  <LogOut size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className={isAuth ? "text-slate-200 hover:text-white px-5 py-2.5 font-bold transition-colors" : "text-gray-600 hover:text-gray-900 px-5 py-2.5 font-bold transition-colors rounded-xl hover:bg-gray-50/80"}
                >
                  Log in
                </Link>
                <Link 
                  to="/register" 
                  className={isAuth ? "bg-white text-slate-900 hover:bg-slate-100 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-white/10 hover:scale-105" : "relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none shadow-[0_4px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_8px_25px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 active:translate-y-0"}
                >
                  Sign up free
                </Link>
              </div>
            )}
          </div>

          <button className={`md:hidden p-2 rounded-xl ${isAuth ? "text-white hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"} transition-all active:scale-95`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-3xl shadow-2xl border-b border-gray-100 px-6 py-8 space-y-6 animate-in slide-in-from-top-2 z-40 sm:rounded-b-2xl">
            {isAuthenticated ? (
              <>
                <div className="pb-5 border-b border-gray-100/60 flex flex-col items-center">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Logged in as</p>
                  <p className="text-2xl font-black text-gray-800 capitalize mt-1 bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900">{user?.firstName}</p>
                </div>
                <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 active:scale-[0.98]">
                  <LogOut size={20} />
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <Link to="/login" className="flex items-center justify-center w-full py-3.5 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors border-2 border-gray-100 active:scale-[0.98]">
                  Log in
                </Link>
                <Link to="/register" className="flex items-center justify-center w-full py-3.5 text-white bg-gradient-to-r from-blue-600 to-purple-600 font-bold rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 active:scale-[0.98]">
                  Sign up free
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
  );
};

export default Navbar;
