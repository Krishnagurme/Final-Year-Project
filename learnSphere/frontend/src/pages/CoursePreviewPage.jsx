import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseService } from '../services/index.js';
import { useSelector } from 'react-redux';
import { 
  Star, Clock, BookOpen, User, ChevronLeft, CheckCircle, ShieldAlert, 
  Award, Infinity, Smartphone, Calendar, BarChart, Users, PlayCircle, FileText, Check, Loader
} from 'lucide-react';
import { API_BASE_URL } from '../services/api.js';

const getFullFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const serverRoot = API_BASE_URL.replace('/api', '');
  return `${serverRoot}${url}`;
};

const CoursePreviewPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector(state => state.auth);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Prerequisite Quiz State (now just handles modal visibility)

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const res = await courseService.getCourseById(courseId);
      if (res.data?.data) {
        setCourse(res.data.data);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (course && user) {
      const isEnrolled = course.students?.some(studentId => 
        String(studentId) === String(user.id) || String(studentId) === String(user._id)
      );
      if (isEnrolled) {
        navigate(`/student/courses/${courseId}`, { replace: true });
      }
    }
  }, [course, user, navigate, courseId]);

  const handleEnrollClick = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/course/${courseId}/preview` } });
      return;
    }
    setShowModal(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error || !course) return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex flex-col items-center justify-center">
      <ShieldAlert size={64} className="text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800">Course Not Found</h2>
      <p className="text-gray-600 mt-2">{error}</p>
      <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition">
        Go Back
      </button>
    </div>
  );

  const formattedDate = new Date(course.updatedAt || course.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const isEnrolled = course.students?.some(studentId => 
    String(studentId) === String(user?.id) || String(studentId) === String(user?._id)
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Dark Hero Section */}
      <div className="bg-slate-900 text-white pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm font-semibold text-slate-400 hover:text-white transition-colors mb-8 group"
          >
            <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Catalog
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">

            {/* Left Content */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={14} /> {course.category || 'General'}
                </span>
                <span className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart size={14} /> {course.level || 'BEGINNER'}
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6 text-white drop-shadow-sm">
                {course.title}
              </h1>

              <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-3xl">
                {course.shortDescription || course.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300 mb-6 font-medium">

                <div className="flex items-center gap-1.5">
                  <Users size={16} className="text-blue-400" />
                  <span>{(course.totalEnrollments || 0).toLocaleString()} students</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-emerald-400" />
                  <span>Last updated {formattedDate}</span>
                </div>
              </div>


            </div>

            {/* Right Sticky Sidebar (Placeholder for Desktop alignment) */}
            <div className="hidden lg:block relative"></div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative -mt-20">

          {/* Left Column (Content) */}
          <div className="lg:col-span-2 space-y-12">

            {/* What you'll learn */}
            {course.learningOutcomes?.length > 0 ? (
              <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What you'll learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.learningOutcomes.map((outcome, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700 leading-relaxed">{outcome}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What you'll learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Master the core concepts and real-world applications.",
                    "Build hands-on projects to solidify your knowledge.",
                    "Understand best practices and industry standards.",
                    "Prepare for advanced topics and certifications."
                  ].map((outcome, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700 leading-relaxed">{outcome}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Course Content / Syllabus */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>
              <div className="flex justify-between items-center text-sm text-gray-600 mb-4 px-1">
                <span>{course.lessons?.length || 0} modules • {(course.lessons?.length || 0) * 45} mins total length</span>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {course.lessons?.length > 0 ? (
                  course.lessons.map((lesson, idx) => (
                    <div key={idx} className="p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors flex items-start gap-4">
                      <div className="mt-1">
                        {lesson.contentType === 'VIDEO' ? (
                          <PlayCircle size={20} className="text-gray-400" />
                        ) : (
                          <FileText size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{lesson.title}</h3>
                        <p className="text-sm text-gray-500">{lesson.description || 'Module topic content and learning materials.'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No curriculum added yet.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Description */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Description</h2>
              <div className="prose prose-lg text-gray-700 max-w-none bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                {course.description.split('\n').map((para, i) => (
                  <p key={i} className="mb-4 last:mb-0 leading-relaxed">{para}</p>
                ))}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Why take this course?</h3>
                  <p className="mb-4 leading-relaxed">
                    This comprehensive program is carefully crafted to take you from foundational concepts to advanced applications.
                    Through a blend of theoretical knowledge and practical exercises, you'll develop a deep understanding of the subject matter.
                  </p>
                  <p className="leading-relaxed">
                    By the end of this course, you will have built real-world skills that are highly sought after by top employers,
                    giving you the confidence to tackle complex problems and advance your career in the tech industry.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column (Sticky Enrollment Card) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">

              {/* Thumbnail */}
              <div className="h-56 bg-gray-100 relative group">
                {course.thumbnail ? (
                  <img
                    src={getFullFileUrl(course.thumbnail)}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                    <BookOpen size={64} className="text-blue-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl">
                    <PlayCircle size={32} className="text-blue-600 ml-1" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-8">
                <div className="text-3xl font-black text-gray-900 mb-6">Free</div>

                {isEnrolled ? (
                  <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                    <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-emerald-800">You are enrolled!</p>
                    <button
                      onClick={() => navigate(`/student/courses/${course._id}`)}
                      className="mt-3 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
                    >
                      Go to Course
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEnrollClick}
                    disabled={enrolling}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all mb-6 flex justify-center items-center gap-2"
                  >
                    {enrolling ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      'Enroll Now'
                    )}
                  </button>
                )}

                <div className="space-y-4 mb-8">
                  <h4 className="font-bold text-gray-900">This course includes:</h4>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-center gap-3">
                      <PlayCircle size={18} className="text-gray-400" />
                      <span>{course.lessons?.length || 0} Learning Modules</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <FileText size={18} className="text-gray-400" />
                      <span>Comprehensive study notes</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Infinity size={18} className="text-gray-400" />
                      <span>Full lifetime access</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Smartphone size={18} className="text-gray-400" />
                      <span>Access on mobile and desktop</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Award size={18} className="text-gray-400" />
                      <span>Certificate of completion</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Prerequisite Assessment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <div className="text-center mb-8 pt-4">
              <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                <FileText size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Prerequisite Needed</h3>
              <p className="text-gray-600 leading-relaxed">
                Before you can enroll in <strong>{course.title}</strong>, you need to complete a short diagnostic test. This helps us personalize your learning experience.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate(`/course/${courseId}/prerequisite`)}
                className="flex-[2] py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                Take Assessment <ChevronLeft className="rotate-180" size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePreviewPage;
