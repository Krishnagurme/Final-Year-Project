import axios from 'axios';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SUBJECT_KNOWLEDGE_AREAS = {
  'Engineering Mathematics III': [
    'Matrices',
    'Differential Equations',
    'Probability',
    'Series',
    'Linear Algebra',
  ],
  'Data Structures and Algorithms': ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Sorting'],
  'Software Engineering': ['SDLC', 'Design Patterns', 'Testing', 'Requirements', 'UML'],
  Microprocessor: ['Registers', 'Instruction Set', 'Interrupts', 'Memory Mapping', 'Timers'],
  'Principles of Programming Languages': [
    'Syntax',
    'Semantics',
    'Paradigms',
    'Type Systems',
    'Compilation',
  ],
  'Discrete Mathematics': ['Logic', 'Sets', 'Relations', 'Graphs', 'Combinatorics'],
  'Fundamentals of Data Structures': ['Stacks', 'Queues', 'Trees', 'Hash Tables', 'Graphs'],
  'Object Oriented Programming (OOP)': [
    'Classes',
    'Inheritance',
    'Polymorphism',
    'Encapsulation',
    'Abstraction',
  ],
  'Computer Graphics': ['Rasterization', 'Transformations', 'Rendering', 'Shaders', '3D Modeling'],
  'Digital Electronics and Logic Design': [
    'Logic Gates',
    'Flip-Flops',
    'Boolean Algebra',
    'Multiplexers',
    'Counters',
  ],
  'Business Communication Skills': [
    'Email Etiquette',
    'Presentations',
    'Active Listening',
    'Professional Writing',
    'Negotiation',
  ],
  'Database Management Systems': [
    'SQL Queries',
    'Normalization',
    'Transactions',
    'Indexes',
    'ER Models',
  ],
  'Theory of Computation': [
    'Finite Automata',
    'Regular Expressions',
    'Turing Machines',
    'Decidability',
    'Grammar',
  ],
  'Systems Programming & Operating System': [
    'Processes',
    'Memory Management',
    'Scheduling',
    'File Systems',
    'Concurrency',
  ],
  'Computer Networks & Security': [
    'TCP/IP',
    'Routing',
    'Cryptography',
    'Firewalls',
    'Network Layers',
  ],
  'Elective I (Data Science / AI etc.)': [
    'Data Wrangling',
    'Machine Learning Basics',
    'Data Visualization',
    'AI Ethics',
    'Statistical Models',
  ],
  'Design & Analysis of Algorithms': [
    'Greedy Algorithms',
    'Divide and Conquer',
    'Dynamic Programming',
    'Complexity Analysis',
    'Graph Algorithms',
  ],
  'Artificial Intelligence': [
    'Search',
    'Knowledge Representation',
    'Planning',
    'Machine Learning',
    'Reasoning',
  ],
  'Web Technology': ['HTML', 'CSS', 'JavaScript', 'HTTP', 'Web Architecture'],
  'Data Analytics': [
    'Data Cleaning',
    'Visualization',
    'Statistics',
    'Business Intelligence',
    'Predictive Modeling',
  ],
  'Elective II': [
    'Emerging Technologies',
    'Applied Research',
    'Domain Knowledge',
    'Innovation',
    'Advanced Topics',
  ],
  'Machine Learning': [
    'Regression',
    'Classification',
    'Neural Networks',
    'Model Evaluation',
    'Overfitting',
  ],
  'Blockchain Technology': [
    'Distributed Ledger',
    'Consensus',
    'Smart Contracts',
    'Cryptography',
    'Decentralization',
  ],
  'Elective III': [
    'Industry Trends',
    'Project Work',
    'Special Topics',
    'Research Methods',
    'Advanced Concepts',
  ],
  'Elective IV': [
    'Capstone Topics',
    'Interdisciplinary Study',
    'Innovation',
    'Technology Applications',
    'Expert Skills',
  ],
  'Project Phase I': [
    'Project Planning',
    'Requirement Gathering',
    'Team Management',
    'Timeline Creation',
    'Risk Assessment',
  ],
  'Deep Learning / Advanced Subjects (Electives)': [
    'Neural Networks',
    'CNNs',
    'RNNs',
    'Transformers',
    'Advanced AI Models',
  ],
  'Cyber Security & Digital Forensics (Elective)': [
    'Threat Analysis',
    'Incident Response',
    'Digital Forensics',
    'Cryptography',
    'Network Security',
  ],
  'Project Phase II': ['Testing', 'Deployment', 'Documentation', 'Maintenance', 'Review'],
  'Internship / Seminar': [
    'Professional Communication',
    'Presentation Skills',
    'Industry Exposure',
    'Research',
    'Networking',
  ],
  JavaScript: [
    'Variables & Data Types',
    'Functions & Scope',
    'Async/Await',
    'DOM Manipulation',
    'ES6+ Features',
  ],
  Python: [
    'Variables & Data Types',
    'Functions & Decorators',
    'List Comprehension',
    'OOP Concepts',
    'Error Handling',
  ],
  React: [
    'JSX Syntax',
    'Component Lifecycle',
    'Hooks',
    'State Management',
    'Props & Communication',
  ],
  Java: [
    'OOP Principles',
    'Collections Framework',
    'Exception Handling',
    'Multithreading',
    'Generics',
  ],
  SQL: [
    'SELECT Queries',
    'JOIN Operations',
    'Aggregation Functions',
    'Indexing',
    'Transaction Management',
  ],
  'Web Design': [
    'HTML Structure',
    'CSS Styling',
    'Responsive Design',
    'Accessibility',
    'Performance Optimization',
  ],
};

const LOCAL_QUESTION_BANKS = {
  'Engineering Mathematics III': [
    {
      id: '1',
      question:
        'Which matrix operation is used to solve linear equations using determinant ratios?',
      options: ['Cramer’s Rule', 'Gaussian Elimination', 'Matrix Inversion', 'LU Decomposition'],
      correctAnswer: 'Cramer’s Rule',
      difficulty: 'easy',
      topic: 'Matrices',
      explanation: 'Cramer’s Rule uses determinants to solve systems of linear equations.',
    },
    {
      id: '2',
      question: 'What is the derivative of sin(x)?',
      options: ['cos(x)', '-cos(x)', 'sin(x)', '-sin(x)'],
      correctAnswer: 'cos(x)',
      difficulty: 'easy',
      topic: 'Differential Equations',
      explanation: 'The derivative of sin(x) is cos(x).',
    },
    {
      id: '3',
      question:
        'Which distribution is used when the probability of success is constant across trials?',
      options: [
        'Binomial Distribution',
        'Normal Distribution',
        'Poisson Distribution',
        'Uniform Distribution',
      ],
      correctAnswer: 'Binomial Distribution',
      difficulty: 'medium',
      topic: 'Probability',
      explanation:
        'Binomial distribution models fixed number of independent trials with constant probability of success.',
    },
    {
      id: '4',
      question: 'Which series is used to represent alternating sums?',
      options: ['Alternating Series', 'Geometric Series', 'Harmonic Series', 'Taylor Series'],
      correctAnswer: 'Alternating Series',
      difficulty: 'medium',
      topic: 'Series',
      explanation: 'Alternating series have terms that alternate in sign.',
    },
    {
      id: '5',
      question: 'What is the rank of a matrix?',
      options: [
        'Number of independent rows',
        'Total number of rows',
        'Number of zero entries',
        'Determinant value',
      ],
      correctAnswer: 'Number of independent rows',
      difficulty: 'hard',
      topic: 'Linear Algebra',
      explanation: 'Matrix rank is the number of linearly independent rows or columns.',
    },
  ],
  'Data Structures and Algorithms': [
    {
      id: '1',
      question: 'Which data structure uses FIFO order?',
      options: ['Queue', 'Stack', 'Tree', 'Graph'],
      correctAnswer: 'Queue',
      difficulty: 'easy',
      topic: 'Queues',
      explanation: 'A queue uses first-in, first-out ordering.',
    },
    {
      id: '2',
      question: 'What is the average-case time complexity of binary search on a sorted array?',
      options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'],
      correctAnswer: 'O(log n)',
      difficulty: 'easy',
      topic: 'Searching',
      explanation: 'Binary search halves the search range each step, yielding logarithmic time.',
    },
    {
      id: '3',
      question:
        'Which algorithm is best for finding the shortest path in a weighted graph with non-negative edges?',
      options: ['Dijkstra’s Algorithm', 'Bubble Sort', 'Depth-first Search', 'Kruskal’s Algorithm'],
      correctAnswer: 'Dijkstra’s Algorithm',
      difficulty: 'medium',
      topic: 'Graph Algorithms',
      explanation: 'Dijkstra’s algorithm finds shortest paths in graphs with non-negative weights.',
    },
    {
      id: '4',
      question: 'Which sort algorithm has the best average-case performance?',
      options: ['Merge Sort', 'Bubble Sort', 'Selection Sort', 'Insertion Sort'],
      correctAnswer: 'Merge Sort',
      difficulty: 'medium',
      topic: 'Sorting',
      explanation: 'Merge sort has O(n log n) average-case performance.',
    },
    {
      id: '5',
      question: 'What is the main advantage of a hash table?',
      options: [
        'Fast lookup',
        'Ordered storage',
        'Guaranteed sorted results',
        'Minimal memory use',
      ],
      correctAnswer: 'Fast lookup',
      difficulty: 'hard',
      topic: 'Hash Tables',
      explanation: 'Hash tables provide near-constant-time lookup for many use cases.',
    },
  ],
  'Software Engineering': [
    {
      id: '1',
      question: 'Which phase of the SDLC defines the system requirements?',
      options: ['Requirements Gathering', 'Implementation', 'Testing', 'Maintenance'],
      correctAnswer: 'Requirements Gathering',
      difficulty: 'easy',
      topic: 'SDLC',
      explanation: 'Requirements gathering captures what the system must do.',
    },
    {
      id: '2',
      question: 'Which diagram shows object interactions over time?',
      options: ['Sequence Diagram', 'Class Diagram', 'Use Case Diagram', 'Activity Diagram'],
      correctAnswer: 'Sequence Diagram',
      difficulty: 'medium',
      topic: 'UML',
      explanation: 'Sequence diagrams represent interactions in chronological order.',
    },
    {
      id: '3',
      question: 'What is the primary goal of unit testing?',
      options: [
        'Validate individual components',
        'Check user requirements',
        'Deploy software',
        'Monitor performance',
      ],
      correctAnswer: 'Validate individual components',
      difficulty: 'easy',
      topic: 'Testing',
      explanation: 'Unit testing verifies each individual part of code behaves correctly.',
    },
    {
      id: '4',
      question:
        'Which design pattern provides a way to access the elements of an aggregate object sequentially?',
      options: ['Iterator', 'Singleton', 'Observer', 'Factory'],
      correctAnswer: 'Iterator',
      difficulty: 'medium',
      topic: 'Design Patterns',
      explanation: 'Iterator lets clients traverse elements without exposing internal structure.',
    },
    {
      id: '5',
      question: 'Which development model delivers software in small incremental releases?',
      options: ['Agile Model', 'Waterfall Model', 'V-Model', 'Spiral Model'],
      correctAnswer: 'Agile Model',
      difficulty: 'hard',
      topic: 'Methodologies',
      explanation: 'Agile emphasizes incremental releases and rapid feedback.',
    },
  ],
  Microprocessor: [
    {
      id: '1',
      question: 'What is the main purpose of a microprocessor register?',
      options: ['Temporarily store data', 'Display output', 'Provide power', 'Control cooling'],
      correctAnswer: 'Temporarily store data',
      difficulty: 'easy',
      topic: 'Registers',
      explanation: 'Registers temporarily hold data and instructions inside the CPU.',
    },
    {
      id: '2',
      question: 'What does an interrupt do?',
      options: [
        'Pause the CPU to handle an event',
        'Increase clock speed',
        'Clear memory',
        'Start the power supply',
      ],
      correctAnswer: 'Pause the CPU to handle an event',
      difficulty: 'medium',
      topic: 'Interrupts',
      explanation: 'Interrupts allow the CPU to stop current work and attend to urgent tasks.',
    },
    {
      id: '3',
      question: 'Which bus carries data between CPU and memory?',
      options: ['Data Bus', 'Address Bus', 'Control Bus', 'Power Bus'],
      correctAnswer: 'Data Bus',
      difficulty: 'easy',
      topic: 'Memory Mapping',
      explanation: 'The data bus transfers actual data between components.',
    },
    {
      id: '4',
      question: 'Which component generates the timing signals for a microprocessor?',
      options: ['Clock Generator', 'Register', 'ALU', 'Decoder'],
      correctAnswer: 'Clock Generator',
      difficulty: 'medium',
      topic: 'Timers',
      explanation: 'The clock generator provides regular pulses to synchronize operations.',
    },
    {
      id: '5',
      question: 'What does the instruction set define?',
      options: [
        'Operations a CPU can perform',
        'Amount of RAM',
        'Display resolution',
        'Network speed',
      ],
      correctAnswer: 'Operations a CPU can perform',
      difficulty: 'hard',
      topic: 'Instruction Set',
      explanation: 'The instruction set specifies the commands the processor understands.',
    },
  ],
};

const SKILL_THRESHOLDS = {
  BEGINNER: { min: 0, max: 40 },
  INTERMEDIATE: { min: 41, max: 70 },
  ADVANCED: { min: 71, max: 100 },
};

function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createGenericQuestion(subject, topic, index) {
  const correctAnswer = `${topic} is a core concept in ${subject}`;
  const options = shuffleArray([
    correctAnswer,
    `A common misconception about ${topic}`,
    `An unrelated idea in ${subject}`,
    `A contrasting concept to ${topic}`,
  ]);

  return {
    id: `${index + 1}`,
    question: `In ${subject}, which statement best describes ${topic}?`,
    options,
    correctAnswer,
    difficulty: index < 2 ? 'easy' : index < 4 ? 'medium' : 'hard',
    topic,
    explanation: `${topic} relates to ${subject} and is fundamental to understanding the subject matter.`,
  };
}

function getFallbackQuestions(subject, numberOfQuestions = 5) {
  const normalized = subject.trim();
  const bank = LOCAL_QUESTION_BANKS[normalized] || [];
  const questions = bank
    .slice(0, numberOfQuestions)
    .map(question => ({ ...question, id: String(question.id) }));
  const topics = SUBJECT_KNOWLEDGE_AREAS[normalized] || ['Core Concept'];
  let index = questions.length;

  while (questions.length < numberOfQuestions) {
    const topic = topics[index % topics.length];
    questions.push(createGenericQuestion(subject, topic, index));
    index += 1;
  }

  return questions;
}

function determineSkillLevel(score) {
  if (score >= SKILL_THRESHOLDS.ADVANCED.min) return 'ADVANCED';
  if (score >= SKILL_THRESHOLDS.INTERMEDIATE.min) return 'INTERMEDIATE';
  return 'BEGINNER';
}

function buildFallbackEvaluation(answers, subject, courseLevel) {
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const recommendedLevel = determineSkillLevel(score);
  const strengths = [...new Set(answers.filter(a => a.isCorrect).map(a => a.topic))].slice(0, 3);
  const weaknesses = [...new Set(answers.filter(a => !a.isCorrect).map(a => a.topic))].slice(0, 3);
  const recommendations = weaknesses.length
    ? weaknesses.map(topic => `Review ${topic} fundamentals and practice additional problems.`)
    : [`Continue building on ${subject} concepts with advanced exercises.`];

  return {
    recommendedLevel,
    score,
    accuracy: score,
    conceptClarity: `The student demonstrates ${recommendedLevel.toLowerCase()} conceptual clarity in ${subject}.`,
    logicalThinking: `Problem solving is ${recommendedLevel.toLowerCase()} based on the current performance.`,
    strengths: strengths.length > 0 ? strengths : ['Core concept understanding'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Review foundational topics'],
    recommendations,
    nextSteps: [
      'Review the weaker topics identified in the assessment.',
      'Practice more questions in the subject area.',
    ],
    learningPath: {
      estimatedHours: Math.max(5, Math.round((100 - score) / 10) * 2),
      focusAreas: weaknesses.length > 0 ? weaknesses : [subject],
      suggestedPace: '2-3 hours per week',
    },
    feedback: `You scored ${score}% on this ${subject} assessment. ${
      weaknesses.length > 0
        ? `Focus on ${weaknesses.join(', ')} to improve your performance.`
        : 'Great work! Keep advancing your practice.'
    }`,
    confidenceScore: Math.min(1, score / 100 + 0.1),
    assessmentSummary: `This assessment places you at the ${recommendedLevel.toLowerCase()} level for ${subject}.`,
  };
}

export const aiService = {
  async generateDynamicTest(subject, numberOfQuestions = 5) {
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
      {\n        "questions": [\n          {\n            "id": 1,\n            "question": "Question text?",\n            "options": ["Option A", "Option B", "Option C", "Option D"],\n            "correctAnswer": "Option A",\n            "difficulty": "easy|medium|hard",\n            "topic": "topic name",\n            "explanation": "Why this is correct"\n          }\n        ],\n        "estimatedCompletionTime": 15,\n        "subject": "${subject}"\n      }
      `;

      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert educational test designer. Generate high-quality prerequisite assessment questions. Always respond with valid JSON only.',
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
      {\n        "recommendedLevel": "BEGINNER|INTERMEDIATE|ADVANCED",\n        "score": ${rawScore},\n        "accuracy": "percentage of correct answers",\n        "conceptClarity": "assessment of how well student understands core concepts",\n        "logicalThinking": "assessment of problem-solving approach",\n        "strengths": ["topic 1", "topic 2"],\n        "weaknesses": ["topic 1", "topic 2"],\n        "recommendations": ["specific learning module 1", "specific learning module 2"],\n        "nextSteps": ["actionable step 1", "actionable step 2"],\n        "learningPath": {\n          "estimatedHours": "20-40 hours",\n          "focusAreas": [],\n          "suggestedPace": "2-3 hours per week"\n        },\n        "feedback": "personalized detailed feedback message",\n        "confidenceScore": 0.85,\n        "assessmentSummary": "overall assessment summary"\n      }
      `;

      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert educational assessment evaluator. Analyze student knowledge with precision and provide detailed, actionable feedback. Always respond with valid JSON only.',
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

  async generateLearningPath(studentProfile, courseId, assessmentResults) {
    try {
      const prompt = `
      Create a HIGHLY PERSONALIZED learning path for a student with:
      
      Student Profile:
      - Current Level: ${studentProfile.skillLevel}
      - Strengths: ${assessmentResults?.strengths?.join(', ') || 'Not yet assessed'}
      - Weaknesses: ${assessmentResults?.weaknesses?.join(', ') || 'Not yet assessed'}
      - Learning Style: ${studentProfile.learningStyle || 'visual and hands-on'}
      - Available Hours Per Week: ${studentProfile.hoursPerWeek || 10}
      
      Assessment Results:
      - Score: ${assessmentResults?.score || 'Not graded'}
      - Confidence: ${assessmentResults?.confidenceScore || 0.5}
      - Recommended Focus Areas: ${assessmentResults?.recommendations?.join(', ') || 'Core concepts'}
      
      Course Context:
      - Course ID: ${courseId}
      - Prerequisites: ${studentProfile.prerequisites?.join(', ') || 'None'}
      
      Design a comprehensive learning path with JSON containing:
      {\n        "estimatedDuration": "hours estimate",\n        "weeklySchedule": {\n          "hoursPerWeek": "number",\n          "sessionsPerWeek": "number"\n        },\n        "phases": [\n          {\n            "phase": 1,\n            "name": "Foundation Building",\n            "duration": "X weeks",\n            "topics": ["topic1"],\n            "activities": ["activity1"]\n          }\n        ],\n        "milestones": ["milestone1"],\n        "resources": {"videos": [], "articles": [], "projects": []},\n        "assessmentStrategy": "detailed strategy",\n        "checkpoints": ["checkpoint1"],\n        "successCriteria": ["criterion1"]\n      }
      `;

      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert in personalized learning path creation. Always respond with valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2500,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const learningPath = JSON.parse(content);

      return {
        ...learningPath,
        generatedFor: {
          skillLevel: studentProfile.skillLevel,
          courseId,
        },
        adaptiveFeatures: {
          canAdjustPace: true,
          canSwapResources: true,
          hasCheckpoints: true,
          progressTracking: true,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate learning path');
    }
  },

  async scoreAssessment(assessment, courseId, subject) {
    if (!process.env.OPENAI_API_KEY) {
      const fallback = buildFallbackEvaluation(assessment, subject, courseId);
      return {
        ...fallback,
        skillLevel: determineSkillLevel(fallback.score),
        subject,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const prompt = `
      Perform comprehensive assessment scoring and feedback generation:
      
      Subject: ${subject || 'General'}
      Course ID: ${courseId}
      Assessment Data: ${JSON.stringify(assessment)}
      
      Analyze the submission for:
      1. ACCURACY: Calculate overall correctness percentage
      2. CONCEPT CLARITY: How well student grasps fundamental concepts
      3. LOGICAL THINKING: Quality of reasoning and problem-solving approach
      
      Provide detailed JSON with:
      {\n        "score": "numeric 0-100",\n        "accuracy": "percentage",\n        "conceptClarity": {\n          "rating": "Poor|Fair|Good|Excellent",\n          "details": "explanation"\n        },\n        "logicalThinking": {\n          "rating": "Poor|Fair|Good|Excellent",\n          "details": "explanation"\n        },\n        "skillLevel": "BEGINNER|INTERMEDIATE|ADVANCED",\n        "strengths": ["demonstrated strength 1", "strength 2"],\n        "weaknesses": ["area for improvement 1", "area 2"],\n        "recommendations": ["specific learning module 1", "module 2"],\n        "nextSteps": ["actionable step 1", "step 2"],\n        "feedback": "comprehensive, encouraging, and actionable feedback",\n        "areasOfExcellence": ["area 1"],\n        "criticalareas": ["area 1"],\n        "estimatedReviewTime": "in hours"\n      }
      `;

      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert educational assessor. Evaluate performance fairly and provide constructive, detailed feedback. Always respond with valid JSON only.',
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
      const result = JSON.parse(content);

      if (result.score >= SKILL_THRESHOLDS.ADVANCED.min) {
        result.skillLevel = 'ADVANCED';
      } else if (result.score >= SKILL_THRESHOLDS.INTERMEDIATE.min) {
        result.skillLevel = 'INTERMEDIATE';
      } else {
        result.skillLevel = 'BEGINNER';
      }

      return {
        ...result,
        skillLevelRange: SKILL_THRESHOLDS[result.skillLevel],
        subject,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      const fallback = buildFallbackEvaluation(assessment, subject, courseId);
      return {
        ...fallback,
        skillLevel: determineSkillLevel(fallback.score),
        subject,
        timestamp: new Date().toISOString(),
      };
    }
  },
};
