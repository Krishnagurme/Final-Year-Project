import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StudentLayout } from '../components/Layout.jsx';
import { courseService } from '../services/index.js';
import { 
  BookOpen, Award, CheckCircle, PlayCircle, Lock, FileText, 
  ExternalLink, ChevronRight, AlertCircle, Check, Loader, Trophy 
} from 'lucide-react';

const StudentCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [error, setError] = useState('');
  
  // Prerequisite Quiz state
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { questionIndex: selectedOption }
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [currentQuizStep, setCurrentQuizStep] = useState(0);

  // Workspace state
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes', 'material', 'pdf', 'references'
  const [completingTopicId, setCompletingTopicId] = useState(null);
  const [accessingTopicId, setAccessingTopicId] = useState(null);

  // Fetch course detail on mount
  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await courseService.getEnrolledCourseDetail(courseId);
      if (res.data?.success) {
        setCourse(res.data.data.course);
        setEnrollment(res.data.data.enrollment);
        
        // Auto-select first lesson if available and none selected yet
        const lessons = res.data.data.course?.lessons || [];
        if (lessons.length > 0 && !selectedLesson) {
          setSelectedLesson(lessons[0]);
        }
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [courseId]);

  // Load prerequisite questions if enrolled but not completed
  useEffect(() => {
    if (enrollment && !enrollment.prerequisiteCompleted && quizQuestions.length === 0) {
      loadPrerequisiteQuestions();
    }
  }, [enrollment]);

  const loadPrerequisiteQuestions = async () => {
    try {
      const res = await courseService.getPrerequisiteQuestions(courseId);
      if (res.data?.success) {
        setQuizQuestions(res.data.questions || []);
      }
    } catch (e) {
      setError('Failed to load prerequisite assessment: ' + e.message);
    }
  };

  const handleSelectOption = (qIdx, option) => {
    setAnswers(prev => ({
      ...prev,
      [qIdx]: option
    }));
  };

  const handleSubmitQuiz = async () => {
    // Validate all questions are answered
    if (Object.keys(answers).length < quizQuestions.length) {
      alert(`Please answer all ${quizQuestions.length} questions before submitting.`);
      return;
    }

    try {
      setSubmittingQuiz(true);
      const submittedAnswers = Object.entries(answers).map(([idx, ans]) => ({
        questionIndex: parseInt(idx),
        selectedAnswer: ans
      }));

      const res = await courseService.submitPrerequisiteAnswers(courseId, submittedAnswers);
      if (res.data?.success) {
        setQuizResult(res.data);
      }
    } catch (e) {
      alert('Error submitting assessment: ' + e.message);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleEnterWorkspace = async () => {
    setQuizResult(null);
    setQuizQuestions([]);
    setAnswers({});
    setCurrentQuizStep(0);
    await fetchDetail();
  };

  const handleOpenMaterial = async (lessonId) => {
    try {
      setAccessingTopicId(lessonId);
      const res = await courseService.accessTopic(courseId, lessonId);
      if (res.data?.success) {
        // Update enrollment openedLessons locally
        setEnrollment(prev => ({
          ...prev,
          openedLessons: res.data.openedLessons
        }));
      }
    } catch (e) {
      alert('Failed to register study material access: ' + e.message);
    } finally {
      setAccessingTopicId(null);
    }
  };

  const handleCompleteTopic = async (lessonId) => {
    try {
      setCompletingTopicId(lessonId);
      const res = await courseService.completeTopic(courseId, lessonId);
      if (res.data?.success) {
        await fetchDetail();
        if (res.data.certificateEligible) {
          alert('Topic completed! You have finished all topics — your certificate is now eligible.');
        } else {
          alert('Topic marked as completed!');
        }
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to complete topic: ' + e.message);
    } finally {
      setCompletingTopicId(null);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <Loader className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-gray-600 font-semibold">Loading course details...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !course) {
    return (
      <StudentLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center max-w-lg mx-auto my-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Error Loading Course</h3>
          <p className="text-red-700 text-sm mb-6">{error || 'Course not found.'}</p>
          <button onClick={() => navigate('/student/courses')} className="btn btn-secondary mx-auto">
            Back to Courses
          </button>
        </div>
      </StudentLayout>
    );
  }

  // Not enrolled guard
  if (!enrollment) {
    return (
      <StudentLayout>
        <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center max-w-md mx-auto my-12 shadow">
          <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Access Locked</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            You must enroll in this course before accessing the learning materials and syllabus.
          </p>
          <button
            onClick={async () => {
              try {
                await courseService.enrollCourse(courseId);
                fetchDetail();
              } catch (e) {
                alert('Enrollment failed: ' + e.message);
              }
            }}
            className="btn btn-primary w-full"
          >
            Enroll in Course
          </button>
        </div>
      </StudentLayout>
    );
  }

  // 1. Prerequisite Quiz workflow - show first, then topics below
  const showPrerequisiteQuiz = !enrollment.prerequisiteCompleted;
  const hasNext = currentQuizStep < quizQuestions.length - 1;
  const currentQuestion = quizQuestions[currentQuizStep];
  const isAnswered = answers[currentQuizStep] !== undefined;

  if (showPrerequisiteQuiz) {
    const lessons = course.lessons || [];
    
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto my-8">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="badge badge-intermediate mb-3">Assessment Gate</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              Prerequisite Knowledge Test
            </h1>
            <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
              Please complete this 15-question diagnostic quiz for <strong>{course.title}</strong> to unlock your syllabus workspace.
            </p>
          </div>

          {quizResult ? (
            /* Results Screen */
            <div className="card text-center p-8 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border-2 border-indigo-100">
              <Trophy className="mx-auto h-16 w-16 text-amber-500 mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold text-gray-900">Assessment Complete!</h2>
              <p className="text-gray-600 mt-1">Your diagnostics have been registered.</p>
              
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-8">
                <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Test Score</p>
                  <p className="text-3xl font-black text-indigo-600 mt-1">{quizResult.score}%</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Assigned Level</p>
                  <p className="text-3xl font-black text-purple-600 mt-1">{quizResult.knowledgeLevel}</p>
                </div>
              </div>

              <button
                onClick={handleEnterWorkspace}
                className="btn btn-primary w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-3"
              >
                Enter Course Workspace
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            /* Quiz Screen */
            <div className="card space-y-6">
              {/* Progress bar */}
              <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                <span>Question {currentQuizStep + 1} of {quizQuestions.length}</span>
                <span>{Math.round(((currentQuizStep) / quizQuestions.length) * 100)}% Answered</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                  style={{ width: `${((currentQuizStep + 1) / quizQuestions.length) * 100}%` }}
                />
              </div>

              {currentQuestion && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-800 leading-snug">
                    {currentQuestion.question}
                  </h3>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => {
                      const isSelected = answers[currentQuizStep] === option;
                      return (
                        <button
                          key={option}
                          onClick={() => handleSelectOption(currentQuizStep, option)}
                          className={`w-full text-left px-5 py-4 rounded-xl border font-medium transition-all flex items-center justify-between group ${
                            isSelected 
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm' 
                              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-gray-700'
                          }`}
                        >
                          <span>{option}</span>
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'border-indigo-600 bg-indigo-600 text-white' 
                              : 'border-slate-300 group-hover:border-indigo-400 bg-white'
                          }`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => setCurrentQuizStep(prev => Math.max(0, prev - 1))}
                  disabled={currentQuizStep === 0}
                  className="btn btn-secondary py-2 text-sm disabled:opacity-50"
                >
                  Previous
                </button>

                {hasNext ? (
                  <button
                    onClick={() => setCurrentQuizStep(prev => prev + 1)}
                    disabled={!isAnswered}
                    className="btn btn-primary py-2 px-6 text-sm"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz || !isAnswered}
                    className="btn btn-primary py-2 px-6 text-sm flex items-center gap-2"
                  >
                    {submittingQuiz ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      'Submit Evaluation'
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Topics Preview Section */}
          <div className="mt-8 card p-0 overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Course Topics Preview</h3>
              <p className="text-xs text-gray-500 mt-1">Complete the prerequisite above to access these topics</p>
            </div>
            
            <div className="divide-y divide-gray-100">
              {lessons.map((lesson, idx) => (
                <div key={lesson._id} className="px-5 py-4 flex items-center gap-3.5 opacity-60">
                  <Lock className="h-5 w-5 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-bold uppercase">Topic {idx + 1}</p>
                    <p className="text-sm font-bold truncate text-gray-600">{lesson.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // 2. Active Course Workspace workflow
  const lessons = course.lessons || [];
  const isCourseCompleted = enrollment.status === 'completed';

  const isLessonOpened = (lessonId) =>
    enrollment.openedLessons?.some(id => String(id) === String(lessonId));
  const isLessonCompleted = (lessonId) =>
    enrollment.completedLessons?.some(id => String(id) === String(lessonId));

  return (
    <StudentLayout>
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar: Syllabus & Navigation */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="card space-y-4">
            <div>
              <span className="badge badge-advanced mb-2">Workspace</span>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">Syllabus Overview</h2>
              <p className="text-xs text-gray-500 mt-1">Course progress tracking</p>
            </div>

            {/* Progress indicators */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Completion Status</span>
                <span>{enrollment.progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r transition-all duration-500 ${
                    isCourseCompleted ? 'from-emerald-500 to-green-600' : 'from-blue-600 to-indigo-600'
                  }`}
                  style={{ width: `${enrollment.progress}%` }}
                />
              </div>
            </div>

            {/* Diagnostics Badge */}
            <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900 font-semibold">
              <span>Diagnostic Level:</span>
              <span className="uppercase text-purple-700">{enrollment.knowledgeLevel}</span>
            </div>
          </div>

          {/* Topics List Card */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Course Modules</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {lessons.map((lesson, idx) => {
                const completed = isLessonCompleted(lesson._id);
                const opened = isLessonOpened(lesson._id);
                const isSelected = selectedLesson?._id === lesson._id;

                let iconColor = 'text-gray-400';
                let Icon = Lock;

                if (completed) {
                  Icon = CheckCircle;
                  iconColor = 'text-emerald-500';
                } else if (opened) {
                  Icon = PlayCircle;
                  iconColor = 'text-amber-500';
                } else {
                  Icon = BookOpen;
                }

                return (
                  <button
                    key={lesson._id}
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setActiveTab('notes');
                    }}
                    className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors flex items-center gap-3.5 ${
                      isSelected ? 'bg-indigo-50/40 border-r-4 border-indigo-600' : ''
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
                    <div className="min-w-0">
                      <p className={`text-xs text-gray-400 font-bold uppercase`}>Topic {idx + 1}</p>
                      <p className={`text-sm font-bold truncate mt-0.5 ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>
                        {lesson.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Display: Content & Tabs */}
        <div className="flex-1 space-y-6">
          {/* Welcome/Completed Banner */}
          {isCourseCompleted && (
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Trophy className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Congratulations! Course Completed!</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    All topics completed on{' '}
                    {enrollment.completedAt
                      ? new Date(enrollment.completedAt).toLocaleDateString()
                      : 'today'}
                    . {enrollment.certificateEligible ? 'Your certificate is ready to claim.' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/student/certificates')}
                className="btn btn-primary whitespace-nowrap py-2.5 px-6 shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-600 to-teal-600 border-none hover:shadow-emerald-500/40"
              >
                Claim Completion Certificate
              </button>
            </div>
          )}

          {selectedLesson ? (
            <div className="card space-y-6">
              {/* Lesson Title and Header */}
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                  {selectedLesson.title}
                </h1>
                {selectedLesson.description && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    {selectedLesson.description}
                  </p>
                )}
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 text-sm">
                {[
                  { id: 'notes', label: 'Notes', icon: FileText },
                  { id: 'material', label: 'Study Material', icon: BookOpen },
                  { id: 'pdf', label: 'PDFs & Docs', icon: FileText },
                  { id: 'references', label: 'References', icon: ExternalLink },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-5 py-3 border-b-2 font-semibold transition-all ${
                        isActive 
                          ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10' 
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Display */}
              <div className="min-h-[220px] bg-slate-50/30 rounded-xl p-5 border border-slate-100">
                {activeTab === 'notes' && (
                  <div className="prose max-w-none text-sm text-gray-700 leading-relaxed space-y-4">
                    <p className="font-bold text-gray-800">Lecture Notes:</p>
                    <p>{selectedLesson.notes || selectedLesson.content}</p>
                  </div>
                )}

                {activeTab === 'material' && (
                  <div className="space-y-5">
                    <div className="prose max-w-none text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      <p className="font-bold text-gray-800">Interactive Study Material:</p>
                      <p>
                        {selectedLesson.studyMaterial ||
                          'Open this material to unlock progress tracking for this topic. Review the content carefully before marking the topic complete.'}
                      </p>
                    </div>
                    
                    {!isLessonOpened(selectedLesson._id) && (
                      <button
                        onClick={() => handleOpenMaterial(selectedLesson._id)}
                        disabled={accessingTopicId === selectedLesson._id}
                        className="btn btn-primary flex items-center justify-center gap-2 max-w-xs mt-4"
                      >
                        {accessingTopicId === selectedLesson._id ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            Opening...
                          </>
                        ) : (
                          <>
                            <BookOpen size={16} />
                            Open Interactive Material
                          </>
                        )}
                      </button>
                    )}

                    {isLessonOpened(selectedLesson._id) && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 text-emerald-800 flex items-center gap-2 max-w-md">
                        <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-semibold">Study material accessed. You can now complete this topic.</span>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'pdf' && (
                  <div className="space-y-4 text-sm">
                    <p className="font-bold text-gray-800">Topic Syllabus Downloads:</p>
                    {selectedLesson.pdfUrl ? (
                      <a
                        href={selectedLesson.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold border border-indigo-200 rounded-xl px-4 py-3 bg-indigo-50/20 transition-colors"
                      >
                        <FileText size={16} />
                        Download Core Syllabus PDF (Topic Module)
                      </a>
                    ) : (
                      <div className="text-gray-500 italic">No specific PDF documents uploaded for this topic.</div>
                    )}
                  </div>
                )}

                {activeTab === 'references' && (
                  <div className="space-y-4 text-sm">
                    <p className="font-bold text-gray-800">Additional Web References & Code Repos:</p>
                    {selectedLesson.resources && selectedLesson.resources.length > 0 ? (
                      <div className="space-y-2">
                        {selectedLesson.resources.map((res, i) => (
                          <a
                            key={i}
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-3.5 border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/10 rounded-xl transition-all font-semibold text-slate-700"
                          >
                            <span className="flex items-center gap-2 text-xs">
                              <ExternalLink size={14} className="text-slate-400" />
                              {res.title || `Resource ${i+1}`}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase">{res.type || 'Link'}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">No supplementary reference links provided.</div>
                    )}
                  </div>
                )}
              </div>

              {/* Completing Topic gating and actions */}
              <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-gray-500 font-medium">
                  {!isLessonOpened(selectedLesson._id) ? (
                    <span className="text-red-500 font-bold flex items-center gap-1">
                      <AlertCircle size={14} /> Completion locked: Open Study Material tab first!
                    </span>
                  ) : isLessonCompleted(selectedLesson._id) ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      ✓ Completed topic!
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      ● Ready to mark completed!
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleCompleteTopic(selectedLesson._id)}
                  disabled={
                    !isLessonOpened(selectedLesson._id) || 
                    isLessonCompleted(selectedLesson._id) || 
                    completingTopicId === selectedLesson._id
                  }
                  className="btn btn-primary w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2"
                >
                  {completingTopicId === selectedLesson._id ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isLessonCompleted(selectedLesson._id) ? (
                    <>
                      <CheckCircle size={15} />
                      Completed
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      Mark Topic Completed
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Welcome/Fallback display */
            <div className="card text-center py-16">
              <BookOpen className="mx-auto h-16 w-16 text-indigo-400 mb-4 animate-pulse" />
              <h2 className="text-xl font-bold text-gray-800">Select a Module Topic</h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
                Click on any topic in the course syllabus on the left to start viewing materials and completing assignments.
              </p>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentCourseDetail;
