import User from '../models/User.js';

// XP rewards for different actions
const XP_REWARDS = {
  COMPLETE_TOPIC: 10,
  PASS_TOPIC_QUIZ: 20,
  QUIZ_BONUS_90_PLUS: 10,
  COMPLETE_COURSE: 100,
  PASS_FINAL_ASSESSMENT: 50,
  COMPLETE_LESSON: 5,
  DAILY_LOGIN: 5,
};

// Level thresholds
const LEVEL_THRESHOLDS = {
  BEGINNER: { min: 0, max: 100, xpRequired: 100 },
  INTERMEDIATE: { min: 101, max: 300, xpRequired: 300 },
  ADVANCED: { min: 301, max: 600, xpRequired: 600 },
  EXPERT: { min: 601, max: Infinity, xpRequired: 1000 },
};

// Calculate skill level based on XP
function calculateSkillLevel(xp) {
  if (xp >= LEVEL_THRESHOLDS.EXPERT.min) return 'EXPERT';
  if (xp >= LEVEL_THRESHOLDS.ADVANCED.min) return 'ADVANCED';
  if (xp >= LEVEL_THRESHOLDS.INTERMEDIATE.min) return 'INTERMEDIATE';
  return 'BEGINNER';
}

// Calculate level number based on XP
function calculateLevel(xp) {
  if (xp >= 1000) return 4; // Expert
  if (xp >= 300) return 3; // Advanced
  if (xp >= 100) return 2; // Intermediate
  return 1; // Beginner
}

// Calculate XP required for next level
function calculateXPToNextLevel(currentXP) {
  const level = calculateLevel(currentXP);
  switch (level) {
    case 1: return 100 - currentXP;
    case 2: return 300 - currentXP;
    case 3: return 600 - currentXP;
    case 4: return 1000 - currentXP;
    default: return 100;
  }
}

// Update learning streak
async function updateLearningStreak(userId) {
  const user = await User.findById(userId);
  if (!user) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = new Date(user.lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day, no change
    return user.learningStreak;
  } else if (diffDays === 1) {
    // Consecutive day, increment streak
    user.learningStreak += 1;
  } else {
    // Streak broken, reset to 1
    user.learningStreak = 1;
  }

  user.lastActiveDate = new Date();
  await user.save();
  
  // Check for streak achievements
  if (user.learningStreak === 7) {
    await unlockAchievement(userId, 'STREAK_7');
  } else if (user.learningStreak === 30) {
    await unlockAchievement(userId, 'STREAK_30');
  }

  return user.learningStreak;
}

// Unlock achievement
async function unlockAchievement(userId, achievementType) {
  const user = await User.findById(userId);
  if (!user) return false;

  const existingAchievement = user.achievements.find(a => a.type === achievementType);
  if (existingAchievement) return false; // Already unlocked

  user.achievements.push({
    type: achievementType,
    unlockedAt: new Date(),
  });

  await user.save();
  return true;
}

// Add XP to user
async function addXP(userId, xpAmount, reason = 'general') {
  console.log('addXP called with userId:', userId, 'xpAmount:', xpAmount, 'reason:', reason);
  const user = await User.findById(userId);
  if (!user) {
    console.error('User not found with ID:', userId);
    throw new Error(`User not found with ID: ${userId}`);
  }

  // Initialize fields if they don't exist
  if (typeof user.xp !== 'number') user.xp = 0;
  if (typeof user.totalXP !== 'number') user.totalXP = 0;
  if (typeof user.level !== 'number') user.level = 1;
  if (!user.skillLevel) user.skillLevel = 'BEGINNER';
  if (typeof user.xpToNextLevel !== 'number') user.xpToNextLevel = 100;

  user.xp += xpAmount;
  user.totalXP += xpAmount;

  const oldLevel = user.level;
  const oldSkillLevel = user.skillLevel;

  // Update level and skill level
  user.level = calculateLevel(user.xp);
  user.skillLevel = calculateSkillLevel(user.xp);
  user.xpToNextLevel = calculateXPToNextLevel(user.xp);

  // Check for level up
  const leveledUp = user.level > oldLevel;
  const skillLevelChanged = user.skillLevel !== oldSkillLevel;

  if (skillLevelChanged && user.skillLevel === 'EXPERT') {
    await unlockAchievement(userId, 'EXPERT_LEVEL');
  }

  await user.save();

  return {
    xpAdded: xpAmount,
    totalXP: user.totalXP,
    currentXP: user.xp,
    level: user.level,
    skillLevel: user.skillLevel,
    xpToNextLevel: user.xpToNextLevel,
    leveledUp,
    skillLevelChanged,
  };
}

// Update topic progress
async function updateTopicProgress(userId, courseId, topicId, topicName, quizScore, completed = false) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const existingProgress = user.topicProgress.find(
    tp => tp.courseId.toString() === courseId && tp.topicId === topicId
  );

  if (existingProgress) {
    existingProgress.quizScore = Math.max(existingProgress.quizScore, quizScore);
    existingProgress.quizAttempts += 1;
    if (completed) {
      existingProgress.completed = true;
      existingProgress.completedAt = new Date();
    }
  } else {
    user.topicProgress.push({
      courseId,
      topicId,
      topicName,
      completed,
      quizScore,
      quizAttempts: 1,
      completedAt: completed ? new Date() : null,
    });
  }

  await user.save();
  return user.topicProgress;
}

// Get user gamification stats
async function getGamificationStats(userId) {
  const user = await User.findById(userId)
    .populate('enrolledCourses.courseId');

  if (!user) throw new Error('User not found');

  const totalTopics = user.topicProgress.length;
  const completedTopics = user.topicProgress.filter(tp => tp.completed).length;
  const totalCourses = user.enrolledCourses.length;
  const completedCourses = user.enrolledCourses.filter(ec => ec.status === 'completed').length;

  // Calculate average quiz score
  const quizScores = user.topicProgress
    .filter(tp => tp.quizScore > 0)
    .map(tp => tp.quizScore);
  const avgQuizScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length)
    : 0;

  // Get strengths and weaknesses from assessment history
  const recentAssessments = user.assessmentHistory.slice(-5);
  const strengths = [...new Set(recentAssessments.flatMap(a => a.strengths || []))];
  const weaknesses = [...new Set(recentAssessments.flatMap(a => a.weakTopics || []))];

  // Calculate next goal
  let nextGoal = '';
  const xpToNext = user.xpToNextLevel;
  if (user.skillLevel === 'BEGINNER') {
    nextGoal = `Complete more topics and score at least 80% on quizzes to reach Intermediate (${xpToNext} XP needed)`;
  } else if (user.skillLevel === 'INTERMEDIATE') {
    nextGoal = `Master intermediate topics and pass final assessments to reach Advanced (${xpToNext} XP needed)`;
  } else if (user.skillLevel === 'ADVANCED') {
    nextGoal = `Complete advanced courses and achieve expert-level scores to reach Expert (${xpToNext} XP needed)`;
  } else {
    nextGoal = 'You have reached Expert level! Continue learning to maintain your status.';
  }

  return {
    level: user.level,
    skillLevel: user.skillLevel,
    xp: user.xp,
    xpToNextLevel: user.xpToNextLevel,
    totalXP: user.totalXP,
    learningStreak: user.learningStreak,
    achievements: user.achievements,
    totalTopics,
    completedTopics,
    totalCourses,
    completedCourses,
    avgQuizScore,
    strengths,
    weaknesses,
    nextGoal,
    progressPercentage: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
  };
}

export const xpService = {
  XP_REWARDS,
  LEVEL_THRESHOLDS,
  calculateSkillLevel,
  calculateLevel,
  calculateXPToNextLevel,
  updateLearningStreak,
  unlockAchievement,
  addXP,
  updateTopicProgress,
  getGamificationStats,
};
