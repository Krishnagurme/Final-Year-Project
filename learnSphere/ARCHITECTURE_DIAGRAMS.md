# 🏗️ LearnSphere System Architecture & Diagrams

---

## Security Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                     │
│  (React Frontend - Dashboard, Assessment, Login)    │
└────────────────┬──────────────────────────────────┘
                 │ HTTP(S) with Bearer Token
                 ↓
┌─────────────────────────────────────────────────────┐
│                 MIDDLEWARE LAYER                    │
├─────────────────────────────────────────────────────┤
│ 1. Rate Limiting                                    │
│    ├─ Strict: 5/15min (auth)                       │
│    ├─ Moderate: 100/15min (API)                    │
│    ├─ Relaxed: 1000/15min (GET)                    │
│    ├─ Tests: 10/24h per user                       │
│    └─ Evaluations: 5/1h per user                   │
├─────────────────────────────────────────────────────┤
│ 2. Authentication                                   │
│    ├─ Extract Bearer Token from header             │
│    ├─ Verify JWT signature                         │
│    ├─ Check token expiration                       │
│    └─ Attach user to request                       │
├─────────────────────────────────────────────────────┤
│ 3. Authorization                                    │
│    ├─ Check user role                              │
│    ├─ Verify endpoint access                       │
│    ├─ Validate ownership (if needed)               │
│    └─ Return 403 if unauthorized                   │
├─────────────────────────────────────────────────────┤
│ 4. Input Validation & Sanitization                 │
│    ├─ Validate against Joi schemas                 │
│    ├─ Sanitize strings (XSS protection)            │
│    ├─ Check data types                             │
│    └─ Verify length constraints                    │
└────────────────┬──────────────────────────────────┘
                 │ req.validated (clean data)
                 ↓
┌─────────────────────────────────────────────────────┐
│                 SERVICES LAYER                      │
├─────────────────────────────────────────────────────┤
│ Authentication Service                              │
│ ├─ hashPassword() - bcrypt 10 rounds               │
│ ├─ comparePassword() - verify login                │
│ ├─ generateAccessToken() - 15m JWT                 │
│ ├─ generateRefreshToken() - 7d JWT                 │
│ ├─ verifyToken() - validate signature              │
│ └─ refreshAccessToken() - extend session           │
├─────────────────────────────────────────────────────┤
│ AI Assessment Service                               │
│ ├─ generateDynamicTest() - create tests            │
│ ├─ evaluatePrerequisites() - AI eval              │
│ ├─ generateLearningPath() - personalize            │
│ └─ scoreAssessment() - comprehensive scoring       │
├─────────────────────────────────────────────────────┤
│ Analytics Service                                   │
│ ├─ getCourseCompletionAnalytics()                 │
│ ├─ getSkillProgressionAnalytics()                 │
│ ├─ getAssessmentHistoryAnalytics()                │
│ ├─ getConfidenceScoreAnalytics()                  │
│ ├─ getDashboardAnalytics()                        │
│ └─ getAdminAnalytics()                            │
└────────────────┬──────────────────────────────────┘
                 │ DB queries, AI API calls
                 ↓
┌─────────────────────────────────────────────────────┐
│                DATABASE & EXTERNAL LAYER            │
├─────────────────────────────────────────────────────┤
│ MongoDB Collections:                                │
│ ├─ Users (with role, hashed password)             │
│ ├─ Assessments (scores, results)                  │
│ ├─ Courses (course data)                          │
│ ├─ Lessons (course content)                       │
│ └─ Progress (enrollment tracking)                 │
├─────────────────────────────────────────────────────┤
│ External APIs:                                     │
│ └─ OpenAI (GPT-4-turbo for AI evaluation)         │
└─────────────────────────────────────────────────────┘
```

---

## Authentication Flow (JWT + Refresh Tokens)

```
User Registration
  │
  ├─ Validate email & password strength
  ├─ Hash password with bcryptjs (10 rounds)
  ├─ Create user in database
  ├─ Generate access token (15 min)
  ├─ Generate refresh token (7 days, httpOnly)
  └─ Return tokens to client
        ↓
User Login
  │
  ├─ Validate email & password format
  ├─ Find user by email
  ├─ Compare passwords with bcrypt
  ├─ Update lastLogin timestamp
  ├─ Generate tokens
  ├─ Store refresh token in httpOnly cookie
  └─ Return access token + user data
        ↓
Access API with Token
  │
  ├─ Client sends: Authorization: Bearer {accessToken}
  ├─ Server extracts token from header
  ├─ Verify JWT signature with JWT_SECRET
  ├─ Check token expiration
  ├─ Attach userId & role to request object
  └─ Continue to business logic
        ↓
Token Expires (15 minutes)
  │
  ├─ Client gets 401 Unauthorized
  ├─ Client sends refresh token to /auth/refresh-token
  ├─ Server verifies refresh token
  ├─ Generate new access token
  ├─ Generate new refresh token
  ├─ Update httpOnly cookie
  └─ Return new access token
        ↓
User Logout
  │
  ├─ Client sends logout request
  ├─ Server clears refresh token cookie
  ├─ Client clears localStorage
  └─ User redirected to login
```

---

## Role-Based Access Control (RBAC)

```
Role Hierarchy
├─ Admin (Level 3)
│  ├─ Full platform access
│  ├─ View all users
│  ├─ View admin analytics
│  ├─ Manage courses
│  ├─ Manage assessments
│  └─ Manage users
│
├─ Instructor (Level 2)
│  ├─ Create courses
│  ├─ Edit own courses
│  ├─ View enrolled students
│  ├─ View student assessments
│  ├─ Access course analytics
│  └─ Manage course content
│
└─ Student (Level 1)
   ├─ Enroll in courses
   ├─ Take assessments
   ├─ View own results
   ├─ Access learning materials
   ├─ View personal analytics
   └─ View dashboard

Route Protection
├─ Student Routes: isStudent middleware
│  ├─ POST /assessments/generate-test
│  ├─ POST /assessments/evaluate-prerequisites
│  ├─ GET /analytics/dashboard
│  └─ etc.
│
├─ Instructor Routes: isInstructor middleware
│  ├─ POST /courses
│  ├─ PUT /courses/:id
│  ├─ GET /courses/instructor/my-courses
│  └─ etc.
│
└─ Admin Routes: isAdmin middleware
   ├─ DELETE /users/:id
   ├─ GET /analytics/admin
   ├─ PUT /users/:id/role
   └─ etc.
```

---

## AI Assessment Pipeline

```
Student Selects Subject
  │
  ├─ (Rate Limited: 10 tests/day)
  ↓
Generate Dynamic Test
  │
  ├─ Fetch subject knowledge areas
  ├─ Generate prompt with context
  ├─ Call OpenAI GPT-4-turbo
  ├─ Parse JSON response
  ├─ Validate questions structure
  └─ Return 5 questions with difficulty/topic
       ↓
Student Takes Test
  │
  ├─ Display questions one by one
  ├─ Track answers in state
  ├─ Show progress bar
  ├─ Validate all questions answered
  └─ Submit for evaluation
       ↓
AI Evaluates Answers
  │
  ├─ (Rate Limited: 5 evaluations/hour)
  ├─ Calculate accuracy (correct/total)
  ├─ Analyze concept clarity
  ├─ Assess logical thinking
  ├─ Generate feedback
  ├─ Assign skill level (Beginner/Intermediate/Advanced)
  ├─ Calculate confidence score
  └─ Generate learning path
       ↓
Display Results
  │
  ├─ Show skill level
  ├─ Show accuracy percentage
  ├─ Show confidence score
  ├─ Display strengths
  ├─ Display weaknesses
  ├─ Show AI recommendations
  └─ Provide learning path
       ↓
Save Assessment
  │
  ├─ Create Assessment record in DB
  ├─ Update user skill level
  ├─ Record timestamp
  └─ Link to student
```

---

## Analytics Data Pipeline

```
Assessment Completed
  │
  └─→ Stored in Assessment collection with:
      ├─ studentId
      ├─ subject
      ├─ score
      ├─ skillLevel
      ├─ confidenceScore
      ├─ answers
      └─ createdAt
            ↓
Analytics Requested
  │
  ├─ getUserAssessments(userId)
  ├─ Aggregate by subject
  ├─ Calculate statistics
  ├─ Determine trends
  └─ Generate recommendations
       ↓
Display in Dashboard
  │
  ├─ Overview Tab
  │  ├─ Course metrics
  │  ├─ Current skill level
  │  └─ Completion rate
  │
  ├─ Skills Tab
  │  ├─ Subject progression
  │  ├─ Score improvement
  │  └─ Subject comparison
  │
  ├─ Assessments Tab
  │  ├─ Score history table
  │  ├─ Performance trends
  │  └─ Statistics
  │
  └─ Confidence Tab
     ├─ Distribution chart
     ├─ Subject analysis
     └─ AI recommendations
```

---

## Rate Limiting Flow

```
Request Arrives
  │
  ├─ Extract IP address
  ├─ Extract endpoint path
  ├─ Create key: IP:endpoint
  ├─ Look up request count in memory
  │
  ├─ IF first request:
  │  └─ Initialize counter = 1
  │
  ├─ ELSE IF within time window:
  │  └─ Increment counter
  │
  ├─ ELSE (time window expired):
  │  └─ Reset counter = 1
  │
  └─ Check against limit:
     │
     ├─ IF counter < limit:
     │  ├─ Set X-RateLimit headers
     │  ├─ X-RateLimit-Limit: {limit}
     │  ├─ X-RateLimit-Remaining: {remaining}
     │  ├─ X-RateLimit-Reset: {reset time}
     │  └─ Continue to next middleware
     │
     └─ ELSE (limit exceeded):
        ├─ Return 429 Too Many Requests
        ├─ Include retryAfter (seconds)
        ├─ Include resetTime (ISO string)
        └─ Block request
```

---

## Input Validation & Sanitization

```
Request Body Received
  │
  ├─ Sanitize Middleware
  │  ├─ Replace < with &lt;
  │  ├─ Replace > with &gt;
  │  ├─ Replace " with &quot;
  │  ├─ Replace ' with &#x27;
  │  └─ Trim whitespace
  │      ↓
  ├─ Validation Middleware
  │  ├─ Load Joi schema for endpoint
  │  ├─ Validate body against schema
  │  │
  │  ├─ For each field:
  │  │  ├─ Check required
  │  │  ├─ Check type
  │  │  ├─ Check length/range
  │  │  ├─ Check format (email, etc)
  │  │  └─ Run custom validators
  │  │
  │  ├─ IF errors exist:
  │  │  ├─ Build errors object
  │  │  └─ Return 400 with errors
  │  │
  │  └─ ELSE:
  │     ├─ Attach validated data to req
  │     └─ Continue to business logic
  │
  └─ Business Logic Receives
     ├─ Clean, safe data
     ├─ Already type-checked
     ├─ Already length-validated
     └─ XSS-protected
```

---

## Dashboard Data Aggregation

```
Frontend: GET /analytics/dashboard
  │
  └─→ Backend Service Parallel Calls:
      │
      ├─ getCourseCompletionAnalytics()
      │  ├─ Find user's enrollments
      │  ├─ Count completed/in-progress
      │  ├─ Calculate completion rate
      │  └─ Return: { totalEnrolled, completed, rate }
      │
      ├─ getSkillProgressionAnalytics()
      │  ├─ Find assessments by user
      │  ├─ Group by subject
      │  ├─ Calculate improvement
      │  └─ Return: { bySubject, average, highest }
      │
      ├─ getAssessmentHistoryAnalytics()
      │  ├─ Get last 50 assessments
      │  ├─ Calculate statistics
      │  ├─ Determine trend
      │  └─ Return: { history, stats, trend }
      │
      └─ getConfidenceScoreAnalytics()
         ├─ Get confidence scores
         ├─ Calculate distribution
         ├─ Generate recommendations
         └─ Return: { distribution, bySubject, recs }
           │
           ├─ Wait for all 4 requests
           └─ Combine results
                ↓
       Return: {
         user: {...},
         courseCompletion: {...},
         skillProgression: {...},
         assessmentHistory: {...},
         confidenceScores: {...},
         generatedAt: timestamp
       }
           │
           └─→ Frontend displays in Dashboard
```

---

## Password Hashing Process

```
User Registration / Password Change
  │
  ├─ Receive plain password: "MyPassword123!"
  │
  ├─ Validate strength:
  │  ├─ Length >= 8
  │  ├─ Has uppercase
  │  ├─ Has lowercase
  │  ├─ Has number
  │  ├─ Has special char
  │  └─ If invalid: Return 400 error
  │
  ├─ Bcrypt hashing:
  │  ├─ Generate salt (10 rounds)
  │  ├─ Apply salt to password
  │  ├─ Hash iteratively 2^10 times
  │  └─ Result: $2a$10$pIxZfYGjBSxKeFhDpYLhC...
  │
  ├─ Store in database:
  │  └─ user.password = hashed_password
  │
  └─ Return success
       ↓
User Login
  │
  ├─ Receive plain password: "MyPassword123!"
  ├─ Find user by email
  ├─ Get stored hash from database
  │
  ├─ Bcrypt comparison:
  │  ├─ Extract salt from stored hash
  │  ├─ Apply same salt to input password
  │  ├─ Compare hashes
  │  └─ Result: true or false
  │
  ├─ IF match:
  │  └─ Generate tokens, login success
  │
  └─ ELSE:
     └─ Return "Invalid credentials"
```

---

## Error Handling Chain

```
API Request
  │
  └─→ Rate Limit Check
      │
      ├─ EXCEEDED: 429 Too Many Requests
      └─ OK: Continue
           │
           └─→ Authentication Check
               │
               ├─ NO TOKEN: 401 Unauthorized
               ├─ INVALID: 401 Invalid token
               ├─ EXPIRED: 401 Token expired
               └─ VALID: Continue
                    │
                    └─→ Authorization Check
                        │
                        ├─ WRONG ROLE: 403 Forbidden
                        ├─ NO ACCESS: 403 Access denied
                        └─ OK: Continue
                             │
                             └─→ Input Validation
                                 │
                                 ├─ INVALID: 400 Validation failed
                                 ├─ MISSING: 400 Missing required fields
                                 └─ VALID: Continue
                                      │
                                      └─→ Business Logic
                                          │
                                          ├─ PROCESS: 200 Success
                                          ├─ NOT FOUND: 404 Not found
                                          ├─ CONFLICT: 409 Conflict
                                          ├─ ERROR: 500 Server error
                                          └─ LOG ERROR: For debugging
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│     Frontend (React + Vite)             │
│     Served on CDN / S3                  │
│     - Dashboard.jsx                     │
│     - AIAssessmentPage.jsx              │
│     - Other pages...                    │
└──────────────┬──────────────────────────┘
               │ HTTPS
               ↓
┌─────────────────────────────────────────┐
│     Backend API (Node.js)               │
│     Deployed on:                        │
│     - Docker container                  │
│     - Kubernetes pod                    │
│     - Or direct server                  │
│     - Environment: production           │
│     - HTTPS enabled                     │
│     - Rate limiting enabled             │
│     - Logging enabled                   │
└──────────────┬──────────────────────────┘
               │ Connection Pool
               ↓
┌─────────────────────────────────────────┐
│     MongoDB (Cluster)                   │
│     - Users collection                  │
│     - Assessments collection            │
│     - Courses collection                │
│     - Lessons collection                │
│     - Progress collection               │
│     - Indexes for performance           │
│     - Backups enabled                   │
│     - Replication enabled               │
└─────────────────────────────────────────┘
               │
               └─→ Monitoring & Logging
                   - Error tracking
                   - Performance monitoring
                   - User analytics
                   - Security logs
```

---

## Summary

This architecture provides:

✅ **Security**: Multi-layer protection (rate limit → auth → authz → validation)  
✅ **Performance**: Parallel processing, indexed databases  
✅ **Reliability**: Error handling, logging, monitoring  
✅ **Scalability**: Stateless API, horizontal scaling ready  
✅ **Maintainability**: Clear separation of concerns

---

**Diagram Version**: 1.0  
**Updated**: February 10, 2026  
_LearnSphere Architecture Overview_
