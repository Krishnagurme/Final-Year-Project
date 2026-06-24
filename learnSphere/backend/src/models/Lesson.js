import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
    },
    description: String,
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Lesson content is required'],
    },
    studyMaterial: {
      type: String,
      default: '',
    },
    contentType: {
      type: String,
      enum: ['VIDEO', 'TEXT', 'AUDIO', 'PDF', 'INTERACTIVE'],
      default: 'VIDEO',
    },
    videoUrl: String,
    pdfUrl: String,
    duration: Number, // in minutes
    resources: [
      {
        title: String,
        url: String,
        type: String,
      },
    ],
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Lesson', lessonSchema);
