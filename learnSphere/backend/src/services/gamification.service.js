import Gamification from '../models/Gamification.js';
import User from '../models/User.js';
import { BadgeDefinitions, AchievementDefinitions } from '../constants/gamification.js';

class GamificationService {
  // Initialize gamification for a new user
  static async initializeUser(userId) {
    const existing = await Gamification.findOne({ userId });
    if (existing) return existing;
    
    const gamification = new Gamification({
      userId,
      xp: {
        total: 0,
        level: 1,
        xpToNextLevel: 1000,
        xpHistory: []
      },
      badges: [],
      streaks: {
        learning: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          activityHistory: []
        }
      },
      achievements: Object.values(AchievementDefinitions).map(achievement => ({
        ...achievement,
        progress: { current: 0, target: achievement.target },
        isCompleted: false
      }))
    });
    
    return await gamification.save();
  }

  // Add XP to a user's profile
  static async addXP(userId, amount, source, metadata = {}) {
    const gamification = await this.initializeUser(userId);
    
    // Add XP
    gamification.xp.total += amount;
    gamification.xp.xpHistory.unshift({
      amount,
      source,
      timestamp: new Date(),
      metadata
    });
    
    // Check for level up
    const { level, xpToNextLevel } = this.calculateLevel(gamification.xp.total);
    const leveledUp = level > gamification.xp.level;
    
    if (leveledUp) {
      gamification.xp.level = level;
      gamification.xp.xpToNextLevel = xpToNextLevel;
      await this.checkForAchievements(userId, 'level_up', { level });
    }
    
    // Update learning streak
    await this.updateLearningStreak(userId);
    
    await gamification.save();
    
    return {
      newXP: gamification.xp.total,
      level: gamification.xp.level,
      xpToNextLevel: gamification.xp.xpToNextLevel,
      leveledUp,
      newLevel: leveledUp ? level : null
    };
  }
  
  // Calculate level based on XP
  static calculateLevel(xp) {
    // Exponential leveling formula: XP needed = (level * 1000) * 1.5^(level-1)
    let level = 1;
    let xpNeededForNextLevel = 1000;
    let xpForCurrentLevel = 0;
    
    while (xp >= xpNeededForNextLevel) {
      xpForCurrentLevel = xpNeededForNextLevel;
      level++;
      xpNeededForNextLevel = Math.floor(1000 * Math.pow(1.5, level - 1));
    }
    
    return {
      level,
      xpToNextLevel: xpNeededForNextLevel,
      currentLevelProgress: xp - xpForCurrentLevel,
      xpNeededForNextLevel: xpNeededForNextLevel - xpForCurrentLevel
    };
  }
  
  // Update learning streak
  static async updateLearningStreak(userId) {
    const gamification = await this.initializeUser(userId);
    const today = new Date().toDateString();
    const lastActivity = gamification.streaks.learning.lastActivityDate
      ? new Date(gamification.streaks.learning.lastActivityDate).toDateString()
      : null;
    
    // If already updated today, do nothing
    if (lastActivity === today) return gamification.streaks.learning;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (!lastActivity || new Date(lastActivity).toDateString() !== yesterday.toDateString()) {
      // Reset streak if not consecutive
      gamification.streaks.learning.currentStreak = 1;
    } else {
      // Increment streak
      gamification.streaks.learning.currentStreak++;
      if (gamification.streaks.learning.currentStreak > gamification.streaks.learning.longestStreak) {
        gamification.streaks.learning.longestStreak = gamification.streaks.learning.currentStreak;
      }
      
      // Check for streak achievements
      await this.checkForAchievements(userId, 'streak', { 
        days: gamification.streaks.learning.currentStreak 
      });
    }
    
    gamification.streaks.learning.lastActivityDate = new Date();
    gamification.streaks.learning.activityHistory.push({
      date: new Date(),
      activityType: 'learning',
      pointsEarned: 10 // Base points for daily activity
    });
    
    await gamification.save();
    return gamification.streaks.learning;
  }
  
  // Award a badge to a user
  static async awardBadge(userId, badgeId) {
    const gamification = await this.initializeUser(userId);
    
    // Check if badge already exists
    const badgeExists = gamification.badges.some(b => b.badgeId === badgeId);
    if (badgeExists) return null;
    
    const badge = BadgeDefinitions[badgeId];
    if (!badge) {
      throw new Error(`Badge with ID ${badgeId} not found`);
    }
    
    gamification.badges.push({
      badgeId,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      earnedAt: new Date()
    });
    
    await gamification.save();
    
    // Check for badge achievements
    await this.checkForAchievements(userId, 'badge_earned', { 
      badgeId,
      totalBadges: gamification.badges.length + 1
    });
    
    return badge;
  }
  
  // Check for and update achievements
  static async checkForAchievements(userId, triggerType, data = {}) {
    const gamification = await this.initializeUser(userId);
    const unlockedAchievements = [];
    
    for (const achievement of gamification.achievements) {
      if (achievement.isCompleted) continue;
      
      let isCompleted = false;
      
      switch (achievement.trigger) {
        case 'xp_earned':
          if (triggerType === 'xp_earned' && gamification.xp.total >= achievement.target) {
            isCompleted = true;
          }
          break;
          
        case 'level_up':
          if (triggerType === 'level_up' && data.level >= achievement.target) {
            isCompleted = true;
          }
          break;
          
        case 'streak':
          if (triggerType === 'streak' && data.days >= achievement.target) {
            isCompleted = true;
          }
          break;
          
        case 'badge_earned':
          if (triggerType === 'badge_earned' && data.totalBadges >= achievement.target) {
            isCompleted = true;
          }
          break;
          
        // Add more trigger types as needed
      }
      
      if (isCompleted) {
        achievement.isCompleted = true;
        achievement.completedAt = new Date();
        unlockedAchievements.push(achievement);
        
        // Award XP for completing an achievement
        await this.addXP(
          userId, 
          achievement.xpReward || 100, 
          'achievement_completed',
          { achievementId: achievement.achievementId }
        );
      }
    }
    
    if (unlockedAchievements.length > 0) {
      await gamification.save();
    }
    
    return unlockedAchievements;
  }
  
  // Get leaderboard
  static async getLeaderboard({ limit = 10, page = 1 } = {}) {
    const gamifications = await Gamification.find()
      .sort({ 'xp.total': -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name email avatar');
      
    // Update positions
    const leaderboard = await Promise.all(gamifications.map(async (g, index) => {
      // Update position in the database (this could be done in a background job)
      g.leaderboardPosition = (page - 1) * limit + index + 1;
      await g.save();
      
      return {
        position: g.leaderboardPosition,
        userId: g.userId._id,
        name: g.userId.name,
        avatar: g.userId.avatar,
        level: g.xp.level,
        xp: g.xp.total,
        badges: g.badges.length,
        achievements: g.achievements.filter(a => a.isCompleted).length
      };
    }));
    
    const total = await Gamification.countDocuments();
    
    return {
      leaderboard,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  // Get user's gamification profile
  static async getUserProfile(userId) {
    const gamification = await this.initializeUser(userId);
    const user = await User.findById(userId).select('name email avatar');
    
    // Calculate rank (this could be optimized)
    const rank = await Gamification.countDocuments({ 'xp.total': { $gt: gamification.xp.total } }) + 1;
    
    // Get recent activities
    const recentActivities = [
      ...gamification.xp.xpHistory.slice(0, 5).map(xp => ({
        type: 'xp_earned',
        amount: xp.amount,
        source: xp.source,
        timestamp: xp.timestamp,
        metadata: xp.metadata
      })),
      ...gamification.badges.slice(0, 5).map(badge => ({
        type: 'badge_earned',
        badgeId: badge.badgeId,
        name: badge.name,
        icon: badge.icon,
        timestamp: badge.earnedAt
      }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    
    // Get next achievements to unlock
    const nextAchievements = gamification.achievements
      .filter(a => !a.isCompleted)
      .sort((a, b) => a.target - b.target)
      .slice(0, 3);
    
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      stats: {
        level: gamification.xp.level,
        xp: gamification.xp.total,
        xpToNextLevel: gamification.xp.xpToNextLevel,
        currentStreak: gamification.streaks.learning.currentStreak,
        longestStreak: gamification.streaks.learning.longestStreak,
        badges: gamification.badges.length,
        achievements: gamification.achievements.filter(a => a.isCompleted).length,
        rank
      },
      recentActivities,
      nextAchievements,
      badges: gamification.badges,
      completedAchievements: gamification.achievements.filter(a => a.isCompleted)
    };
  }
}

export default GamificationService;
