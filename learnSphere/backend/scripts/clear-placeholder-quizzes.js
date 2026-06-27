// Maintenance: remove low-quality auto-generated TopicQuiz documents so they
// regenerate with real AI questions on next access. Targets both the old
// "Question N for X / Option A-D" placeholders and the generic filler questions
// produced by the offline fallback (meta-questions that repeat the topic name).
import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';

dotenv.config();

const run = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnsphere';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  } catch {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  }
  console.log('Connected to DB');

  const TopicQuiz = mongoose.connection.collection('topicquizzes');
  const junkFilter = {
    $or: [
      { 'questions.0.question': { $regex: /^Question \d+ for /i } },
      { 'questions.0.options': ['Option A', 'Option B', 'Option C', 'Option D'] },
      { 'questions.0.question': { $regex: /standard course expectations|for placement purposes|buzzwords|prerequisite understanding|best describes/i } },
    ],
  };

  const total = await TopicQuiz.countDocuments({});
  const matched = await TopicQuiz.countDocuments(junkFilter);
  const res = await TopicQuiz.deleteMany(junkFilter);
  console.log(`Total quizzes: ${total}, matched junk: ${matched}, deleted: ${res.deletedCount}`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('Cleanup failed:', err.message);
  process.exit(1);
});
