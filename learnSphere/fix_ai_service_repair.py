from pathlib import Path

file_path = Path('backend/src/services/ai.service.js')
text = file_path.read_text(encoding='utf-8')
start_marker = '  async generateDynamicTest(subject, numberOfQuestions = 5) {'
end_marker = '  async evaluatePrerequisites(answers, subject, courseLevel) {'

if start_marker not in text:
    raise ValueError('start_marker not found')
if end_marker not in text:
    raise ValueError('end_marker not found')

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
'''

new_text = text[:start] + new_block + text[end:]
file_path.write_text(new_text, encoding='utf-8')
print('Repair completed')
