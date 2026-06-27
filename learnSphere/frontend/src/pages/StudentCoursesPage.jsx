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

  const handleEnroll = async course => {
    if (course.isAssessmentSubject) {
      const subject = encodeURIComponent(course.title);
      navigate(`/student/assessment?view=assessment&subject=${subject}`);
      return;
    }

    try {
      const res = await courseService.enrollCourse(course._id);
      const alreadyEnrolled = res.data?.data?.alreadyEnrolled;
      if (!alreadyEnrolled) {
        await fetchCourses();
      }
      navigate(`/student/courses/${course._id}`);
    } catch (error) {
      alert('Error enrolling in course: ' + (error.response?.data?.message || error.message));
    }
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
                  onEnroll={handleEnroll}
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
    </StudentLayout>
  );
};

export default StudentCoursesPage;
