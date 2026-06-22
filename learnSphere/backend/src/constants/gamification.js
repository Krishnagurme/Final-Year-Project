// Badge definitions
export const BadgeDefinitions = {
  EARLY_ADOPTER: {
    id: 'EARLY_ADOPTER',
    name: 'Early Adopter',
    description: 'Joined during the beta phase',
    icon: '🚀',
    xpReward: 100
  },
  QUICK_LEARNER: {
    id: 'QUICK_LEARNER',
    name: 'Quick Learner',
    description: 'Completed first course within 24 hours of enrollment',
    icon: '⚡',
    xpReward: 150
  },
  PERFECT_SCORE: {
    id: 'PERFECT_SCORE',
    name: 'Perfect Score',
    description: 'Scored 100% on a quiz',
    icon: '💯',
    xpReward: 200
  },
  STREAK_MASTER: {
    id: 'STREAK_MASTER',
    name: 'Streak Master',
    description: 'Maintained a 30-day learning streak',
    icon: '🔥',
    xpReward: 300
  },
  KNOWLEDGE_SHARER: {
    id: 'KNOWLEDGE_SHARER',
    name: 'Knowledge Sharer',
    description: 'Helped other students in the community',
    icon: '🤝',
    xpReward: 250
  },
  COURSE_COMPLETER: {
    id: 'COURSE_COMPLETER',
    name: 'Course Completer',
    description: 'Completed first course',
    icon: '🎓',
    xpReward: 200
  },
  QUIZ_MASTER: {
    id: 'QUIZ_MASTER',
    name: 'Quiz Master',
    description: 'Completed 10 quizzes with an average score above 90%',
    icon: '🧠',
    xpReward: 400
  },
  EARLY_BIRD: {
    id: 'EARLY_BIRD',
    name: 'Early Bird',
    description: 'Completed a lesson before 8 AM',
    icon: '🌅',
    xpReward: 100
  },
  NIGHT_OWL: {
    id: 'NIGHT_OWL',
    name: 'Night Owl',
    description: 'Completed a lesson after 10 PM',
    icon: '🌙',
    xpReward: 100
  },
  SOCIAL_BUTTERFLY: {
    id: 'SOCIAL_BUTTERFLY',
    name: 'Social Butterfly',
    description: 'Connected with 10 other learners',
    icon: '🦋',
    xpReward: 150
  }
};

// Achievement definitions
export const AchievementDefinitions = {
  // XP-based achievements
  NOVICE_LEARNER: {
    id: 'NOVICE_LEARNER',
    name: 'Novice Learner',
    description: 'Earn your first 1,000 XP',
    icon: '1️⃣',
    xpReward: 100,
    target: 1000,
    trigger: 'xp_earned'
  },
  DEDICATED_LEARNER: {
    id: 'DEDICATED_LEARNER',
    name: 'Dedicated Learner',
    description: 'Earn 10,000 XP',
    icon: '🔟',
    xpReward: 500,
    target: 10000,
    trigger: 'xp_earned'
  },
  EXPERT_LEARNER: {
    id: 'EXPERT_LEARNER',
    name: 'Expert Learner',
    description: 'Earn 50,000 XP',
    icon: '5️⃣0️⃣',
    xpReward: 1000,
    target: 50000,
    trigger: 'xp_earned'
  },
  MASTER_LEARNER: {
    id: 'MASTER_LEARNER',
    name: 'Master Learner',
    description: 'Earn 100,000 XP',
    icon: '💯',
    xpReward: 2000,
    target: 100000,
    trigger: 'xp_earned'
  },
  
  // Level-based achievements
  LEVEL_5: {
    id: 'LEVEL_5',
    name: 'Level 5 Achiever',
    description: 'Reach level 5',
    icon: '5️⃣',
    xpReward: 100,
    target: 5,
    trigger: 'level_up'
  },
  LEVEL_10: {
    id: 'LEVEL_10',
    name: 'Level 10 Achiever',
    description: 'Reach level 10',
    icon: '🔟',
    xpReward: 200,
    target: 10,
    trigger: 'level_up'
  },
  LEVEL_25: {
    id: 'LEVEL_25',
    name: 'Level 25 Achiever',
    description: 'Reach level 25',
    icon: '2️⃣5️⃣',
    xpReward: 500,
    target: 25,
    trigger: 'level_up'
  },
  
  // Streak achievements
  THREE_DAY_STREAK: {
    id: 'THREE_DAY_STREAK',
    name: '3-Day Streak',
    description: 'Maintain a 3-day learning streak',
    icon: '🔥',
    xpReward: 100,
    target: 3,
    trigger: 'streak'
  },
  SEVEN_DAY_STREAK: {
    id: 'SEVEN_DAY_STREAK',
    name: '7-Day Streak',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥🔥',
    xpReward: 250,
    target: 7,
    trigger: 'streak'
  },
  THIRTY_DAY_STREAK: {
    id: 'THIRTY_DAY_STREAK',
    name: '30-Day Streak',
    description: 'Maintain a 30-day learning streak',
    icon: '🔥🔥🔥',
    xpReward: 500,
    target: 30,
    trigger: 'streak'
  },
  
  // Badge achievements
  FIRST_BADGE: {
    id: 'FIRST_BADGE',
    name: 'First Badge',
    description: 'Earn your first badge',
    icon: '🥇',
    xpReward: 50,
    target: 1,
    trigger: 'badge_earned'
  },
  BADGE_COLLECTOR: {
    id: 'BADGE_COLLECTOR',
    name: 'Badge Collector',
    description: 'Earn 5 different badges',
    icon: '🏆',
    xpReward: 200,
    target: 5,
    trigger: 'badge_earned'
  },
  BADGE_MASTER: {
    id: 'BADGE_MASTER',
    name: 'Badge Master',
    description: 'Earn all available badges',
    icon: '👑',
    xpReward: 500,
    target: Object.keys(BadgeDefinitions).length,
    trigger: 'badge_earned'
  },
  
  // Course completion achievements
  FIRST_COURSE: {
    id: 'FIRST_COURSE',
    name: 'First Course Completed',
    description: 'Complete your first course',
    icon: '1️⃣',
    xpReward: 200,
    target: 1,
    trigger: 'course_completed'
  },
  COURSE_EXPLORER: {
    id: 'COURSE_EXPLORER',
    name: 'Course Explorer',
    description: 'Complete 5 different courses',
    icon: '🗺️',
    xpReward: 500,
    target: 5,
    trigger: 'course_completed'
  },
  
  // Community achievements
  COMMUNITY_HELPER: {
    id: 'COMMUNITY_HELPER',
    name: 'Community Helper',
    description: 'Help 10 other learners in the community',
    icon: '🤝',
    xpReward: 300,
    target: 10,
    trigger: 'helped_others'
  }
};

// XP rewards for different actions
export const XPRewards = {
  // Course actions
  COURSE_STARTED: 10,
  COURSE_COMPLETED: 100,
  COURSE_RECOMMENDED: 5,
  
  // Lesson actions
  LESSON_STARTED: 2,
  LESSON_COMPLETED: 20,
  LESSON_REVIEWED: 10,
  
  // Quiz actions
  QUIZ_ATTEMPTED: 5,
  QUIZ_PASSED: 30,
  QUIZ_PERFECT_SCORE: 50,
  
  // Community actions
  COMMENT_ADDED: 2,
  COMMENT_LIKED: 1,
  RESOURCE_SHARED: 10,
  
  // Daily rewards
  DAILY_LOGIN: 10,
  STREAK_BONUS: 5, // Per day of streak
  
  // Achievement rewards
  BADGE_EARNED: 25,
  ACHIEVEMENT_UNLOCKED: 50
};

// Default values
export const DefaultValues = {
  INITIAL_LEVEL: 1,
  INITIAL_XP: 0,
  XP_TO_LEVEL_2: 1000,
  LEVEL_MULTIPLIER: 1.5
};
