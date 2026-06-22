import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  badgeId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
  metadata: { type: Object, default: {} }
});

const streakSchema = new mongoose.Schema({
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActivityDate: { type: Date },
  activityHistory: [{
    date: { type: Date, required: true },
    activityType: { type: String, required: true },
    pointsEarned: { type: Number, default: 0 }
  }]
});

const gamificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  xp: { 
    total: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    xpToNextLevel: { type: Number, default: 1000 },
    xpHistory: [{
      amount: { type: Number, required: true },
      source: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      metadata: { type: Object }
    }]
  },
  badges: [badgeSchema],
  streaks: {
    learning: streakSchema,
    // Add more streak types as needed
  },
  achievements: [{
    achievementId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String },
    earnedAt: { type: Date, default: Date.now },
    progress: { 
      current: { type: Number, default: 0 },
      target: { type: Number, required: true }
    },
    isCompleted: { type: Boolean, default: false },
    metadata: { type: Object }
  }],
  leaderboardPosition: { type: Number },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
gamificationSchema.index({ userId: 1 });
gamificationSchema.index({ 'xp.total': -1 });

gamificationSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to update XP and level
// This will be implemented in the service layer

export default mongoose.model('Gamification', gamificationSchema);
