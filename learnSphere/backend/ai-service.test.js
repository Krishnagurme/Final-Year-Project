import { aiService } from './src/services/ai.service.js';

describe('AI Service Tests', () => {
  test('generateDynamicTest should return the correct number of questions', async () => {
    const subject = 'Mathematics';
    const numberOfQuestions = 3;
    const result = await aiService.generateDynamicTest(subject, numberOfQuestions);

    expect(result.success).toBe(true);
    expect(result.questions).toHaveLength(numberOfQuestions);
    result.questions.forEach((question, index) => {
      expect(question.question).toBe(`Question ${index + 1} for ${subject}`);
      expect(question.options).toEqual(['Option A', 'Option B', 'Option C', 'Option D']);
      expect(question.correctAnswer).toBe('Option A');
    });
  });

  test('evaluatePrerequisites should correctly evaluate prerequisites', async () => {
    const answers = [
      { correct: true },
      { correct: true },
      { correct: false },
    ];
    const subject = 'Physics';
    const courseLevel = 'Intermediate';
    const result = await aiService.evaluatePrerequisites(answers, subject, courseLevel);

    expect(result.success).toBe(true);
    expect(result.prerequisitesMet).toBe(false);
  });
});