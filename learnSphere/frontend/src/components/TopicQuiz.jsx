import React, { useState } from 'react';
import { topicQuizService } from '../services/index.js';
import { CheckCircle, XCircle, Target, Trophy, ArrowRight } from 'lucide-react';

const TopicQuiz = ({ courseId, topicId, topicName, quizData, onComplete, onCancel }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;

  const handleSelectAnswer = (answer) => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: answer,
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const answerArray = quizData.questions.map((q, idx) => ({
        questionId: q.id,
        studentAnswer: answers[idx],
      }));

      const response = await topicQuizService.submitQuiz({
        courseId,
        topicId,
        topicName,
        answers: answerArray,
      });

      setResults(response.data.data);
      setSubmitted(true);
      
      if (onComplete) {
        onComplete(response.data.data);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted && results) {
    const passed = results.score >= 60;
    return (
      <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            {passed ? (
              <Trophy className="text-yellow-500" size={64} />
            ) : (
              <XCircle className="text-red-500" size={64} />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {passed ? 'Quiz Passed!' : 'Quiz Failed'}
          </h2>
          <p className="text-gray-600">Topic: {topicName}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-purple-200 text-center">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-3xl font-bold text-purple-600">{results.score}%</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-200 text-center">
            <p className="text-sm text-gray-600">Correct</p>
            <p className="text-3xl font-bold text-green-600">
              {results.correctCount}/{results.totalQuestions}
            </p>
          </div>
        </div>

        {results.xpEarned > 0 && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-6">
            <div className="flex items-center gap-3">
              <Trophy className="text-green-600" size={24} />
              <div>
                <p className="text-sm font-semibold text-green-800">XP Earned</p>
                <p className="text-2xl font-bold text-green-600">+{results.xpEarned} XP</p>
              </div>
            </div>
          </div>
        )}

        {results.aiFeedback && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
            <h4 className="font-bold text-blue-900 mb-2">AI Feedback</h4>
            <p className="text-sm text-blue-700">{results.aiFeedback.overallFeedback}</p>
          </div>
        )}

        <button
          onClick={onCancel}
          className="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Topic Quiz</h3>
          <p className="text-sm text-gray-600">{topicName}</p>
        </div>
        <div className="text-sm font-semibold text-gray-700">
          Question {currentQuestionIndex + 1} of {quizData.questions.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          {currentQuestion.question}
        </h4>

        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected = answers[currentQuestionIndex] === option;
            return (
              <button
                key={option}
                onClick={() => handleSelectAnswer(option)}
                className={`w-full text-left px-5 py-4 rounded-xl border font-medium transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="btn btn-secondary px-6"
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={!answers[currentQuestionIndex] || loading}
          className="btn btn-primary px-6 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Submitting...
            </>
          ) : isLastQuestion ? (
            <>
              <Target size={18} />
              Submit Quiz
            </>
          ) : (
            'Next'
          )}
        </button>
      </div>

      <button
        onClick={onCancel}
        className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
      >
        Cancel Quiz
      </button>
    </div>
  );
};

export default TopicQuiz;
