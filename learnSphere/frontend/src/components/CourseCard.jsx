import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle } from 'lucide-react';

const CourseCard = ({ course, onEnroll, actionLabel, enrollment }) => {
  const navigate = useNavigate();
  const isEnrolled = enrollment?.enrolled || course.isEnrolled;
  const progress = enrollment?.progress ?? course.enrollmentProgress ?? 0;

  const handleAction = () => {
    if (isEnrolled) {
      navigate(`/student/courses/${course._id}`);
      return;
    }
    if (onEnroll) {
      onEnroll(course);
    }
  };

  const getActionLabel = () => {
    if (isEnrolled) {
      if (progress >= 100) return 'Review Course';
      if (!enrollment?.prerequisiteCompleted && enrollment?.prerequisiteCompleted !== undefined) {
        return 'Take Prerequisite';
      }
      return 'Continue Learning';
    }
    return actionLabel || 'Enroll Now';
  };

  return (
    <div className="card relative overflow-hidden hover:shadow-xl transition-shadow">
      <div className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-600 font-bold border-2 border-blue-100 text-lg">
        {course.title ? course.title.charAt(0).toUpperCase() : 'C'}
      </div>
      {isEnrolled && (
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} />
            Enrolled
          </span>
        </div>
      )}
      {course.thumbnail && (
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
      )}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-800 pr-16">{course.title}</h3>
          {course.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold">{course.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.shortDescription}</p>
        <div className="flex gap-2 mb-4 flex-wrap">
          <span className="inline-block px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            {course.level}
          </span>
          <span className="inline-block px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            {course.category}
          </span>
          {course.lessons?.length > 0 && (
            <span className="inline-block px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
              {course.lessons.length} topics
            </span>
          )}
        </div>

        {isEnrolled && (
          <div className="mb-4 space-y-1">
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            {course.isAssessmentSubject ? (
              <>
                <p className="text-gray-500 text-xs">Assessment Coverage</p>
                <p className="text-sm font-semibold text-gray-800">
                  {course.topicsCount || 0} core topics
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-xs">Student Enrollments</p>
                <p className="text-lg font-bold text-gray-800">{course.totalEnrollments || 0}</p>
              </>
            )}
          </div>
          {(onEnroll || isEnrolled) && (
            <button onClick={handleAction} className="btn btn-primary">
              {getActionLabel()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
