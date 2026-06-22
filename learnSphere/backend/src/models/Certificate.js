import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    certificateNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    instructorName: String,
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    certificateUrl: {
      type: String,
      required: true,
    },
    verificationUrl: {
      type: String,
      unique: true,
      sparse: true,
    },
    qrCodeUrl: {
      type: String,
    },
    skills: [{
      name: String,
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      },
    }],
    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'Pass', 'Fail', null],
    },
    credits: {
      type: Number,
      min: 0,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isValid: {
      type: Boolean,
      default: true,
      index: true,
    },
    revocationReason: {
      type: String,
      enum: ['revoked', 'expired', 'error', 'other', null],
    },
    metadata: {
      templateId: String,
      issuerId: String,
      program: String,
      department: String,
      // Additional metadata as needed
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for certificate verification URL
certificateSchema.virtual('verificationLink').get(function() {
  return `${process.env.BASE_URL}/verify/${this.certificateNumber}`;
});

// Indexes
certificateSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export default mongoose.model('Certificate', certificateSchema);
