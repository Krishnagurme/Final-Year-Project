import React, { useState, useEffect, useMemo } from 'react';
import { StudentLayout } from '../components/Layout.jsx';
import CourseCard from '../components/CourseCard.jsx';
import { assessmentService, courseService } from '../services/index.js';
import { useNavigate } from 'react-router-dom';

const StudentCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [assessmentSubjectCourses, setAssessmentSubjectCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [enrollModalCourse, setEnrollModalCourse] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, selectedLevel, selectedCategory]);

  const enrollmentMap = useMemo(() => {
    const map = {};
    for (const e of enrollments) {
      const id = e.courseId?.toString?.() || String(e.courseId);
      map[id] = e;
    }
    return map;
  }, [enrollments]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [coursesResponse, subjectsResponse, enrollmentsResponse] = await Promise.allSettled([
        courseService.getAllCourses({ limit: 50 }),
        assessmentService.getSubjects(),
        courseService.getMyEnrollments(),
      ]);

      const realCourses =
        coursesResponse.status === 'fulfilled' && Array.isArray(coursesResponse.value.data?.data)
          ? coursesResponse.value.data.data
          : [];
      const supportedSubjects =
        subjectsResponse.status === 'fulfilled' && Array.isArray(subjectsResponse.value.data?.data)
          ? subjectsResponse.value.data.data
          : [];
      const myEnrollments =
        enrollmentsResponse.status === 'fulfilled' && Array.isArray(enrollmentsResponse.value.data?.data)
          ? enrollmentsResponse.value.data.data
          : [];

      const existingTitles = new Set(
        realCourses.map(course => String(course.title || '').trim().toLowerCase())
      );

      const syntheticSubjectCourses = supportedSubjects
        .filter(subject => !existingTitles.has(String(subject.name || '').trim().toLowerCase()))
        .map(subject => ({
          _id: `assessment-${encodeURIComponent(subject.name)}`,
          title: subject.name,
          shortDescription: 'Available as an AI prerequisite assessment subject.',
          description:
            'This subject is available in the assessment engine. Open it to start a personalized prerequisite test.',
          level: 'BEGINNER',
          category: 'Assessment Subject',
          totalEnrollments: 0,
          isAssessmentSubject: true,
          topicsCount: subject.topicsCount || 0,
        }));

      setCourses(realCourses);
      setEnrollments(myEnrollments);
      setAssessmentSubjectCourses(syntheticSubjectCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
      setEnrollments([]);
      setAssessmentSubjectCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(
        c =>
          String(c.title || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          String(c.description || c.shortDescription || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLevel) {
      filtered = filtered.filter(c => c.level === selectedLevel);
    }

    if (selectedCategory) {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    setFilteredCourses(filtered);
  };

  const handleEnrollClick = (course) => {
    if (course.isAssessmentSubject) {
      const subject = encodeURIComponent(course.title);
      navigate(`/student/assessment?view=assessment&subject=${subject}`);
      return;
    }
    setEnrollModalCourse(course);
  };

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Browse Courses</h1>
          <p className="text-gray-600 mt-2">
            Enroll, complete the prerequisite assessment, then work through each topic to earn your certificate.
          </p>
        </div>


        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No courses found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => {
              const enrollment = enrollmentMap[course._id];
              return (
                <CourseCard
                  key={course._id}
                  course={course}
                  onEnroll={handleEnrollClick}
                  actionLabel="Enroll Now"
                  enrollment={
                    enrollment
                      ? { enrolled: true, progress: enrollment.progress, ...enrollment }
                      : null
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Prerequisite Assessment Modal */}
      {enrollModalCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setEnrollModalCourse(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <div className="text-center mb-8 pt-4">
              <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Prerequisite Needed</h3>
              <p className="text-gray-600 leading-relaxed">
                Before you can enroll in <strong>{enrollModalCourse.title}</strong>, you need to complete a short diagnostic test. This helps us personalize your learning experience.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setEnrollModalCourse(null)}
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate(`/course/${enrollModalCourse._id}/prerequisite`)}
                className="flex-[2] py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                Take Assessment
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default StudentCoursesPage;
