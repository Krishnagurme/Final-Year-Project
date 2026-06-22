# LearnSphere Architecture & Design Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│                   (React + Vite + Redux)                        │
└────────────────────────┬──────────────────────────────────────┘
                         │ HTTPS
                         │
                    ┌────▼────┐
                    │ Nginx   │  (Reverse Proxy)
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐      ┌────▼────┐    ┌────▼────┐
   │ Frontend │      │ Backend  │    │ MongoDB  │
   │  (React) │      │(Express) │    │          │
   └──────────┘      └────┬────┘    └────┬─────┘
                          │              │
                    ┌─────▼─────┐    ┌────▼──┐
                    │ JWT Auth  │    │Mongoose
                    │ RBAC      │    │Schemas
                    │ API       │    └───────┘
                    └───────────┘
                          │
                     ┌────▼──────┐
                     │ OpenAI API │
                     │ (AI Module)│
                     └───────────┘
```

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN',
  profileImage: String (URL),
  bio: String,
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
  prerequisites: [ObjectId],
  enrolledCourses: [{
    courseId: ObjectId (ref),
    enrolledAt: Date,
    progress: Number (0-100),
    completedLessons: [ObjectId],
    certificateObtained: Boolean,
    certificateIssuedAt: Date
  }],
  isEmailVerified: Boolean,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Courses Collection

```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  shortDescription: String (max 200),
  instructor: ObjectId (ref: User),
  category: String,
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
  price: Number,
  currency: String (default: 'USD'),
  duration: Number (minutes),
  lessons: [ObjectId],
  prerequisites: [ObjectId],
  tags: [String],
  learningOutcomes: [String],
  requirements: [String],
  isPublished: Boolean,
  isFeatured: Boolean,
  students: [ObjectId],
  ratings: [{
    studentId: ObjectId,
    rating: Number (1-5),
    review: String,
    createdAt: Date
  }],
  averageRating: Number,
  totalEnrollments: Number,
  totalRevenue: Number,
  language: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Assessments Collection

```javascript
{
  _id: ObjectId,
  studentId: ObjectId (ref: User),
  courseId: ObjectId (ref: Course),
  type: 'PREREQUISITE' | 'QUIZ' | 'FINAL_EXAM',
  questions: [{
    question: String,
    type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER',
    options: [String],
    correctAnswer: String,
    points: Number
  }],
  answers: [{
    questionId: String,
    studentAnswer: String,
    isCorrect: Boolean,
    pointsEarned: Number
  }],
  score: Number,
  totalPoints: Number,
  percentage: Number,
  aiEvaluation: {
    skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    feedback: String,
    confidenceScore: Number (0-1)
  },
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED',
  timeTaken: Number (minutes),
  attemptNumber: Number,
  maxAttempts: Number,
  startedAt: Date,
  submittedAt: Date,
  evaluatedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Flow Diagrams

### Authentication Flow

```
User Registration:
1. POST /api/auth/register
   - Validate input (Joi schema)
   - Hash password (bcryptjs)
   - Create user in MongoDB
   - Return user data (no password)

User Login:
1. POST /api/auth/login
   - Validate email/password format
   - Find user by email
   - Compare password hash
   - Generate JWT token
   - Return token + user data
   - Client stores token in localStorage

Protected Request:
1. Client sends: Authorization: Bearer <token>
2. Middleware validates token
3. If valid: attach user to request
4. If invalid: return 401 Unauthorized
```

### Assessment Flow

```
Student Assessment Submission:
1. POST /api/assessments/submit-assessment
2. Validate answers
3. Call AI Service:
   - Send answers to OpenAI GPT-4
   - Receive evaluation (skill level, feedback)
4. Store assessment in MongoDB
5. Update student's skillLevel if improved
6. Return results to frontend
```

### Course Enrollment Flow

```
Course Discovery:
1. GET /api/courses (public)
2. Filter by level/category/search
3. Display courses with thumbnails

Student Enrollment:
1. POST /api/courses/:id/enroll
2. Check authentication (STUDENT role)
3. Add student to course.students array
4. Add course to user.enrolledCourses
5. Update course.totalEnrollments
6. Return success response
```

## Security Architecture

### JWT Authentication

- Token contains: userId, email, role
- Expiration: 7 days (configurable)
- Stored in localStorage (client-side)
- Sent in Authorization header (Bearer scheme)

### Password Security

- Hash algorithm: bcryptjs (10 salt rounds)
- Password never stored in plain text
- Never returned in API responses
- Field excluded from queries by default (.select('+password'))

### Role-Based Access Control (RBAC)

```javascript
Routes protected by middleware:
- authenticate: Verify JWT token
- isStudent: Only STUDENT role
- isInstructor: Only INSTRUCTOR role
- isAdmin: Only ADMIN role

Example:
POST /api/courses
  - authenticate middleware: Check token
  - isInstructor middleware: Check role
  - If both pass: Create course
```

### Data Validation

- Joi schema validation on request body
- MongoDB schema validation
- Frontend client-side validation
- Error messages don't reveal system details

## AI Integration

### OpenAI Configuration

```
Model: gpt-4-turbo-preview
API Endpoint: https://api.openai.com/v1/chat/completions
Authentication: Bearer token in header
Rate limiting: Standard OpenAI quotas
```

### AI Prompt Engineering

#### Prerequisite Evaluation

```
System: "You are an educational assessment expert..."
User: "Analyze answers and determine skill level..."
Response Format: JSON with skill level, strengths, weaknesses
Temperature: 0.7 (balanced creativity)
Max tokens: 1000
```

#### Learning Path Generation

```
System: "You are an expert in personalized learning..."
User: "Create path for student with profile..."
Response Format: JSON with milestones, resources, pacing
Temperature: 0.8 (more creative)
Max tokens: 1500
```

#### Assessment Scoring

```
System: "You are an expert assessor..."
User: "Score and evaluate assessment..."
Response Format: JSON with score, feedback, next steps
Temperature: 0.5 (consistent)
Max tokens: 1200
```

## Frontend State Management

### Redux Store Structure

```javascript
{
  auth: {
    user: { userId, email, role, firstName, skillLevel },
    token: String,
    isAuthenticated: Boolean,
    loading: Boolean,
    error: String
  },
  courses: {
    courses: Array,
    selectedCourse: Object,
    loading: Boolean,
    error: String,
    filters: { level, category, search }
  }
}
```

### Component Hierarchy

```
App
├── Navbar (Global)
├── StudentLayout
│   ├── StudentSidebar
│   └── Main Content
│       ├── StudentDashboard
│       ├── StudentCoursesPage
│       ├── AIAssessmentPage
│       └── ...
├── InstructorLayout
│   ├── InstructorSidebar
│   └── Main Content
│       ├── InstructorDashboard
│       ├── CreateCoursePage
│       ├── ManageCoursesPage
│       └── ...
└── Auth Pages
    ├── LoginPage
    └── RegisterPage
```

## Performance Optimization

### Frontend

- Code splitting with React.lazy()
- Component memoization (React.memo)
- Redux selector optimization
- Image optimization
- CSS minification (production)
- Gzip compression

### Backend

- Database indexing on frequently queried fields
- Query optimization with population
- Request rate limiting
- CORS configuration
- Helmet security headers
- Morgan request logging

### Deployment

- Docker containerization
- MongoDB replication set (production)
- Nginx reverse proxy caching
- CDN for static assets
- Environment-based configuration

## Testing Strategy

### Unit Tests

- Individual service functions
- Helper utility functions
- Validation schemas

### Integration Tests

- API endpoint testing (Postman)
- Database operations
- Authentication flow

### E2E Tests

- User workflows
- Course enrollment
- Assessment submission
- Role-based access

## Monitoring & Logging

### Server-side

- Morgan HTTP request logging
- Error stack traces in development
- Structured logging in production
- MongoDB query logging

### Client-side

- Console warnings/errors
- React DevTools integration
- Redux DevTools integration
- Error boundaries

## Scaling Considerations

### Horizontal Scaling

- Stateless Express servers
- Load balancer (Nginx)
- MongoDB replica set
- Redis caching layer (future)

### Vertical Scaling

- Database indexing
- Query optimization
- API response caching
- Async processing for heavy tasks

---

**Last Updated**: February 2026
