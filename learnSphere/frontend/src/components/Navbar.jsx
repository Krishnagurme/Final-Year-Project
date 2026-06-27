import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice.js';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Settings, Search, Loader } from 'lucide-react';
import logo2 from '../logo2.svg';
import '../styles/Navbar.css';
import { courseService } from '../services/index.js';
import { API_BASE_URL } from '../services/api.js';

const getFullFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const serverRoot = API_BASE_URL.replace('/api', '');
  return `${serverRoot}${url}`;
};

const Navbar = ({ variant = 'default' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async () => {
    try {
      setIsSearching(true);
      setShowDropdown(true);
      const res = await courseService.getAllCourses({ search: searchQuery, limit: 5 });
      if (res.data?.data) {
        setSearchResults(res.data.data);
      }
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (courseId) => {
    setShowDropdown(false);
    setSearchQuery('');
    navigate(`/course/${courseId}/preview`);
  };

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
      <div className="px-5 sm:px-8 py-3 flex justify-between items-center w-full">
          <Link to="/" className="flex items-center gap-3 group relative shrink-0">
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

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-6 relative" ref={searchRef}>
            <div className="relative w-full">
              <input 
                type="text"
                placeholder="Search for courses..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if(e.target.value.trim().length > 0) setShowDropdown(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 1) setShowDropdown(true);
                }}
                className={`w-full bg-gray-50/50 border ${isAuth ? 'border-slate-600 text-slate-200 placeholder-slate-400 bg-slate-800/50 focus:bg-slate-800/80' : 'border-gray-200 text-gray-900 focus:bg-white'} rounded-full px-5 py-2.5 pl-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner`}
              />
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isAuth ? 'text-slate-400' : 'text-gray-400'}`} size={18} />
              
              {/* Search Dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50 transform origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                  {isSearching ? (
                    <div className="p-6 flex items-center justify-center text-gray-500">
                      <Loader className="animate-spin mr-3 text-blue-600" size={20} /> 
                      <span className="font-medium text-sm">Searching courses...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-[400px] overflow-y-auto py-2">
                      <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Courses</div>
                      {searchResults.map(course => (
                        <div 
                          key={course._id}
                          onClick={() => handleSelectResult(course._id)}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 shadow-sm border border-gray-100/50">
                            {course.thumbnail ? (
                              <img src={getFullFileUrl(course.thumbnail)} alt={course.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                {course.title.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 line-clamp-1 mb-0.5">{course.title}</h4>
                            <p className="text-xs font-medium text-gray-500 line-clamp-1 flex items-center gap-1.5">
                              <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{course.level || 'BEGINNER'}</span>
                              <span>•</span>
                              <span>{course.category}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="text-gray-300" size={20} />
                      </div>
                      <p className="text-sm font-bold text-gray-700">No courses found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end mr-1">
                  <span className={`text-[10px] ${isAuth ? "text-slate-400" : "text-gray-400"} font-bold uppercase tracking-widest`}>Welcome back</span>
                  <span className={`capitalize text-base font-extrabold leading-tight bg-clip-text text-transparent bg-gradient-to-r ${isAuth ? "from-slate-100 to-slate-300" : "from-gray-700 to-gray-900"}`}>
                    {user?.firstName + ' ' + user?.lastName }
                  </span>
                </div>
                <div className="h-8 w-px bg-gray-200/60 hidden sm:block"></div>
                <button onClick={handleLogout} className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-500 hover:text-white focus:outline-none transition-all duration-300 shadow-[0_2px_10px_rgba(239,68,68,0.05)] hover:shadow-[0_4px_15px_rgba(239,68,68,0.2)] hover:-translate-y-0.5">
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

          <button className={`md:hidden p-2 rounded-xl ${isAuth ? "text-white hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"} transition-all active:scale-95 shrink-0`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-3xl shadow-2xl border-b border-gray-100 px-6 py-8 space-y-6 animate-in slide-in-from-top-2 z-40 sm:rounded-b-2xl">
            {/* Mobile Search */}
            <div className="relative w-full mb-6">
              <input 
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if(e.target.value.trim().length > 0) setShowDropdown(true);
                }}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 pl-11 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              
              {showDropdown && searchQuery.trim().length > 1 && (
                <div className="mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  {isSearching ? (
                    <div className="p-4 flex items-center justify-center text-gray-500">
                      <Loader className="animate-spin mr-2" size={18} /> <span className="text-sm">Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      {searchResults.map(course => (
                        <div 
                          key={course._id}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleSelectResult(course._id);
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                            {course.thumbnail ? (
                              <img src={getFullFileUrl(course.thumbnail)} alt={course.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{course.title.charAt(0)}</div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{course.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-1">{course.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">No courses found.</div>
                  )}
                </div>
              )}
            </div>

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
                <Link onClick={() => setMobileMenuOpen(false)} to="/login" className="flex items-center justify-center w-full py-3.5 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors border-2 border-gray-100 active:scale-[0.98]">
                  Log in
                </Link>
                <Link onClick={() => setMobileMenuOpen(false)} to="/register" className="flex items-center justify-center w-full py-3.5 text-white bg-gradient-to-r from-blue-600 to-purple-600 font-bold rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 active:scale-[0.98]">
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
