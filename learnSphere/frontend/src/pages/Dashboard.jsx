import React, { useState, useEffect } from 'react';
import { StudentLayout } from '../components/Layout.jsx';
import { analyticsService } from '../services/index.js';
import { TrendingUp, BarChart3, PieChart, Activity, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await analyticsService.getDashboardAnalytics();
      setAnalytics(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-red-900 font-semibold">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!analytics) {
    return (
      <StudentLayout>
        <div className="p-6 text-center text-gray-500">No data available</div>
      </StudentLayout>
    );
  }

  const { courseCompletion, skillProgression, assessmentHistory, confidenceScores } = analytics;

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Learning Dashboard</h1>
          <p className="text-gray-600">Track your progress and performance</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 mb-8">
          <div className="flex space-x-8">
            {['overview', 'skills', 'assessments', 'confidence'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Course Completion */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Courses Completed</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {courseCompletion.completed}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">In Progress</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {courseCompletion.inProgress}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Completion Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {courseCompletion.completionRate}%
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Current Level</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {skillProgression.currentSkillLevel}
                    </p>
                  </div>
                  <PieChart className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Course Details */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Enrolled Courses</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {courseCompletion.courses.map(course => (
                  <div
                    key={course.courseId}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{course.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">Status: {course.status}</p>
                      </div>
                      <div className="text-right">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{course.progress}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Average Score</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">
                  {skillProgression.averageScore}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Highest Score</p>
                <p className="text-4xl font-bold text-green-600 mt-2">
                  {skillProgression.highestScore}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Total Assessments</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">
                  {skillProgression.totalAssessments}
                </p>
              </div>
            </div>

            {/* Skill Progression by Subject */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Skill Progression by Subject
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {skillProgression.skillsProgression.map(skill => (
                  <div key={skill.subject} className="px-6 py-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">{skill.subject}</h4>
                      <span className="text-sm font-medium text-gray-600">
                        {skill.attempts} attempts
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">First Score</p>
                        <p className="text-lg font-bold text-gray-900">{skill.firstScore}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Last Score</p>
                        <p className="text-lg font-bold text-gray-900">{skill.lastScore}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Improvement</p>
                        <p
                          className={`text-lg font-bold ${skill.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {skill.improvement > 0 ? '+' : ''}
                          {skill.improvement}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Average</p>
                        <p className="text-lg font-bold text-gray-900">{skill.averageScore}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Highest</p>
                        <p className="text-lg font-bold text-gray-900">{skill.highestScore}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assessments Tab */}
        {activeTab === 'assessments' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Total Assessments</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">
                  {assessmentHistory.totalAssessments}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Average Score</p>
                <p className="text-4xl font-bold text-green-600 mt-2">
                  {assessmentHistory.averageScore}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Best Score</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">
                  {assessmentHistory.bestScore}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Trend</p>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    assessmentHistory.trend === 'Improving'
                      ? 'text-green-600'
                      : assessmentHistory.trend === 'Declining'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {assessmentHistory.trend}
                </p>
              </div>
            </div>

            {/* Assessment History Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Assessments</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Confidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {assessmentHistory.history.map((assessment, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {assessment.subject}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{assessment.score}%</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              assessment.skillLevel === 'ADVANCED'
                                ? 'bg-green-100 text-green-800'
                                : assessment.skillLevel === 'INTERMEDIATE'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {assessment.skillLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {(assessment.confidenceScore * 100).toFixed(0)}%
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {assessment.dateFormatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Confidence Tab */}
        {activeTab === 'confidence' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Average Confidence</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">
                  {(confidenceScores.averageConfidence * 100).toFixed(0)}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Highest Confidence</p>
                <p className="text-4xl font-bold text-green-600 mt-2">
                  {(confidenceScores.highestConfidence * 100).toFixed(0)}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">High Confidence</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">
                  {confidenceScores.distribution.high}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Low Confidence</p>
                <p className="text-4xl font-bold text-red-600 mt-2">
                  {confidenceScores.distribution.low}
                </p>
              </div>
            </div>

            {/* Confidence by Subject */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Confidence Score by Subject</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {Object.entries(confidenceScores.bySubject).map(([subject, data]) => (
                  <div key={subject} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">{subject}</h4>
                      <span className="text-sm text-gray-600">
                        {data.assessmentCount} assessments
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              data.averageConfidence >= 0.8
                                ? 'bg-green-500'
                                : data.averageConfidence >= 0.5
                                  ? 'bg-blue-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${data.averageConfidence * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {(data.averageConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {confidenceScores.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-4">Recommendations</h3>
                <ul className="space-y-2">
                  {confidenceScores.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-blue-800 flex items-start">
                      <span className="mr-3 text-blue-600">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Dashboard;
