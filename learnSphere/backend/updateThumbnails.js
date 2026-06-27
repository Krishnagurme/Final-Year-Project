import mongoose from 'mongoose';
import Course from './src/models/Course.js';
import dotenv from 'dotenv';
dotenv.config();

const thumbnails = {
  'Discrete Mathematics': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
  'Data Structures and Algorithms': 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80',
  'Computer Organization and Architecture': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'Object Oriented Programming': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  'Computer Graphics': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
  'Database Management Systems': 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80',
  'Computer Networks': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
  'Software Engineering and Project Management': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  'Machine Learning': 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?auto=format&fit=crop&w=800&q=80',
  'Information and Cyber Security': 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=800&q=80',
};

async function updateThumbnails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    for (const [title, url] of Object.entries(thumbnails)) {
      const result = await Course.updateMany(
        { title: title },
        { $set: { thumbnail: url, coverImage: url } }
      );
      console.log(`Updated ${title}: ${result.modifiedCount} courses`);
    }
    
    console.log('Successfully updated thumbnails!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateThumbnails();
