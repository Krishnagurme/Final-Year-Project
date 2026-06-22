import mongoose from 'mongoose';
import User from '../models/User.js';
import QuestionBank from '../models/QuestionBank.js';
import Test from '../models/Test.js';
import { authService } from '../services/auth.service.js';
const SEED_USERS = [
  {
    email: 'student@example.com',
    password: 'Student@123',
    firstName: 'John',
    lastName: 'Student',
    role: 'STUDENT',
  },
  {
    email: 'admin@example.com',
    password: 'Admin@123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
  },
];

export async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with test users...');

    // Check if users already exist
    const existingCount = await User.countDocuments();
    if (existingCount > 0) {
      console.log(`✅ Database already seeded (${existingCount} users found)`);
      await seedAssessmentSamples();
      return;
    }

    // Create test users
    for (const userData of SEED_USERS) {
      const hashedPassword = await authService.hashPassword(userData.password);
      const user = new User({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isEmailVerified: true,
      });

      await user.save();
      console.log(`✅ Created user: ${userData.email}`);
    }

    console.log('🎉 Database seeding completed successfully!');
    await seedAssessmentSamples();
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    throw error;
  }
}

async function seedAssessmentSamples() {
  const questionCount = await QuestionBank.countDocuments();
  if (questionCount > 0) return;

  const admin = await User.findOne({ role: 'ADMIN' });
  const samples = [
    {
      subject: 'Python Basics',
      question: 'Which keyword defines a function in Python?',
      options: ['func', 'def', 'function', 'define'],
      correctAnswer: 'def',
      difficulty: 'EASY',
      createdBy: admin?._id,
    },
    {
      subject: 'Python Basics',
      question: 'What is the output of print(2 ** 3)?',
      options: ['6', '8', '9', '5'],
      correctAnswer: '8',
      difficulty: 'MEDIUM',
      createdBy: admin?._id,
    },
    {
      subject: 'Data Structures',
      question: 'Which structure uses LIFO ordering?',
      options: ['Queue', 'Stack', 'Tree', 'Graph'],
      correctAnswer: 'Stack',
      difficulty: 'MEDIUM',
      createdBy: admin?._id,
    },
  ];

  const created = await QuestionBank.insertMany(samples);
  await Test.create({
    title: 'Python Fundamentals Quiz',
    subject: 'Python Basics',
    description: 'Introductory Python assessment for new students.',
    difficulty: 'EASY',
    questions: created.map(q => q._id),
    passingScore: 60,
    timeLimit: 20,
    schedule: 'ALWAYS',
    status: 'PUBLISHED',
    createdBy: admin?._id,
  });
  console.log('✅ Seeded sample questions and test');
}

export async function clearDatabase() {
  try {
    console.log('🗑️  Clearing database...');
    await User.deleteMany({});
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('❌ Failed to clear database:', error.message);
    throw error;
  }
}
