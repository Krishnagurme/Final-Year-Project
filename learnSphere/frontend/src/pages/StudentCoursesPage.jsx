import React, { useState, useEffect, useMemo } from 'react';
import { StudentLayout } from '../components/Layout.jsx';
import CourseCard from '../components/CourseCard.jsx';
import { assessmentService, courseService } from '../services/index.js';
import { useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';

const StudentCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
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

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [coursesResponse, subjectsResponse] = await Promise.allSettled([
        courseService.getAllCourses({ limit: 50 }),
        assessmentService.getSubjects(),
      ]);

      const realCourses =
        coursesResponse.status === 'fulfilled' ? coursesResponse.value.data?.data || [] : [];
      const supportedSubjects =
        subjectsResponse.status === 'fulfilled' ? subjectsResponse.value.data?.data || [] : [];

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
      setAssessmentSubjectCourses(syntheticSubjectCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
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

  const categoryOptions = useMemo(() => {
    const set = new Set();
    for (const c of courses) {
      if (c.category && String(c.category).trim()) set.add(String(c.category).trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [courses]);

  const handleEnroll = async course => {
    if (course.isAssessmentSubject) {
      const subject = encodeURIComponent(course.title);
      navigate(`/student/assessment?view=assessment&subject=${subject}`);
      return;
    }

    try {
      await courseService.enrollCourse(course._id);
      alert('Successfully enrolled in the course!');
    } catch (error) {
      alert('Error enrolling in course: ' + error.message);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-8">
        <h1 className="text-4xl font-bold text-gray-900">Browse Courses</h1>

        {/* Assessment Subjects Section */}
        {assessmentSubjectCourses.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm font-semibold text-blue-800">
                Assessment Subjects
              </p>
              <p className="text-sm text-blue-700 mt-1">
                These subjects are available in the AI assessment engine. Click <strong>Take Test</strong>{' '}
                to open a personalized prerequisite test directly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessmentSubjectCourses.map(course => (
                <CourseCard
                  key={course._id}
                  course={course}
                  onEnroll={handleEnroll}
                  actionLabel="Take Test"
                />
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters removed */}

        {/* Regular Courses Grid */}
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
            {filteredCourses.map(course => (
              <CourseCard
                key={course._id}
                course={course}
                onEnroll={handleEnroll}
                actionLabel="Enroll Now"
              />
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentCoursesPage;
