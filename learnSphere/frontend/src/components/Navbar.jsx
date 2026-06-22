import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice.js';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Settings } from 'lucide-react';
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
      ? "bg-transparent absolute top-0 w-full z-50 border-none transition-all" 
      : "bg-white/90 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-200 shadow-sm transition-all"}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            LS
          </div>
          <span className="text-xl font-bold text-gray-800 hidden sm:inline">LearnSphere</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className={isAuth ? "text-slate-200" : "text-gray-700"}>{user?.firstName}</span>
              <button onClick={handleLogout} className="btn btn-primary flex items-center gap-2">
                <LogOut size={18} />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                to="/login" 
                className={isAuth ? "text-slate-300 hover:text-white px-4 py-2 font-medium transition-colors" : "btn btn-secondary border-none shadow-none bg-transparent hover:bg-slate-100"}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className={isAuth ? "bg-white text-slate-900 hover:bg-slate-100 px-5 py-2 rounded-full font-semibold transition-all shadow-lg shadow-white/10" : "btn btn-primary rounded-full"}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute w-full bg-white shadow-xl border-b border-slate-200 px-6 py-6 space-y-5 animate-in slide-in-from-top-2 z-40">
          {isAuthenticated ? (
            <>
              <p className="text-gray-700">{user?.firstName}</p>
              <button onClick={handleLogout} className="btn btn-primary w-full">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary w-full block text-center">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary w-full block text-center">
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
