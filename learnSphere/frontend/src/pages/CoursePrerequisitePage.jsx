import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../services/index.js';
import { useSelector } from 'react-redux';
import { Check, ChevronLeft, Loader, Trophy, ChevronRight, Activity, Circle, CheckCircle2 } from 'lucide-react';

const CoursePrerequisitePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuizStep, setCurrentQuizStep] = useState(0);
  const [enrolling, setEnrolling] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/course/${courseId}/prerequisite` } });
      return;
    }
    fetchData();
  }, [courseId, isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseRes, preReqRes] = await Promise.all([
        courseService.getCourseById(courseId),
        courseService.getPrerequisiteQuestions(courseId)
      ]);

      if (courseRes.data?.data) {
        setCourse(courseRes.data.data);
      }
      if (preReqRes.data?.questions) {
        setQuizQuestions(preReqRes.data.questions);
      }
    } catch (e) {
      alert("Failed to load prerequisite test: " + e.message);
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIndex, option) => {
    setAnswers(prev => ({
      ...prev,
      [qIndex]: option
    }));
  };

  const submitQuizAndEnroll = async () => {
    if (Object.keys(answers).length < quizQuestions.length) {
      alert(`Please answer all ${quizQuestions.length} questions before submitting.`);
      return;
    }

    try {
      setEnrolling(true);
      const submittedAnswers = Object.entries(answers).map(([idx, ans]) => ({
        questionIndex: parseInt(idx),
        selectedAnswer: ans
      }));

      const res = await courseService.enrollCourse(courseId, { answers: submittedAnswers });
      
      if (res.data?.success) {
        setQuizResult(res.data.data.enrollment); 
      }
    } catch (error) {
      alert('Error submitting assessment: ' + (error.response?.data?.message || error.message));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <Loader className="animate-spin text-blue-600 w-10 h-10 mb-4" />
      <p className="text-slate-500 font-medium text-sm">Loading assessment...</p>
    </div>
  );

  if (quizResult) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Trophy className="h-8 w-8 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Assessment Complete!</h2>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">We've personalized your learning path based on your results. You are now enrolled.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Score</p>
              <p className="text-2xl font-bold text-slate-900">{quizResult.prerequisiteScore}%</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Level</p>
              <p className="text-lg font-bold text-slate-900 mt-1 uppercase truncate">{quizResult.knowledgeLevel}</p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/student/courses/${courseId}`)}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Go to Course
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quizQuestions[currentQuizStep];
  const hasNext = currentQuizStep < quizQuestions.length - 1;
  const isAnswered = answers[currentQuizStep] !== undefined;
  const progressPercent = Math.round(((currentQuizStep) / quizQuestions.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Minimal Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft size={18} className="mr-1" /> Exit
          </button>
          
          <div className="text-sm font-semibold text-slate-900 truncate max-w-[200px] md:max-w-md text-center">
            {course?.title}
          </div>
          
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center px-4 py-12 md:py-16">
        <div className="w-full max-w-2xl">
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Diagnostic Assessment</h1>
            <p className="text-slate-500 text-base max-w-lg mx-auto">
              Please answer the following questions to help us tailor the course material to your current skill level.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-10 relative">
            
            {/* Progress Header inside Card */}
            <div className="flex justify-between items-center text-sm font-semibold text-slate-500 mb-4">
              <span>Question {currentQuizStep + 1} of {quizQuestions.length}</span>
              <span className="text-blue-600">{Math.round(((currentQuizStep) / quizQuestions.length) * 100)}%</span>
            </div>
            
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-8">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentQuizStep) / quizQuestions.length) * 100}%` }}
              ></div>
            </div>

            {currentQuestion && (
              <div className="space-y-8">
                <h3 className="text-xl md:text-2xl font-semibold text-slate-900 leading-relaxed">
                  {currentQuestion.question}
                </h3>

                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuizStep] === option;
                    
                    return (
                      <button
                        key={option}
                        onClick={() => handleSelectOption(currentQuizStep, option)}
                        className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center group ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50/40 shadow-sm' 
                            : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`mr-4 shrink-0 transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-300 group-hover:text-blue-300'}`}>
                          {isSelected ? <CheckCircle2 size={24} className="fill-blue-100" /> : <Circle size={24} />}
                        </div>
                        
                        <span className={`text-base font-medium leading-relaxed ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-8 mt-10 border-t border-slate-100">
              <button
                onClick={() => setCurrentQuizStep(prev => Math.max(0, prev - 1))}
                disabled={currentQuizStep === 0}
                className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {hasNext ? (
                <button
                  onClick={() => setCurrentQuizStep(prev => prev + 1)}
                  disabled={!isAnswered}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
                >
                  Next <ChevronRight size={18} className="ml-1" />
                </button>
              ) : (
                <button
                  onClick={submitQuizAndEnroll}
                  disabled={enrolling || !isAnswered}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrolling ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Assessment'
                  )}
                </button>
              )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoursePrerequisitePage;
