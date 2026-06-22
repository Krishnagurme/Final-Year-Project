# 🧠 AI Prerequisite System - API Reference

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://learnsphere.com/api`

## Authentication

All endpoints require JWT Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Generate Dynamic Test

**POST** `/assessments/generate-test/:subject`

Generate a dynamic AI-created assessment test for a specific subject.

**Parameters**:

- `:subject` (path) - Subject name (required)
  - Options: `JavaScript`, `Python`, `React`, `Java`, `SQL`, `Web Design`

**Request Body**:

```json
{
  "numberOfQuestions": 5
}
```

**Response** (201):

```json
{
  "message": "Dynamic test generated for JavaScript",
  "data": {
    "questions": [
      {
        "id": 1,
        "question": "What is a closure in JavaScript?",
        "options": [
          "A function with access to outer scope variables",
          "A way to close browser tabs",
          "A CSS property",
          "A database query"
        ],
        "correctAnswer": "A function with access to outer scope variables",
        "difficulty": "medium",
        "topic": "Functions & Scope",
        "explanation": "A closure is a function that has access to variables from its outer (enclosing) scope..."
      },
      {
        "id": 2,
        "question": "Which is NOT an ES6 feature?",
        "options": [
          "Arrow functions",
          "Classes",
          "Var keyword introduced in ES6",
          "Template literals"
        ],
        "correctAnswer": "Var keyword introduced in ES6",
        "difficulty": "easy",
        "topic": "ES6+ Features",
        "explanation": "The var keyword was introduced in ES5, not ES6..."
      }
    ],
    "estimatedCompletionTime": 15,
    "subject": "JavaScript"
  }
}
```

**Error Responses**:

```json
// 400 - Invalid subject
{
  "message": "Subject is required"
}

// 401 - Unauthorized
{
  "message": "Unauthorized access"
}

// 400 - AI Service Error
{
  "message": "Failed to generate dynamic prerequisite test"
}
```

---

### 2. Evaluate Prerequisites

**POST** `/assessments/evaluate-prerequisites`

Evaluate student answers and generate AI assessment with skill level assignment.

**Request Body**:

```json
{
  "answers": [
    {
      "questionId": "1",
      "question": "What is a closure in JavaScript?",
      "topic": "Functions & Scope",
      "studentAnswer": "A function with access to outer scope variables",
      "correctAnswer": "A function with access to outer scope variables",
      "isCorrect": true
    },
    {
      "questionId": "2",
      "question": "Which is NOT an ES6 feature?",
      "topic": "ES6+ Features",
      "studentAnswer": "Template literals",
      "correctAnswer": "Var keyword introduced in ES6",
      "isCorrect": false
    },
    {
      "questionId": "3",
      "question": "What does async/await do?",
      "topic": "Async/Await",
      "studentAnswer": "Makes asynchronous code look and behave more like synchronous code",
      "correctAnswer": "Makes asynchronous code look and behave more like synchronous code",
      "isCorrect": true
    }
  ],
  "subject": "JavaScript",
  "courseLevel": "INTERMEDIATE"
}
```

**Response** (200):

```json
{
  "message": "Prerequisite evaluation completed",
  "data": {
    "recommendedLevel": "INTERMEDIATE",
    "score": 66.67,
    "accuracy": "66.67%",
    "conceptClarity": "Good understanding of closures and async patterns, but needs work on ES6 knowledge",
    "logicalThinking": "Demonstrates logical thinking in most answers, good problem-solving approach",
    "strengths": ["Closure understanding", "Async/Await knowledge", "Modern JavaScript concepts"],
    "weaknesses": [
      "ES6 features recognition",
      "Language feature history",
      "Distinctions between old and new syntax"
    ],
    "recommendations": [
      "Complete 'ES6+ Features Deep Dive' module",
      "Practice distinguishing ES5 vs ES6+ syntax",
      "Study the evolution of JavaScript features"
    ],
    "nextSteps": [
      "Review ES6 feature list and syntax",
      "Practice coding with both old and new syntax",
      "Take intermediate JavaScript projects"
    ],
    "learningPath": {
      "estimatedHours": 20,
      "focusAreas": ["ES6 Features", "Modern Syntax", "Feature Distinctions"],
      "suggestedPace": "3 hours per week"
    },
    "feedback": "You have a solid grasp of closures and async programming! Your main area for improvement is becoming familiar with all ES6+ features and their syntax. Focus on completing the ES6 module to strengthen your JavaScript foundation before moving to advanced concepts.",
    "confidenceScore": 0.82,
    "assessmentSummary": "INTERMEDIATE level confirmed. Strong async/promise handling. Needs ES6 feature reinforcement.",
    "studentName": "John Doe",
    "subject": "JavaScript",
    "skillLevelRange": {
      "min": 41,
      "max": 70
    },
    "timestamp": "2026-02-10T15:30:45.123Z"
  }
}
```

**Status Codes**:

- `200` - Successfully evaluated
- `400` - Invalid request (missing answers or subject)
- `401` - Unauthorized
- `500` - Server error

---

### 3. Generate Learning Path

**POST** `/assessments/generate-learning-path`

Create a personalized learning path based on assessment results and student profile.

**Request Body**:

```json
{
  "courseId": "507f1f77bcf86cd799439011",
  "assessmentResults": {
    "recommendedLevel": "INTERMEDIATE",
    "score": 66.67,
    "strengths": ["Closure understanding", "Async/Await knowledge"],
    "weaknesses": ["ES6 features recognition"],
    "recommendations": ["Complete 'ES6+ Features Deep Dive' module"]
  }
}
```

**Response** (200):

```json
{
  "message": "Learning path generated successfully",
  "data": {
    "estimatedDuration": 20,
    "weeklySchedule": {
      "hoursPerWeek": 5,
      "sessionsPerWeek": 3,
      "sessionsPerDay": 1
    },
    "phases": [
      {
        "phase": 1,
        "name": "ES6 Foundation",
        "duration": "1 week",
        "topics": ["Arrow Functions", "Template Literals", "Destructuring", "Spread Operator"],
        "activities": ["Watch ES6 features video", "Read feature guide", "Code along exercises"],
        "estimatedHours": 5
      },
      {
        "phase": 2,
        "name": "Advanced ES6",
        "duration": "1.5 weeks",
        "topics": ["Classes", "Modules", "Promises (review)", "Async/Await (advanced)"],
        "activities": ["Study advanced patterns", "Build mini-projects", "Refactor existing code"],
        "estimatedHours": 7.5
      },
      {
        "phase": 3,
        "name": "Practical Application",
        "duration": "1.5 weeks",
        "topics": ["Real-world async patterns", "Performance optimization", "Best practices"],
        "activities": ["Build full project", "Code review practice", "Performance tuning"],
        "estimatedHours": 7.5
      }
    ],
    "milestones": [
      "Complete ES6 features module",
      "Build first async-heavy project",
      "Pass advanced assessment",
      "Deploy project to production"
    ],
    "resources": {
      "videos": [
        "ES6 Complete Guide (8 hours)",
        "JavaScript Async Patterns (3 hours)",
        "Modern JavaScript Practices (2 hours)"
      ],
      "articles": [
        "ES6 Features Explained",
        "Async/Await Best Practices",
        "JavaScript Performance Tips"
      ],
      "projects": [
        "Todo App with Async Rendering",
        "API Data Fetcher Application",
        "Real-time Data Dashboard"
      ]
    },
    "assessmentStrategy": "Weekly quizzes on topics covered, mid-point practical assignment, final comprehensive project assessment",
    "checkpoints": [
      "Week 1: ES6 feature quiz (pass ≥80%)",
      "Week 2.5: Async patterns mini-project",
      "Week 4: Final comprehensive project"
    ],
    "adaptiveFeatures": {
      "canAdjustPace": true,
      "canSwapResources": true,
      "hasCheckpoints": true,
      "progressTracking": true
    },
    "successCriteria": [
      "Understand all major ES6 features",
      "Write idiomatic modern JavaScript",
      "Handle complex async scenarios",
      "Pass final assessment (≥75%)"
    ],
    "generatedFor": {
      "skillLevel": "INTERMEDIATE",
      "courseId": "507f1f77bcf86cd799439011"
    },
    "timestamp": "2026-02-10T15:31:20.456Z"
  }
}
```

---

### 4. Submit Assessment

**POST** `/assessments/submit-assessment`

Submit completed assessment for comprehensive AI evaluation with detailed scoring.

**Request Body**:

```json
{
  "answers": [
    {
      "questionId": "1",
      "question": "What is a closure?",
      "topic": "Functions & Scope",
      "studentAnswer": "A function with access to outer scope variables",
      "correctAnswer": "A function with access to outer scope variables",
      "isCorrect": true
    },
    {
      "questionId": "2",
      "question": "Which is NOT an ES6 feature?",
      "topic": "ES6+ Features",
      "studentAnswer": "Template literals",
      "correctAnswer": "Var keyword introduced in ES6",
      "isCorrect": false
    },
    {
      "questionId": "3",
      "question": "What does async/await do?",
      "topic": "Async/Await",
      "studentAnswer": "Makes asynchronous code look and behave more like synchronous code",
      "correctAnswer": "Makes asynchronous code look and behave more like synchronous code",
      "isCorrect": true
    }
  ],
  "courseId": "507f1f77bcf86cd799439011",
  "subject": "JavaScript",
  "estimatedTime": 15
}
```

**Response** (200):

```json
{
  "message": "Assessment submitted and evaluated",
  "data": {
    "assessmentId": "507f1f77bcf86cd799439012",
    "score": 66.67,
    "accuracy": 66.67,
    "conceptClarity": {
      "rating": "Good",
      "details": "You demonstrate solid understanding of closures and asynchronous programming patterns..."
    },
    "logicalThinking": {
      "rating": "Good",
      "details": "Your answers show logical progression and problem-solving capability..."
    },
    "skillLevel": "INTERMEDIATE",
    "strengths": [
      "Strong closure understanding",
      "Solid async/await knowledge",
      "Good problem-solving ability"
    ],
    "weaknesses": ["ES6 feature distinctions", "Feature history knowledge"],
    "recommendations": [
      "Master ES6+ features module",
      "Practice modern syntax variations",
      "Study feature evolution timeline"
    ],
    "nextSteps": [
      "Start ES6 Deep Dive course section",
      "Code along with ES6 examples",
      "Build projects using modern syntax"
    ],
    "feedback": "Excellent grasp of core JavaScript concepts! Your closure and async understanding is solid. Focus on becoming an expert in ES6+ features to complete your JavaScript mastery.",
    "areasOfExcellence": ["Async/Await patterns", "Functional programming concepts"],
    "criticalAreas": ["ES6 feature recognition"],
    "estimatedReviewTime": 2,
    "skillLevelRange": {
      "min": 41,
      "max": 70
    },
    "subject": "JavaScript",
    "timestamp": "2026-02-10T15:32:00.789Z"
  }
}
```

---

### 5. Get Assessment Results

**GET** `/assessments/results/:assessmentId`

Retrieve detailed results for a specific assessment.

**Parameters**:

- `:assessmentId` (path) - Assessment ID (required)

**Response** (200):

```json
{
  "message": "Assessment results retrieved",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "studentId": {
      "_id": "507f1f77bcf86cd799439001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "courseId": "507f1f77bcf86cd799439011",
    "type": "PREREQUISITE",
    "score": 66.67,
    "percentage": 66.67,
    "aiEvaluation": {
      "skillLevel": "INTERMEDIATE",
      "strengths": ["Closure understanding", "Async/Await knowledge"],
      "weaknesses": ["ES6 features recognition"],
      "recommendations": ["Complete ES6+ module"],
      "feedback": "Strong foundation in core concepts...",
      "confidenceScore": 0.82
    },
    "status": "EVALUATED",
    "timeTaken": 15,
    "submittedAt": "2026-02-10T15:32:00.000Z",
    "evaluatedAt": "2026-02-10T15:32:05.000Z",
    "createdAt": "2026-02-10T15:17:00.000Z"
  }
}
```

**Error Responses**:

```json
// 404 - Assessment not found
{
  "message": "Assessment not found"
}

// 403 - Unauthorized
{
  "message": "Unauthorized access"
}
```

---

### 6. Get My Assessments

**GET** `/assessments/my-assessments`

Retrieve user's recent assessment history.

**Response** (200):

```json
{
  "message": "User assessments retrieved",
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "type": "PREREQUISITE",
      "score": 66.67,
      "percentage": 66.67,
      "aiEvaluation": {
        "skillLevel": "INTERMEDIATE"
      },
      "status": "EVALUATED",
      "createdAt": "2026-02-10T15:17:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "type": "PREREQUISITE",
      "score": 75.0,
      "percentage": 75.0,
      "aiEvaluation": {
        "skillLevel": "INTERMEDIATE"
      },
      "status": "EVALUATED",
      "createdAt": "2026-02-09T14:22:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "type": "PREREQUISITE",
      "score": 55.0,
      "percentage": 55.0,
      "aiEvaluation": {
        "skillLevel": "BEGINNER"
      },
      "status": "EVALUATED",
      "createdAt": "2026-02-08T10:15:00.000Z"
    }
  ]
}
```

---

### 7. Get Assessment Analytics

**GET** `/assessments/history/analytics`

Retrieve analytics and trends for user's assessment history.

**Response** (200):

```json
{
  "message": "Assessment analytics retrieved",
  "data": {
    "totalAssessments": 5,
    "averageScore": 70.0,
    "highestScore": 85.0,
    "skillLevelDistribution": {
      "beginner": 1,
      "intermediate": 3,
      "advanced": 1
    },
    "recentAssessments": [
      {
        "subject": "JavaScript",
        "level": "INTERMEDIATE",
        "score": 75.0,
        "date": "2026-02-10"
      },
      {
        "subject": "Python",
        "level": "BEGINNER",
        "score": 55.0,
        "date": "2026-02-09"
      },
      {
        "subject": "React",
        "level": "ADVANCED",
        "score": 85.0,
        "date": "2026-02-08"
      },
      {
        "subject": "Java",
        "level": "INTERMEDIATE",
        "score": 68.0,
        "date": "2026-02-07"
      },
      {
        "subject": "SQL",
        "level": "INTERMEDIATE",
        "score": 72.0,
        "date": "2026-02-06"
      }
    ]
  }
}
```

---

## Data Models

### Answer Object

```json
{
  "questionId": "1",
  "question": "Question text here?",
  "topic": "Topic name",
  "studentAnswer": "Student's selected answer",
  "correctAnswer": "Correct answer",
  "isCorrect": true
}
```

### AI Evaluation Object

```json
{
  "skillLevel": "BEGINNER|INTERMEDIATE|ADVANCED",
  "strengths": ["topic1", "topic2"],
  "weaknesses": ["topic1", "topic2"],
  "recommendations": ["module1", "module2"],
  "feedback": "Detailed feedback text",
  "confidenceScore": 0.85
}
```

### Learning Path Object

```json
{
  "estimatedDuration": 20,
  "weeklySchedule": {
    "hoursPerWeek": 5,
    "sessionsPerWeek": 3
  },
  "phases": [...],
  "milestones": [...],
  "resources": {...},
  "assessmentStrategy": "...",
  "checkpoints": [...],
  "successCriteria": [...]
}
```

---

## Error Codes

| Code | Message                                      | Cause                                     |
| ---- | -------------------------------------------- | ----------------------------------------- |
| 400  | Subject is required                          | Missing subject parameter                 |
| 400  | Valid answers array is required              | Missing or invalid answers                |
| 400  | Course ID is required                        | Missing courseId in learning path request |
| 401  | Unauthorized access                          | Invalid or missing JWT token              |
| 403  | Unauthorized access                          | User doesn't own the assessment           |
| 404  | Assessment not found                         | Invalid assessment ID                     |
| 500  | Failed to generate dynamic prerequisite test | OpenAI API error                          |
| 500  | Failed to evaluate prerequisites             | OpenAI API error                          |
| 500  | Failed to generate learning path             | OpenAI API error                          |

---

## Rate Limiting

- **Test Generation**: 10 per day per user
- **Evaluation Requests**: 5 per hour per user
- **API Calls**: 100 per 15 minutes per user

Headers returned:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1675000000
```

---

## Example Integration

### Using cURL

```bash
# 1. Generate test
curl -X POST http://localhost:5000/api/assessments/generate-test/JavaScript \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"numberOfQuestions": 5}'

# 2. Evaluate answers
curl -X POST http://localhost:5000/api/assessments/evaluate-prerequisites \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d @answers.json

# 3. Get analytics
curl http://localhost:5000/api/assessments/history/analytics \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Using JavaScript/Fetch

```javascript
// Generate test
const testResponse = await fetch('/api/assessments/generate-test/JavaScript', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ numberOfQuestions: 5 })
});
const test = await testResponse.json();

// Evaluate
const evalResponse = await fetch('/api/assessments/evaluate-prerequisites', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    answers: [...],
    subject: 'JavaScript',
    courseLevel: 'INTERMEDIATE'
  })
});
const evaluation = await evalResponse.json();
```

---

## Postman Collection

Import the provided Postman collection to test all endpoints:

- File: `Postman_Collection.json`
- Variables: BASE_URL, TOKEN, SUBJECT

---

**Last Updated**: February 10, 2026
