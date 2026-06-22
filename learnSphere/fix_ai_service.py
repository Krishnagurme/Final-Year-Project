from pathlib import Path

p = Path('backend/src/services/ai.service.js')
text = p.read_text(encoding='utf-8')
start_marker = '  async generateDynamicTest(subject, numberOfQuestions = 5) {'
end_marker = '  async generateLearningPath(studentProfile, courseId, assessmentResults) {'
start = text.index(start_marker)
end = text.index(end_marker, start)
new_block = '''  async generateDynamicTest(subject, numberOfQuestions = 5) {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: true,
        questions: getFallbackQuestions(subject, numberOfQuestions),
        estimatedCompletionTime: Math.max(10, numberOfQuestions * 3),
        subject,
      };
    }

    try {
      const prompt = `
Generate a comprehensive prerequisite assessment test for ${subject}.

Requirements:
- Create ${numberOfQuestions} multiple-choice questions
- Questions should progress from basic to intermediate difficulty
- Each question should test core concepts
- Include 4 options per question with only 1 correct answer
- Focus on these knowledge areas: ${SUBJECT_KNOWLEDGE_AREAS[subject] || 'core concepts'}

Respond with ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "difficulty": "easy|medium|hard",
      "topic": "topic name",
      "explanation": "Why this is correct"
    }
  ],
  "estimatedCompletionTime": 15,
  "subject": "${subject}"
}
`;

      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational test designer. Generate high-quality prerequisite assessment questions. Always respond with valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const testData = JSON.parse(content);
      return {
        success: true,
        questions: testData.questions,
        estimatedCompletionTime: testData.estimatedCompletionTime,
        subject,
      };
    } catch (error) {
      console.error('Dynamic Test Generation Error:', error);
      return {
        success: false,
        questions: getFallbackQuestions(subject, numberOfQuestions),
        estimatedCompletionTime: Math.max(10, numberOfQuestions * 3),
        subject,
        fallback: true,
        error: error.message,
      };
    }
  },

  async evaluatePrerequisites(answers, subject, courseLevel) {
    if (!process.env.OPENAI_API_KEY) {
      return buildFallbackEvaluation(answers, subject, courseLevel);
    }

    try {
      const totalQuestions = answers.length;
      const correctAnswers = answers.filter(a => a.isCorrect).length;
      const rawScore = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      const prompt = `
Perform a detailed educational assessment evaluation:

Subject: ${subject}
Course Level: ${courseLevel}
Student Score: ${rawScore}%
Total Questions: ${totalQuestions}
Correct Answers: ${correctAnswers}

Detailed Answer Analysis:
${answers.map((a, i) => `Q${i + 1}: ${a.question}\nStudent Answer: ${a.studentAnswer}\nCorrect Answer: ${a.correctAnswer}\nCorrect: ${a.isCorrect}\nTopic: ${a.topic}`).join('\n---\n')}

Based on this detailed analysis, provide a comprehensive JSON evaluation with:
{
  "recommendedLevel": "BEGINNER|INTERMEDIATE|ADVANCED",
  "score": ${rawScore},
  "accuracy": "percentage of correct answers",
  "conceptClarity": "assessment of how well student understands core concepts",
  "logicalThinking": "assessment of problem-solving approach",
  "strengths": ["topic 1", "topic 2"],
  "weaknesses": ["topic 1", "topic 2"],
  "recommendations": ["specific learning module 1", "specific learning module 2"],
  "nextSteps": ["actionable step 1", "actionable step 2"],
  "learningPath": {
    "estimatedHours": "20-40",
    "focusAreas": [],
    "suggestedPace": "2-3 hours per week"
  },
  "feedback": "personalized detailed feedback message",
  "confidenceScore": 0.85,
  "assessmentSummary": "overall assessment summary"
}
`;

      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational assessment evaluator. Analyze student knowledge with precision and provide detailed, actionable feedback. Always respond with valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const evaluation = JSON.parse(content);
      const score = evaluation.score || rawScore;
      let recommendedLevel = evaluation.recommendedLevel || 'BEGINNER';

      if (score >= SKILL_THRESHOLDS.ADVANCED.min) {
        recommendedLevel = 'ADVANCED';
      } else if (score >= SKILL_THRESHOLDS.INTERMEDIATE.min) {
        recommendedLevel = 'INTERMEDIATE';
      } else {
        recommendedLevel = 'BEGINNER';
      }

      return {
        ...evaluation,
        recommendedLevel,
        score,
        subject,
        skillLevelRange: SKILL_THRESHOLDS[recommendedLevel],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      return buildFallbackEvaluation(answers, subject, courseLevel);
    }
  },
'''
new_text = text[:start] + new_block + text[end:]
p.write_text(new_text, encoding='utf-8')
