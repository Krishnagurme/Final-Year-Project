import React, { useState, useEffect } from 'react';
import { finalAssessmentService } from '../services/index.js';
import { Trophy, Lock, Target, Award, AlertCircle } from 'lucide-react';

const FinalAssessmentCard = ({ courseId, courseName, onStartAssessment }) => {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEligibility();
  }, [courseId]);

  const checkEligibility = async () => {
    try {
      const response = await finalAssessmentService.checkEligibility(courseId);
      setEligibility(response.data.data);
    } catch (error) {
      console.error('Error checking eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!eligibility) {
    return null;
  }

  if (!eligibility.eligible) {
    return (
      <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Lock className="text-amber-600" size={32} />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Final Assessment Locked</h3>
            <p className="text-gray-600 mb-4">
              {eligibility.reason}
            </p>
            
            {eligibility.completionRate && (
              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-2">
                  <span>Current Progress</span>
                  <span>{eligibility.completionRate}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${eligibility.completionRate}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Complete at least 80% of topics to unlock the final assessment
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
            <Trophy className="text-purple-600" size={32} />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Final Assessment Available!</h3>
          <p className="text-gray-600 mb-4">
            Congratulations! You've completed {eligibility.completionRate}% of the course topics. 
            You're now eligible to take the final assessment to earn your certificate.
          </p>

          <div className="bg-white rounded-lg p-4 border border-purple-200 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Target className="text-purple-500" size={18} />
                <div>
                  <p className="text-xs text-gray-500">Topics Completed</p>
                  <p className="text-sm font-bold text-gray-900">{eligibility.topicsCompleted}/{eligibility.totalTopics}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Award className="text-purple-500" size={18} />
                <div>
                  <p className="text-xs text-gray-500">Passing Score</p>
                  <p className="text-sm font-bold text-gray-900">70%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-blue-500 mt-0.5" size={16} />
              <p className="text-xs text-blue-700">
                <strong>Important:</strong> The final assessment consists of 20-30 comprehensive questions. 
                Passing (70%+) will award you a course certificate and significant XP rewards.
              </p>
            </div>
          </div>

          <button
            onClick={onStartAssessment}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <Trophy size={18} />
            Start Final Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalAssessmentCard;
