# LearnSphere - Quick Reference Guide

## 🚀 Getting Started (3 minutes)

### Option 1: Without Docker

```bash
npm run install:all      # Install dependencies
npm run dev              # Start both backend and frontend
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### Option 2: With Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- MongoDB: localhost:27017

## 📦 Available Commands

| Command                | Purpose                   |
| ---------------------- | ------------------------- |
| `npm run dev`          | Start development servers |
| `npm run build`        | Build for production      |
| `npm run lint`         | Check code quality        |
| `npm run format`       | Format code with Prettier |
| `npm run docker:build` | Build Docker images       |
| `npm run docker:up`    | Start Docker services     |
| `npm run docker:down`  | Stop Docker services      |

## 🔑 Key Credentials

### Default Test Users

#### Student

- Email: `student@example.com`
- Password: `password123`
- Role: `STUDENT`

#### Instructor

- Email: `instructor@example.com`
- Password: `password123`
- Role: `INSTRUCTOR`

_Create your own users via registration page_

## 📱 User Interfaces

### Student Dashboard

- **URL**: `/student/dashboard`
- **Features**: Progress tracking, recommended courses, skill badges
- **Color**: Blue theme (#3b82f6)
- **Sidebar**: Dashboard, My Courses, AI Assessment, Skill Level, Progress, Certificates

### Instructor Dashboard

- **URL**: `/instructor/dashboard`
- **Features**: Analytics, revenue tracking, student insights
- **Color**: Purple theme (#8b5cf6)
- **Sidebar**: Dashboard, Create Course, Manage Courses, Student Analytics, AI Reports, Earnings

## 🔌 API Quick Reference

### Authentication

```
POST   /api/auth/register       # Register new user
POST   /api/auth/login          # User login
POST   /api/auth/logout         # User logout
```

### Courses

```
GET    /api/courses             # List all courses
GET    /api/courses/:id         # Get course details
POST   /api/courses             # Create course (instructor)
PUT    /api/courses/:id         # Update course (instructor)
DELETE /api/courses/:id         # Delete course (instructor)
POST   /api/courses/:id/enroll  # Enroll student
```

### Assessment & AI

```
POST   /api/assessments/evaluate-prerequisites    # AI evaluation
POST   /api/assessments/generate-learning-path    # AI learning path
POST   /api/assessments/submit-assessment         # Submit assessment
GET    /api/assessments/results/:id               # Get results
```

### Users

```
GET    /api/users/profile       # Get user profile
PUT    /api/users/profile       # Update profile
GET    /api/users/:id           # Get user by ID
```

## 🧪 Testing APIs

### Using Postman

1. Import `Postman_Collection.json` into Postman
2. Set variables:
   - `BASE_URL`: http://localhost:5000
   - `TOKEN`: Paste JWT token from login response
   - `COURSE_ID`: Course ID for testing
3. Test endpoints in order

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"password123","role":"STUDENT"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get courses (with token)
curl http://localhost:5000/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Database Collections

| Collection   | Purpose             | Key Fields                               |
| ------------ | ------------------- | ---------------------------------------- |
| users        | User profiles       | email, role, skillLevel, enrolledCourses |
| courses      | Course information  | title, instructor, level, category       |
| lessons      | Course lessons      | courseId, order, content                 |
| assessments  | Student assessments | studentId, courseId, score, aiEvaluation |
| quizzes      | Quiz questions      | lessonId, questions, totalPoints         |
| certificates | Issued certificates | studentId, courseId, certificateNumber   |

## 🎨 Component Usage

### Student Components

```jsx
import { StudentLayout } from './components/Layout.jsx';
import { ProgressChart, SkillDistributionChart } from './components/Charts.jsx';
import SkillBadge from './components/SkillBadge.jsx';
import CourseCard from './components/CourseCard.jsx';
```

### Instructor Components

```jsx
import { InstructorLayout } from './components/Layout.jsx';
import { AnalyticsChart } from './components/Charts.jsx';
```

## 🔒 Security Notes

- All passwords are hashed with bcryptjs
- JWT tokens expire after 7 days
- All API routes validate user authentication
- Role-based access control (RBAC) on protected routes
- Environment variables store sensitive data (.env file)
- CORS configured for frontend origin only

## 📝 Environment Setup

### Create .env file

```bash
cp .env.example .env
```

### Configure Required Variables

```env
# Required for production
MONGODB_URI=mongodb://localhost:27017/learnsphere
JWT_SECRET=your_strong_random_secret_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Optional
BACKEND_PORT=5000
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🐛 Common Issues & Solutions

| Issue                         | Solution                                     |
| ----------------------------- | -------------------------------------------- |
| MongoDB connection failed     | Ensure MongoDB is running (`mongod`)         |
| Port 3000/5000 already in use | Kill process or change port in .env          |
| API token expired             | Re-login to get new token                    |
| CORS error                    | Check FRONTEND_URL in backend .env           |
| OpenAI API error              | Verify API key and rate limits               |
| Node modules issues           | Delete node_modules, run `npm install` again |

## 📚 Documentation Files

- **README.md** - Project overview and features
- **ARCHITECTURE.md** - System design and database schema
- **API_REFERENCE.md** - Complete API documentation
- **DEPLOYMENT.md** - Production deployment guide
- **Postman_Collection.json** - API testing collection

## 🔄 Development Workflow

```bash
# 1. Start development server
npm run dev

# 2. Make changes (hot reload enabled)
# Frontend: src/pages/StudentDashboard.jsx
# Backend: src/routes/course.routes.js

# 3. Test with Postman or frontend UI

# 4. Format code
npm run format

# 5. Lint check
npm run lint

# 6. Build for production
npm run build

# 7. Deploy with Docker
docker-compose up --build -d
```

## 🎯 Next Steps

1. **Explore the UI**
   - Register as student and instructor
   - Browse courses
   - Take AI assessment

2. **Test the API**
   - Use Postman collection
   - Create a course
   - Enroll and submit assessment

3. **Customize**
   - Modify UI colors/styles
   - Add more courses/lessons
   - Implement additional features

4. **Deploy**
   - Follow DEPLOYMENT.md
   - Configure production .env
   - Deploy with Docker Compose

## 💡 Tips & Tricks

- **Hot Reload**: Changes to React/Express code auto-reload in dev mode
- **Redux DevTools**: Install browser extension for state debugging
- **Tailwind Classes**: Most styles use Tailwind, add custom CSS in src/index.css
- **API Testing**: Always test new endpoints in Postman first
- **Logging**: Use `console.log` in dev, structured logs in production
- **Git Commits**: Use `.gitignore` - node_modules and .env are ignored

## 📞 Support Resources

- Check docs/ folder for detailed documentation
- Review Postman collection for API examples
- Check browser console for frontend errors
- Check server logs for backend errors: `docker-compose logs -f backend`

---

**Happy learning and teaching! 🚀**
