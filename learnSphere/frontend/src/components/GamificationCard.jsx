import React, { useEffect, useState } from 'react';
import { xpService } from '../services/index.js';
import { Flame, Trophy, Target, Zap, Award, TrendingUp } from 'lucide-react';

const GamificationCard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGamificationStats();
  }, []);

  const fetchGamificationStats = async () => {
    try {
      const response = await xpService.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching gamification stats:', error);
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

  if (!stats) {
    return null;
  }

  const getLevelEmoji = (level) => {
    switch (level) {
      case 1: return '🌱';
      case 2: return '🌿';
      case 3: return '🌳';
      case 4: return '🏆';
      default: return '🌱';
    }
  };

  const getLevelColor = (skillLevel) => {
    switch (skillLevel) {
      case 'BEGINNER': return 'text-green-600 bg-green-50 border-green-200';
      case 'INTERMEDIATE': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'ADVANCED': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'EXPERT': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const levelColor = getLevelColor(stats.skillLevel);
  const xpProgress = stats.xpToNextLevel > 0 
    ? Math.min(100, Math.round((stats.xp / (stats.xp + stats.xpToNextLevel)) * 100))
    : 100;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Your Progress</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-bold border ${levelColor}`}>
          {getLevelEmoji(stats.level)} {stats.skillLevel}
        </div>
      </div>

      {/* Level and XP */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-semibold text-gray-700">Level {stats.level}</span>
          </div>
          <span className="text-sm text-gray-600">
            {stats.xp} / {stats.xp + stats.xpToNextLevel} XP
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 text-center">
          {stats.xpToNextLevel} XP to next level
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="text-orange-500" size={18} />
            <span className="text-sm font-semibold text-gray-700">Streak</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats.learningStreak} days</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-blue-500" size={18} />
            <span className="text-sm font-semibold text-gray-700">Total XP</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.totalXP}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-green-500" size={18} />
            <span className="text-sm font-semibold text-gray-700">Topics</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stats.completedTopics}/{stats.totalTopics}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="text-purple-500" size={18} />
            <span className="text-sm font-semibold text-gray-700">Achievements</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.achievements.length}</p>
        </div>
      </div>

      {/* Next Goal */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
        <div className="flex items-start gap-3">
          <TrendingUp className="text-indigo-600 mt-1" size={20} />
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Next Goal</p>
            <p className="text-xs text-gray-700">{stats.nextGoal}</p>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {stats.achievements.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Achievements</h3>
          <div className="flex flex-wrap gap-2">
            {stats.achievements.slice(-3).map((achievement, index) => (
              <div 
                key={index}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300"
              >
                {achievement.type.replace(/_/g, ' ')}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationCard;
