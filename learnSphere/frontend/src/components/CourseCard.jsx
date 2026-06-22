import React from 'react';
import { Star } from 'lucide-react';

const CourseCard = ({ course, onEnroll, actionLabel }) => {
  return (
    <div className="card relative overflow-hidden hover:shadow-xl transition-shadow">
      {/* Subject Symbol at Left Corner */}
      <div className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-600 font-bold border-2 border-blue-100 text-lg">
        {course.title ? course.title.charAt(0).toUpperCase() : 'C'}
      </div>
      {course.thumbnail && (
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
      )}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-800">{course.title}</h3>
          {course.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold">{course.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.shortDescription}</p>
        <div className="flex gap-2 mb-4">
          <span className="inline-block px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            {course.level}
          </span>
          <span className="inline-block px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            {course.category}
          </span>
          {course.subject && (
            <span className="inline-block px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
              {course.subject}
            </span>
          )}
        </div>
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
                <p className="text-lg font-bold text-gray-800">{course.totalEnrollments}</p>
              </>
            )}
          </div>
          {onEnroll && (
            <button onClick={() => onEnroll(course)} className="btn btn-primary">
              {actionLabel || 'Enroll Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
