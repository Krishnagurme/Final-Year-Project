import React from 'react';
import { Brain, CheckCircle, AlertCircle, TrendingUp, Target, Lightbulb } from 'lucide-react';

const AIFeedbackCard = ({ feedback, loading }) => {
  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="card text-center py-8">
        <Brain className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <p className="text-gray-500">Complete an assessment to get AI feedback</p>
      </div>
    );
  }

  const { skillLevel, strengths, weaknesses, recommendations, feedback: feedbackText, confidenceScore, assessmentSummary } = feedback;

  const getLevelColor = (level) => {
    switch (level) {
      case 'BEGINNER': return 'text-green-600 bg-green-50 border-green-200';
      case 'INTERMEDIATE': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'ADVANCED': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'EXPERT': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const levelColor = getLevelColor(skillLevel);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="text-blue-600" size={24} />
          AI Insights
        </h2>
        <div className={`px-3 py-1 rounded-full text-sm font-bold border ${levelColor}`}>
          {skillLevel}
        </div>
      </div>

      {/* Current Level Summary */}
      {assessmentSummary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 mb-6">
          <p className="text-sm text-gray-700">{assessmentSummary}</p>
        </div>
      )}

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle className="text-green-500" size={16} />
            Strengths
          </h3>
          <div className="space-y-2">
            {strengths.map((strength, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500">✔</span>
                <span>{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses && weaknesses.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={16} />
            Needs Improvement
          </h3>
          <div className="space-y-2">
            {weaknesses.map((weakness, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-orange-500">•</span>
                <span>{weakness}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Lightbulb className="text-yellow-500" size={16} />
            Recommendations
          </h3>
          <div className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Score */}
      {confidenceScore !== undefined && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Target className="text-purple-500" size={16} />
            Confidence Score
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${Math.round(confidenceScore * 100)}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-700">
              {Math.round(confidenceScore * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Overall Feedback */}
      {feedbackText && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={16} />
            Overall Feedback
          </h3>
          <p className="text-sm text-gray-700">{feedbackText}</p>
        </div>
      )}
    </div>
  );
};

export default AIFeedbackCard;
