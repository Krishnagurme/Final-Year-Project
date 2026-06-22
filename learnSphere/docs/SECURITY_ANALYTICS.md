# 🔒 Security & Analytics Implementation Guide

## Table of Contents

1. [Security Overview](#security-overview)
2. [JWT & Refresh Tokens](#jwt--refresh-tokens)
3. [Password Hashing (bcrypt)](#password-hashing)
4. [Role-Based Route Protection](#role-based-route-protection)
5. [Input Validation](#input-validation)
6. [Rate Limiting](#rate-limiting)
7. [Analytics & Dashboards](#analytics--dashboards)
8. [Implementation Checklist](#implementation-checklist)

---

## Security Overview

The LearnSphere platform implements enterprise-grade security measures:

### Security Layers

```
┌─────────────────────────────────────────┐
│  Rate Limiting (Prevent Abuse)          │
├─────────────────────────────────────────┤
│  Input Validation & Sanitization        │
├─────────────────────────────────────────┤
│  Authentication (JWT + Refresh Tokens)  │
├─────────────────────────────────────────┤
│  Role-Based Authorization               │
├─────────────────────────────────────────┤
│  Data Encryption (bcrypt)               │
├─────────────────────────────────────────┤
│  HTTPS/Secure Cookies                   │
└─────────────────────────────────────────┘
```

---

## JWT & Refresh Tokens

### Overview

- **Access Token**: Short-lived (15 minutes), grants API access
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens
- **Security**: Refresh tokens stored in httpOnly cookies to prevent XSS

### Token Generation

```javascript
// Generate token pair on login
const tokens = authService.generateTokenPair(userId, role);
// Returns: { accessToken: "...", refreshToken: "..." }

// Access token payload
{
  userId: "507f1f77bcf86cd799439011",
  role: "Student",
  type: "access",
  iat: 1704067200,
  exp: 1704068100  // Expires in 15 minutes
}

// Refresh token payload
{
  userId: "507f1f77bcf86cd799439011",
  role: "Student",
  type: "refresh",
  iat: 1704067200,
  exp: 1704672000  // Expires in 7 days
}
```

### Token Expiration Times

```javascript
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
```

### API Endpoints

#### Login (Get Tokens)

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "student@example.com",
      "name": "John Doe",
      "role": "Student"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
// Refresh token is in httpOnly cookie
```

#### Refresh Token

```bash
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Frontend Implementation

```javascript
// Login
const response = await authService.login({
  email: 'student@example.com',
  password: 'SecurePass123!',
});

const { accessToken } = response.data;
localStorage.setItem('accessToken', accessToken);
// Refresh token is automatically stored in httpOnly cookie

// Using access token
api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

// Refresh when access token expires
const newTokens = await authService.refreshToken({
  refreshToken: localStorage.getItem('refreshToken'),
});
const newAccessToken = newTokens.data.accessToken;
localStorage.setItem('accessToken', newAccessToken);
```

---

## Password Hashing

### Implementation with bcrypt

#### Password Strength Requirements

```javascript
// Minimum 8 characters
// At least 1 uppercase letter
// At least 1 lowercase letter
// At least 1 number
// At least 1 special character (!@#$%^&*)

Example: 'MyPassword123!';
```

#### Hashing Process

```javascript
const password = 'MyPassword123!';
const saltRounds = 10; // Rounds of salt

// Hashing
const hashedPassword = await bcryptjs.hash(password, saltRounds);
// Result: $2a$10$pIxZfYGjBSxKeFhDpYLhC.zB8G1nqNqSKaVlJmXj4K...

// Comparing (during login)
const isMatch = await bcryptjs.compare('MyPassword123!', hashedPassword);
// Returns: true or false
```

#### API Endpoints

Register User:

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "MyPassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "Student"
}

Response:
{
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Student"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

Change Password:

```bash
POST /api/auth/change-password
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "oldPassword": "MyPassword123!",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}

Response:
{
  "message": "Password changed successfully"
}
```

---

## Role-Based Route Protection

### Role Hierarchy

```
Admin (Level 3)
  ├─ Access all resources
  ├─ Manage users
  ├─ View admin analytics
  └─ Full platform control

Instructor (Level 2)
  ├─ Create/edit courses
  ├─ View student assessments
  ├─ Access course analytics
  └─ Manage their courses

Student (Level 1)
  ├─ Enroll in courses
  ├─ Take assessments
  ├─ View personal analytics
  └─ Access learning materials
```

### Middleware Usage

```javascript
// Student-only routes
router.get('/assessments', authenticate, isStudent, handler);

// Instructor-only routes
router.post('/courses', authenticate, isInstructor, handler);

// Admin-only routes
router.get('/admin/analytics', authenticate, isAdmin, handler);

// Owner-only (access own data)
router.get('/users/:userId/data', authenticate, isOwner, handler);

// Minimum role level
router.get('/reports', authenticate, hasMinimumRole('Instructor'), handler);
```

### Protected Endpoints

#### Student Routes

```
GET /api/assessments/my-assessments - Get user's assessments
POST /api/assessments/generate-test/:subject - Generate test
POST /api/assessments/evaluate-prerequisites - Evaluate
GET /api/analytics/dashboard - View personal dashboard
GET /api/analytics/completion - View completion rate
```

#### Instructor Routes

```
POST /api/courses - Create course
PUT /api/courses/:id - Edit course
GET /api/courses/instructor/my-courses - Get their courses
GET /api/analytics/admin - View analytics
```

#### Admin Routes

```
DELETE /api/users/:id - Remove user
GET /api/analytics/admin - Full platform analytics
PUT /api/users/:id/role - Change user role
```

---

## Input Validation

### Validation Pipeline

```
Request → Sanitize → Validate Types → Validate Rules → Business Logic
```

### Validation Schemas

#### Register Schema

```javascript
{
  firstName: string, min 2, max 50, required
  lastName: string, min 2, max 50, required
  email: valid email, required
  password: 8+ chars, uppercase, lowercase, number, special, required
  role: Student|Instructor|Admin, default Student
}
```

#### Login Schema

```javascript
{
  email: valid email, required
  password: string, required
}
```

#### Assessment Schema

```javascript
{
  courseId: MongoDB ObjectId, required
  subject: string, required
  answers: array of { questionId, studentAnswer, isCorrect }, required
}
```

### Example Validation Response

```javascript
// Invalid request
POST /api/auth/register
{
  "email": "invalid-email",
  "password": "weak"
}

Response (400):
{
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "password": "Password must contain uppercase, lowercase, number, and special character",
    "firstName": "firstName is required"
  }
}
```

### Sanitization

XSS Prevention:

```javascript
// Input: "<script>alert('xss')</script>"
// After sanitization: "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
```

---

## Rate Limiting

### Limit Tiers

#### Strict (Authentication)

- **Limit**: 5 requests
- **Window**: 15 minutes
- **Use**: Login, Register endpoints
- **Purpose**: Prevent brute force attacks

#### Moderate (General API)

- **Limit**: 100 requests
- **Window**: 15 minutes
- **Use**: Standard API endpoints
- **Purpose**: Prevent abuse

#### Relaxed (Read Operations)

- **Limit**: 1000 requests
- **Window**: 15 minutes
- **Use**: GET endpoints, analytics
- **Purpose**: Allow comfortable browsing

#### Test-Specific

- **Limit**: 10 tests
- **Window**: 24 hours
- **Use**: `/generate-test/:subject`
- **Purpose**: Fair usage policy

#### Evaluation-Specific

- **Limit**: 5 evaluations
- **Window**: 1 hour
- **Use**: `/evaluate-prerequisites`
- **Purpose**: Prevent repeated evaluation gaming

### Response Headers

```
X-RateLimit-Limit: 10          # Max requests allowed
X-RateLimit-Remaining: 7       # Requests left
X-RateLimit-Reset: 2024-01-10T15:30:00Z  # When limit resets
```

### Rate Limit Error Response

```javascript
// 429 Too Many Requests
{
  "message": "Daily test generation limit reached. You can generate 10 tests per day.",
  "retryAfter": 3600,  // Seconds to wait
  "resetTime": "2024-01-10T15:30:00Z",
  "usedToday": 10,
  "totalAllowed": 10
}
```

---

## Analytics & Dashboards

### Analytics Service Methods

#### 1. Course Completion Analytics

```javascript
const analytics = await analyticsService.getCourseCompletionAnalytics(userId);

Returns: {
  totalEnrolled: 5,
  completed: 3,
  inProgress: 1,
  notStarted: 1,
  completionRate: 60,  // percentage
  courses: [
    {
      courseId: "...",
      title: "React Basics",
      progress: 100,
      status: "Completed",
      enrolledDate: "2024-01-01",
      completedDate: "2024-01-15"
    }
  ]
}
```

#### 2. Skill Progression Analytics

```javascript
const analytics = await analyticsService.getSkillProgressionAnalytics(userId);

Returns: {
  totalAssessments: 12,
  currentSkillLevel: "INTERMEDIATE",
  highestScore: 95,
  averageScore: 78,
  skillsProgression: [
    {
      subject: "JavaScript",
      attempts: 3,
      firstScore: 65,
      lastScore: 85,
      improvement: 20,
      averageScore: 78,
      highestScore: 85,
      lowestScore: 65
    }
  ]
}
```

#### 3. Assessment History Analytics

```javascript
const analytics = await analyticsService.getAssessmentHistoryAnalytics(userId);

Returns: {
  totalAssessments: 20,
  averageScore: 76,
  bestScore: 95,
  worstScore: 42,
  trend: "Improving",  // Improving | Declining | Stable
  history: [
    {
      subject: "Python",
      score: 88,
      skillLevel: "INTERMEDIATE",
      confidenceScore: 0.85,
      date: "2024-01-10",
      dateFormatted: "1/10/2024"
    }
  ]
}
```

#### 4. Confidence Score Analytics

```javascript
const analytics = await analyticsService.getConfidenceScoreAnalytics(userId);

Returns: {
  averageConfidence: 0.78,     // 0.0 - 1.0
  highestConfidence: 0.95,
  lowestConfidence: 0.45,
  distribution: {
    high: 12,    // >= 0.8
    medium: 6,   // 0.5 - 0.8
    low: 2       // < 0.5
  },
  bySubject: {
    "JavaScript": {
      averageConfidence: 0.82,
      assessmentCount: 5,
      assessments: [...]
    }
  },
  recommendations: [
    "Consider reviewing fundamentals - your confidence scores are low",
    "Practice more on weak topics to build confidence"
  ]
}
```

#### 5. Dashboard Analytics (All Combined)

```javascript
const analytics = await analyticsService.getDashboardAnalytics(userId);

Returns: {
  user: {
    name: "John Doe",
    email: "john@example.com",
    skillLevel: "INTERMEDIATE"
  },
  courseCompletion: {...},
  skillProgression: {...},
  assessmentHistory: {...},
  confidenceScores: {...},
  generatedAt: "2024-01-10T10:00:00Z"
}
```

#### 6. Admin Analytics

```javascript
const analytics = await analyticsService.getAdminAnalytics();

Returns: {
  totalUsers: 150,
  activeUsers: 89,  // Last 7 days
  totalCourses: 25,
  totalAssessments: 1250,
  usersByRole: [
    { _id: "Student", count: 120 },
    { _id: "Instructor", count: 25 },
    { _id: "Admin", count: 5 }
  ],
  assessmentsByLevel: [
    { _id: "BEGINNER", count: 450, avgScore: 32 },
    { _id: "INTERMEDIATE", count: 600, avgScore: 56 },
    { _id: "ADVANCED", count: 200, avgScore: 82 }
  ],
  assessmentsBySubject: [...]
}
```

### API Endpoints

```bash
# User Analytics
GET /api/analytics/completion           # Course completion rate
GET /api/analytics/skills              # Skill progression
GET /api/analytics/assessments         # Assessment history
GET /api/analytics/confidence          # Confidence scores
GET /api/analytics/dashboard           # Complete dashboard

# Admin Analytics
GET /api/analytics/admin               # Platform-wide analytics
```

### Dashboard Component Features

1. **Overview Tab**
   - Course completion metrics
   - Current skill level
   - Progress bars
   - Course status breakdown

2. **Skills Tab**
   - Skill progression by subject
   - Score improvements
   - Average and highest scores
   - Subject-specific performance

3. **Assessments Tab**
   - Assessment history table
   - Score trends
   - Assessment statistics
   - Performance indicators

4. **Confidence Tab**
   - Confidence score distribution
   - Subject-wise confidence
   - AI recommendations
   - Learning suggestions

### Dashboard Response Time Targets

- Overview: < 500ms
- Skills: < 500ms
- Assessments: < 500ms (with pagination)
- Confidence: < 500ms
- Complete Dashboard: < 2000ms

---

## Implementation Checklist

### Security Setup

- [ ] Configure JWT_SECRET in .env
- [ ] Configure JWT_REFRESH_SECRET in .env
- [ ] Install bcryptjs package
- [ ] Implement password hashing in auth service
- [ ] Add refresh token endpoint
- [ ] Set httpOnly cookies for refresh tokens
- [ ] Test token refresh flow

### Role-Based Protection

- [ ] Create roleProtection middleware
- [ ] Add hasRole() middleware
- [ ] Implement isStudent() middleware
- [ ] Implement isInstructor() middleware
- [ ] Implement isAdmin() middleware
- [ ] Protect all protected routes
- [ ] Test authorization on each role

### Input Validation

- [ ] Install joi package
- [ ] Create validation schemas
- [ ] Implement validateRequest middleware
- [ ] Add sanitizeRequest middleware
- [ ] Validate all API inputs
- [ ] Test validation edge cases
- [ ] Test XSS prevention

### Rate Limiting

- [ ] Create rateLimit middleware
- [ ] Implement strictRateLimit (5/15min)
- [ ] Implement moderateRateLimit (100/15min)
- [ ] Implement testGenerationLimit (10/day)
- [ ] Implement evaluationLimit (5/hour)
- [ ] Apply to auth endpoints
- [ ] Apply to assessment endpoints
- [ ] Test rate limit responses

### Analytics Service

- [ ] Create analyticsService
- [ ] Implement getCourseCompletionAnalytics()
- [ ] Implement getSkillProgressionAnalytics()
- [ ] Implement getAssessmentHistoryAnalytics()
- [ ] Implement getConfidenceScoreAnalytics()
- [ ] Implement getDashboardAnalytics()
- [ ] Implement getAdminAnalytics()
- [ ] Test all analytics methods

### Analytics API

- [ ] Create analytics.routes.js
- [ ] Add /analytics/completion endpoint
- [ ] Add /analytics/skills endpoint
- [ ] Add /analytics/assessments endpoint
- [ ] Add /analytics/confidence endpoint
- [ ] Add /analytics/dashboard endpoint
- [ ] Add /analytics/admin endpoint
- [ ] Add proper role protection
- [ ] Test all endpoints

### Dashboard Component

- [ ] Create Dashboard.jsx component
- [ ] Implement Overview tab
- [ ] Implement Skills tab
- [ ] Implement Assessments tab
- [ ] Implement Confidence tab
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test all tabs
- [ ] Test responsive design

### Frontend Services

- [ ] Add authService.refreshToken()
- [ ] Add authService.changePassword()
- [ ] Add analyticsService methods
- [ ] Update API interceptor for token refresh
- [ ] Test all service methods

### Integration Testing

- [ ] Test complete login flow
- [ ] Test token refresh flow
- [ ] Test password change
- [ ] Test rate limiting on test generation
- [ ] Test rate limiting on evaluation
- [ ] Test analytics data retrieval
- [ ] Test dashboard loading
- [ ] Test role-based access control

### Deployment

- [ ] Set all environment variables
- [ ] Configure HTTPS
- [ ] Enable secure cookies
- [ ] Configure CORS properly
- [ ] Set up monitoring
- [ ] Configure logging
- [ ] Test all endpoints
- [ ] Monitor performance

---

## Security Best Practices

1. **Never log sensitive data**
   - Don't log passwords, tokens, or API keys
   - Use structured logging

2. **Use HTTPS in production**
   - Always use secure connections
   - Set Secure flag on cookies

3. **Implement CORS properly**
   - Only allow trusted origins
   - Use whitelist approach

4. **Validate all inputs**
   - Never trust user input
   - Validate on both frontend and backend

5. **Store secrets in environment variables**
   - Never commit .env files
   - Use secret management services in production

6. **Monitor for suspicious activity**
   - Track failed login attempts
   - Alert on multiple rate limit violations
   - Monitor unusual patterns

7. **Regular security audits**
   - Perform code reviews
   - Run security scans
   - Update dependencies regularly

8. **Backup data regularly**
   - Implement daily backups
   - Test backup restoration
   - Store backups securely

---

## Troubleshooting

### Common Issues

**Invalid Token Error**

```
Error: Invalid token
Solution: Check JWT_SECRET matches, token hasn't expired
```

**Rate Limit Exceeded**

```
Error: Too many requests
Solution: Wait for reset time, implement exponential backoff
```

**Password Hashing Takes Too Long**

```
Error: Request timeout during registration
Solution: Reduce salt rounds temporarily (10 is standard, 12+ is slow)
```

**Analytics Empty**

```
Error: No data in analytics
Solution: Ensure user has assessments, check User permissions
```

---

## Support & Resources

- Documentation: See AI_PREREQUISITE_SYSTEM.md
- API Reference: See AI_PREREQUISITE_API.md
- Security Standards: OWASP Top 10
- Best Practices: Learn.Microsoft.com

---

**Last Updated**: February 10, 2026  
**Version**: 1.0 (Security & Analytics Implementation)

_Part of LearnSphere - AI-Powered Learning Management Platform_
