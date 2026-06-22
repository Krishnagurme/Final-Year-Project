# 🧠 AI Prerequisite Test System - Quick Reference Card

## System Overview

**Purpose**: Dynamically evaluate student knowledge and assign skill levels  
**Coverage**: 6 subjects (JavaScript, Python, React, Java, SQL, Web Design)  
**Skill Levels**: BEGINNER (0-40%), INTERMEDIATE (41-70%), ADVANCED (71-100%)

---

## Quick Start (Frontend)

### User Flow

```
1. Click "AI Assessment" in sidebar
2. Select subject (6 options with icons)
3. Answer 5 dynamically generated questions
4. Submit for AI evaluation
5. View results with recommendations
6. Access learning path
```

### Component Location

**File**: `frontend/src/pages/AIAssessmentPage.jsx`

---

## API Quick Reference

### 1. Generate Test

```
POST /api/assessments/generate-test/:subject
Authorization: Bearer {token}
Body: { "numberOfQuestions": 5 }
Returns: 5 questions with topics & difficulty
Time: ~8 seconds
```

### 2. Evaluate Prerequisites

```
POST /api/assessments/evaluate-prerequisites
Authorization: Bearer {token}
Body: { "answers": [...], "subject": "JavaScript", "courseLevel": "INTERMEDIATE" }
Returns: Skill level, score, strengths, weaknesses, recommendations
Time: ~10 seconds
```

### 3. Submit Assessment

```
POST /api/assessments/submit-assessment
Authorization: Bearer {token}
Body: { "answers": [...], "courseId": "...", "subject": "JavaScript" }
Returns: Assessment ID, scores, feedback, learning path
Time: ~12 seconds
```

### 4. Get Results

```
GET /api/assessments/results/:assessmentId
Authorization: Bearer {token}
Returns: Full assessment data with evaluation
Time: <500ms
```

### 5. My Assessments

```
GET /api/assessments/my-assessments
Authorization: Bearer {token}
Returns: Last 10 assessments for user
Time: <500ms
```

### 6. Analytics

```
GET /api/assessments/history/analytics
Authorization: Bearer {token}
Returns: Statistics, trends, distribution
Time: <500ms
```

---

## Skill Level Quick Reference

| Level            | Score   | Focus          | Hours | Status           |
| ---------------- | ------- | -------------- | ----- | ---------------- |
| **BEGINNER**     | 0-40%   | Fundamentals   | 30-40 | Foundation Phase |
| **INTERMEDIATE** | 41-70%  | Application    | 15-25 | Growth Phase     |
| **ADVANCED**     | 71-100% | Specialization | 5-15  | Mastery Phase    |

---

## Evaluation Metrics

### Accuracy

```
Formula: (Correct / Total) × 100%
Example: 4/5 = 80%
```

### Concept Clarity

```
Rating: Poor | Fair | Good | Excellent
Measures: Understanding depth
```

### Logical Thinking

```
Rating: Poor | Fair | Good | Excellent
Measures: Problem-solving quality
```

### Confidence Score

```
Range: 0.0 - 1.0
0.95 = Very confident
0.50 = Borderline, may need reassessment
```

---

## Subjects & Knowledge Areas

### JavaScript

- Variables & Data Types
- Functions & Scope
- Async/Await
- DOM Manipulation
- ES6+ Features

### Python

- Variables & Data Types
- Functions & Decorators
- List Comprehension
- OOP Concepts
- Error Handling

### React

- JSX Syntax
- Component Lifecycle
- Hooks
- State Management
- Props & Communication

### Java

- OOP Principles
- Collections Framework
- Exception Handling
- Multithreading
- Generics

### SQL

- SELECT Queries
- JOIN Operations
- Aggregation Functions
- Indexing
- Transaction Management

### Web Design

- HTML Structure
- CSS Styling
- Responsive Design
- Accessibility
- Performance Optimization

---

## Testing with cURL

### Generate Test

```bash
curl -X POST http://localhost:5000/api/assessments/generate-test/JavaScript \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"numberOfQuestions": 5}'
```

### Evaluate

```bash
curl -X POST http://localhost:5000/api/assessments/evaluate-prerequisites \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"questionId":"1","isCorrect":true,"topic":"Functions"},
      {"questionId":"2","isCorrect":false,"topic":"Async"},
      {"questionId":"3","isCorrect":true,"topic":"ES6"}
    ],
    "subject": "JavaScript",
    "courseLevel": "INTERMEDIATE"
  }'
```

### Get Analytics

```bash
curl http://localhost:5000/api/assessments/history/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Response Examples

### Test Generation Response

```json
{
  "message": "Dynamic test generated for JavaScript",
  "data": {
    "questions": [
      {
        "id": 1,
        "question": "What is a closure?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "difficulty": "medium",
        "topic": "Functions & Scope"
      }
    ],
    "estimatedCompletionTime": 15,
    "subject": "JavaScript"
  }
}
```

### Evaluation Response

```json
{
  "recommendedLevel": "INTERMEDIATE",
  "score": 75.0,
  "accuracy": "75%",
  "strengths": ["Closure understanding", "Async knowledge"],
  "weaknesses": ["ES6 features recognition"],
  "recommendations": ["Complete ES6+ module", "Practice modern syntax"],
  "feedback": "Strong grasp of core concepts...",
  "confidenceScore": 0.82,
  "learningPath": {
    "estimatedHours": 20,
    "focusAreas": ["ES6 Features"],
    "suggestedPace": "3 hours per week"
  }
}
```

---

## Error Codes

| Code | Meaning      | Solution                  |
| ---- | ------------ | ------------------------- |
| 400  | Bad Request  | Check request body format |
| 401  | Unauthorized | Invalid or missing token  |
| 403  | Forbidden    | Insufficient permissions  |
| 404  | Not Found    | Resource doesn't exist    |
| 500  | Server Error | Check server logs         |

---

## Configuration Required

### Environment Variables

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
MONGODB_URI=mongodb://localhost:27017/learnsphere
JWT_SECRET=your-secret-key
VITE_API_BASE_URL=http://localhost:5000/api
```

### Rate Limits

- Test Generation: 10/day
- Evaluations: 5/hour
- API Calls: 100/15min

---

## Performance Targets

| Operation       | Target | Typical |
| --------------- | ------ | ------- |
| Test Generation | <10s   | 8s      |
| Evaluation      | <15s   | 10s     |
| Learning Path   | <10s   | 8s      |
| Results Fetch   | <500ms | 100ms   |
| Analytics       | <500ms | 150ms   |

---

## File Locations

### Backend

- Service: `backend/src/services/ai.service.js`
- Routes: `backend/src/routes/assessment.routes.js`
- Model: `backend/src/models/Assessment.js`

### Frontend

- Page: `frontend/src/pages/AIAssessmentPage.jsx`
- Service: `frontend/src/services/index.js` (assessmentService)

### Documentation

- Guide: `docs/AI_PREREQUISITE_SYSTEM.md`
- API: `docs/AI_PREREQUISITE_API.md`
- Implementation: `docs/AI_PREREQUISITE_IMPLEMENTATION.md`

---

## Troubleshooting

### Test Generation Fails

1. Check OpenAI API key
2. Verify network connection
3. Check OpenAI status page
4. Review logs for specific error

### Evaluation Inaccurate

1. Verify answer data matches question
2. Check that isCorrect flags are correct
3. Review aiEvaluation.feedback in response
4. Note: AI considers more than just accuracy

### Frontend Can't Reach API

1. Check VITE_API_BASE_URL
2. Verify backend is running
3. Check CORS headers
4. Review browser console errors

---

## Testing Checklist

- [ ] All 6 subjects load
- [ ] Test generation works
- [ ] Questions have difficulty labels
- [ ] Progress bar updates
- [ ] Submit validates completion
- [ ] Results show all metrics
- [ ] Skill levels match scores
- [ ] Recommendations provided
- [ ] Learning path displays
- [ ] History shows assessments

---

## Production Checklist

- [ ] OpenAI API key configured
- [ ] MongoDB running and accessible
- [ ] JWT secret in environment
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] CORS properly configured
- [ ] HTTPS enabled
- [ ] Backups scheduled
- [ ] Monitoring in place
- [ ] Documentation updated

---

## Key Resources

| Resource               | Location                               |
| ---------------------- | -------------------------------------- |
| Complete Guide         | docs/AI_PREREQUISITE_SYSTEM.md         |
| API Reference          | docs/AI_PREREQUISITE_API.md            |
| Implementation Details | docs/AI_PREREQUISITE_IMPLEMENTATION.md |
| Architecture           | docs/ARCHITECTURE.md                   |
| Deployment             | docs/DEPLOYMENT.md                     |
| Postman Collection     | Postman_Collection.json                |

---

## Quick Commands

### Development

```bash
npm run dev                    # Start dev environment
npm run build                  # Build project
npm run lint                   # Check code quality
npm run format                 # Format code
```

### Docker

```bash
docker-compose build           # Build images
docker-compose up              # Start services
docker-compose logs -f backend # Watch backend logs
```

### Testing

```bash
# Use Postman Collection or cURL commands above
# Import Postman_Collection.json
# Set BASE_URL=http://localhost:5000
# Set TOKEN=<your_jwt_token>
```

---

## Contact & Support

- **Issues**: Check docs/ folder for detailed guides
- **Errors**: Review error logs in `logs/` directory
- **Deployment**: See `docs/DEPLOYMENT.md`
- **API Docs**: See `docs/API_PREREQUISITE_API.md`

---

**Last Updated**: February 10, 2026  
**Version**: 1.0 (Production Ready)

_Part of LearnSphere - AI-Powered Learning Management Platform_
