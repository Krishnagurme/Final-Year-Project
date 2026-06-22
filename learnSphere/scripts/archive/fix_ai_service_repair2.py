from pathlib import Path
path = Path('backend/src/services/ai.service.js')
text = path.read_text(encoding='utf-8')
start_marker = '      const response = await axios.post('
end_marker = '  async evaluatePrerequisites(answers, subject, courseLevel) {'
if start_marker not in text or end_marker not in text:
    raise ValueError('Markers not found')
start = text.index(start_marker)
end = text.index(end_marker, start)
new_block = '''      const response = await axios.post(
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
path.write_text(text[:start] + new_block + text[end:], encoding='utf-8')
print('repair script applied successfully')
