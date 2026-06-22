# API Endpoints Reference

## Base URL

```
Development: http://localhost:5000/api
Production: https://yourdomain.com/api
```

## Authentication Endpoints

### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "STUDENT"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "role": "STUDENT",
    "firstName": "John"
  }
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "userId": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "role": "STUDENT",
      "firstName": "John",
      "skillLevel": "BEGINNER"
    }
  }
}
```

---

## User Endpoints

### Get Profile

```http
GET /users/profile
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Profile fetched successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "STUDENT",
    "skillLevel": "INTERMEDIATE",
    "enrolledCourses": [...]
  }
}
```

### Update Profile

```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "bio": "Passionate learner"
}

Response: 200 OK
```

### Get User by ID

```http
GET /users/:id

Response: 200 OK
{
  "message": "User fetched successfully",
  "data": { ... }
}
```

---

## Course Endpoints

### Get All Courses

```http
GET /courses?level=BEGINNER&category=Programming&search=python&limit=10&skip=0

Query Parameters:
- level: BEGINNER | INTERMEDIATE | ADVANCED
- category: String
- search: String (searches in title and description)
- limit: Number (default: 10)
- skip: Number (default: 0)

Response: 200 OK
{
  "message": "Courses fetched successfully",
  "data": [
    {
      "_id": "507f...",
      "title": "Python Basics",
      "description": "Learn Python fundamentals",
      "instructor": {...},
      "level": "BEGINNER",
      "category": "Programming",
      "price": 29.99,
      "totalEnrollments": 1250,
      "averageRating": 4.8
    }
  ]
}
```

### Get Course by ID

```http
GET /courses/:id

Response: 200 OK
{
  "message": "Course fetched successfully",
  "data": {
    "_id": "507f...",
    "title": "Python Basics",
    "lessons": [...]
  }
}
```

### Create Course (Instructor)

```http
POST /courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Advanced Python",
  "description": "Master advanced Python concepts",
  "shortDescription": "Advanced Python programming",
  "category": "Programming",
  "level": "ADVANCED",
  "price": 49.99,
  "learningOutcomes": [
    "Master decorators",
    "Understand async/await",
    "Write professional code"
  ],
  "requirements": [
    "Python basics knowledge",
    "1 year programming experience"
  ]
}

Response: 201 Created
```

### Update Course (Instructor)

```http
PUT /courses/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "price": 59.99
}

Response: 200 OK
```

### Delete Course (Instructor)

```http
DELETE /courses/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Course deleted successfully"
}
```

### Enroll in Course

```http
POST /courses/:id/enroll
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Enrolled successfully",
  "data": { ... }
}
```

### Get Instructor's Courses

```http
GET /courses/instructor/my-courses
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Instructor courses fetched",
  "data": [...]
}
```

---

## Assessment Endpoints

### Evaluate Prerequisites

```http
POST /assessments/evaluate-prerequisites
Authorization: Bearer <token>
Content-Type: application/json

{
  "answers": {
    "1": "Option A",
    "2": "True",
    "3": "Correct answer"
  },
  "courseLevel": "INTERMEDIATE"
}

Response: 200 OK
{
  "message": "Prerequisite evaluation completed",
  "data": {
    "recommendedLevel": "INTERMEDIATE",
    "strengths": ["Data structures", "Algorithms"],
    "weaknesses": ["Database design"],
    "recommendations": ["Study SQL", "Learn database normalization"],
    "feedback": "You have solid fundamentals...",
    "confidence": 0.92
  }
}
```

### Generate Learning Path

```http
POST /assessments/generate-learning-path
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "507f1f77bcf86cd799439011"
}

Response: 200 OK
{
  "message": "Learning path generated",
  "data": {
    "estimatedDuration": 40,
    "milestones": [
      "Complete basics module",
      "Build first project",
      "Advanced techniques"
    ],
    "resources": ["Tutorial link", "Documentation"],
    "assessmentStrategy": "Weekly quizzes",
    "pacing": "2 lessons per week"
  }
}
```

### Submit Assessment

```http
POST /assessments/submit-assessment
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "507f1f77bcf86cd799439011",
  "answers": [
    {
      "questionId": "1",
      "studentAnswer": "Option A"
    }
  ]
}

Response: 200 OK
{
  "message": "Assessment submitted and evaluated",
  "data": {
    "_id": "507f...",
    "score": 85,
    "percentage": 85,
    "aiEvaluation": {
      "skillLevel": "INTERMEDIATE",
      "strengths": [...],
      "weaknesses": [...],
      "recommendations": [...],
      "feedback": "Great job!",
      "confidenceScore": 0.88
    }
  }
}
```

### Get Assessment Results

```http
GET /assessments/results/:assessmentId
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Assessment results fetched",
  "data": { ... }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "message": "Invalid request data",
  "details": "Email already registered"
}
```

### 401 Unauthorized

```json
{
  "message": "No token provided" or "Invalid token"
}
```

### 403 Forbidden

```json
{
  "message": "Only instructors can access this resource"
}
```

### 404 Not Found

```json
{
  "message": "Course not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Internal Server Error"
}
```

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token is obtained from login endpoint and expires after 7 days.

---

## Rate Limiting

- 100 requests per 15 minutes per IP for API endpoints
- 50 requests per 15 minutes for auth endpoints
- 429 Too Many Requests if limit exceeded

---

## CORS Headers

- Allowed Origins: http://localhost:3000 (development) or your domain (production)
- Allowed Methods: GET, POST, PUT, DELETE
- Allowed Headers: Content-Type, Authorization
- Credentials: true
