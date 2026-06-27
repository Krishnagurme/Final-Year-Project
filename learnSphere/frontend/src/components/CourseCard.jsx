import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle, Clock, BookOpen, Users, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../services/api.js';

const getFullFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const serverRoot = API_BASE_URL.replace('/api', '');
  return `${serverRoot}${url}`;
};

const CourseCard = ({ course, onEnroll, actionLabel, enrollment }) => {
  const navigate = useNavigate();
  const isEnrolled = enrollment?.enrolled || course.isEnrolled;
  const progress = enrollment?.progress ?? course.enrollmentProgress ?? 0;

  const handleAction = (e) => {
    e.stopPropagation();
    if (isEnrolled) {
      navigate(`/student/courses/${course._id}`);
      return;
    }
    if (onEnroll) {
      onEnroll(course);
    } else {
      navigate(`/course/${course._id}/preview`);
    }
  };

  const getActionLabel = () => {
    if (isEnrolled) {
      if (progress >= 100) return 'Review Course';
      return 'Continue Learning';
    }
    return actionLabel || 'View Course';
  };

  const handleCardClick = () => {
    if (course.isAssessmentSubject) {
      return;
    }
    if (isEnrolled) {
      navigate(`/student/courses/${course._id}`);
    } else {
      navigate(`/course/${course._id}/preview`);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white rounded-3xl border border-gray-100 hover:border-blue-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col relative"
    >
      {/* Thumbnail Section */}
      <div className="h-48 relative overflow-hidden bg-gray-100">
        {course.thumbnail ? (
          <img
            src={getFullFileUrl(course.thumbnail)}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <BookOpen size={40} className="text-slate-300" />
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {course.level && (
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-900 rounded-full text-xs font-bold shadow-sm">
              {course.level}
            </span>
          )}
        </div>

        {isEnrolled && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-black shadow-lg shadow-emerald-500/30">
              <CheckCircle size={14} />
              ENROLLED
            </div>
          </div>
        )}

        {/* Subject/Category Label on image bottom */}
        <div className="absolute bottom-4 left-4">
          <span className="text-white/90 font-semibold text-sm drop-shadow-md">
            {course.category || 'General Subject'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-grow relative">
        <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed">
          {course.shortDescription || course.description || 'Learn the essentials and advance your skills with this comprehensive guide.'}
        </p>

        {/* Course Stats Grid */}
        <div className="grid grid-cols-2 gap-y-3 mb-6 mt-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
            <BookOpen size={16} className="text-indigo-400" />
            <span>{course.lessons?.length || 0} Modules</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
            <Users size={16} className="text-blue-400" />
            <span>{course.totalEnrollments || 0} Students</span>
          </div>
        </div>

        {/* Progress Bar (if enrolled) */}
        {isEnrolled && (
          <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
              <span className="uppercase tracking-wider">Progress</span>
              <span className="text-blue-600">{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <button 
          onClick={handleAction}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
            isEnrolled 
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
              : 'bg-gray-50 text-gray-900 hover:bg-blue-600 hover:text-white border border-gray-200 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/20'
          }`}
        >
          {getActionLabel()}
          <ChevronRight size={16} className={isEnrolled ? "text-emerald-500" : ""} />
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
