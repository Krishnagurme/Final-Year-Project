import React, { useState, useEffect } from 'react';
import { topicQuizService, xpService } from '../services/index.js';
import { CheckCircle, BookOpen, Trophy, Target, ArrowRight, Lock } from 'lucide-react';

const TopicCompletionCard = ({ courseId, topicId, topicName, onQuizStart, onContinue }) => {
  const [quizGenerated, setQuizGenerated] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [xpStats, setXpStats] = useState(null);

  useEffect(() => {
    fetchXPStats();
  }, []);

  const fetchXPStats = async () => {
    try {
      const response = await xpService.getStats();
      setXpStats(response.data.data);
    } catch (error) {
      console.error('Error fetching XP stats:', error);
    }
  };

  const handleGenerateQuiz = async () => {
    setLoading(true);
    try {
      const response = await topicQuizService.generateQuiz({
        courseId,
        topicId,
        topicName,
      });
      setQuizData(response.data.data);
      setQuizGenerated(true);
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    if (onQuizStart && quizData) {
      onQuizStart(quizData);
    }
  };

  return (
    <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Topic Completed!</h3>
          <p className="text-gray-600 mb-4">
            You've completed studying "{topicName}". Test your knowledge with a topic quiz to earn XP and track your progress.
          </p>

          {/* XP Preview */}
          {xpStats && (
            <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
              <div className="flex items-center gap-4">
                <Trophy className="text-yellow-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Potential XP Reward</p>
                  <p className="text-lg font-bold text-green-600">+20 XP</p>
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${xpStats.xpToNextLevel > 0 ? (xpStats.xp / (xpStats.xp + xpStats.xpToNextLevel)) * 100 : 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {xpStats.xp} XP
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!quizGenerated ? (
            <button
              onClick={handleGenerateQuiz}
              disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating Quiz...
                </>
              ) : (
                <>
                  <BookOpen size={18} />
                  Take Topic Quiz
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleStartQuiz}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <Target size={18} />
                Start Quiz ({quizData.questions.length} Questions)
              </button>
              
              <button
                onClick={onContinue}
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
              >
                Continue to Next Topic
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>Tip:</strong> Passing the quiz (60%+) awards +20 XP. Scoring 90%+ gives an additional +10 XP bonus!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicCompletionCard;
