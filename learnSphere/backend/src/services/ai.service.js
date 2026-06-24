import axios from 'axios';

// Uses AI_BASE_URL / AI_API_KEY from .env (OpenRouter or any OpenAI-compatible gateway)
const AI_COMPLETIONS_URL =
  `${process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`;

const getAiHeaders = () => ({
  Authorization: `Bearer ${process.env.AI_API_KEY || process.env.OPENAI_API_KEY || ''}`,
  'Content-Type': 'application/json',
  ...(process.env.AI_BASE_URL?.includes('openrouter.ai')
    ? { 'HTTP-Referer': 'https://learnsphere.app', 'X-Title': 'LearnSphere' }
    : {}),
});

const getAiModel = () =>
  process.env.AI_CHAT_MODEL || process.env.OPENAI_MODEL || 'deepseek/deepseek-chat';

const isAiEnabled = () => Boolean(process.env.AI_API_KEY || process.env.OPENAI_API_KEY);

// Subject-specific knowledge baselines
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
  'Humanity and Social Science': [
    'Ethics and Society',
    'Critical Thinking',
    'Cultural Awareness',
    'Civic Responsibility',
    'Communication and Collaboration',
  ],
  'Elective V': [
    'Advanced Elective Concepts',
    'Applied Project Work',
    'Domain Specialization',
    'Industry Tools',
    'Innovation and Research',
  ],
  'Elective VI': [
    'Capstone Elective Concepts',
    'Research and Innovation',
    'Interdisciplinary Applications',
    'Product Development',
    'Professional Practice',
  ],
};

// Subject labels expected in the student Courses section.
const STUDENT_COURSE_SUBJECTS = [
  'Discrete Mathematics',
  'Fundamentals of Data Structures',
  'Object Oriented Programming (OOP)',
  'Computer Graphics',
  'Digital Electronics and Logic Design',
  'Business Communication Skills',
  'Engineering Mathematics III',
  'Data Structures and Algorithms',
  'Software Engineering',
  'Microprocessor',
  'Principles of Programming Languages',
  'Humanity and Social Science',
  'Database Management Systems (DBMS)',
  'Theory of Computation (TOC)',
  'Systems Programming and Operating System (SPOS)',
  'Computer Networks and Security (CNS)',
  'Elective I',
  'Design and Analysis of Algorithms (DAA)',
  'Artificial Intelligence (AI)',
  'Web Technology (WT)',
  'Data Analytics (DA)',
  'Elective II',
  'Machine Learning (ML)',
  'Blockchain Technology',
  'Elective III',
  'Elective IV',
  'Project Phase I',
  'Elective V',
  'Elective VI',
];

// Normalize legacy labels to the names requested in the UI.
const SUBJECT_ALIAS_TO_BASE = {
  'Database Management Systems (DBMS)': 'Database Management Systems',
  'Theory of Computation (TOC)': 'Theory of Computation',
  'Systems Programming and Operating System (SPOS)': 'Systems Programming & Operating System',
  'Computer Networks and Security (CNS)': 'Computer Networks & Security',
  'Elective I': 'Elective I (Data Science / AI etc.)',
  'Design and Analysis of Algorithms (DAA)': 'Design & Analysis of Algorithms',
  'Artificial Intelligence (AI)': 'Artificial Intelligence',
  'Web Technology (WT)': 'Web Technology',
  'Data Analytics (DA)': 'Data Analytics',
  'Machine Learning (ML)': 'Machine Learning',
};

Object.entries(SUBJECT_ALIAS_TO_BASE).forEach(([alias, base]) => {
  if (!SUBJECT_KNOWLEDGE_AREAS[alias] && SUBJECT_KNOWLEDGE_AREAS[base]) {
    SUBJECT_KNOWLEDGE_AREAS[alias] = [...SUBJECT_KNOWLEDGE_AREAS[base]];
  }
});

const LOCAL_QUESTION_BANKS = {
  'Engineering Mathematics III': [
    {
      id: '1',
      question:
        'Which matrix operation is used to solve linear equations using determinant ratios?',
      options: ['Cramerâ€™s Rule', 'Gaussian Elimination', 'Matrix Inversion', 'LU Decomposition'],
      correctAnswer: 'Cramerâ€™s Rule',
      difficulty: 'easy',
      topic: 'Matrices',
      explanation: 'Cramerâ€™s Rule uses determinants to solve systems of linear equations.',
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
      options: ['Dijkstraâ€™s Algorithm', 'Bubble Sort', 'Depth-first Search', 'Kruskalâ€™s Algorithm'],
      correctAnswer: 'Dijkstraâ€™s Algorithm',
      difficulty: 'medium',
      topic: 'Graph Algorithms',
      explanation: 'Dijkstraâ€™s algorithm finds shortest paths in graphs with non-negative weights.',
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

// Skill level thresholds
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

function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickVariant(key, modulo) {
  if (modulo <= 0) return 0;
  return hashString(String(key)) % modulo;
}

/** Scenario-style MCQs: different stems and distractors each session â€” not reordering one template. */
function createDiverseTemplateQuestion(subject, topic, slotIndex, sessionSalt) {
  const key = `${sessionSalt}|${subject}|${topic}|${slotIndex}`;

  const stems = [
    (s, t) =>
      `In ${s}, you are asked to show prerequisite understanding of "${t}". Which response best matches standard course expectations?`,
    (s, t) =>
      `Before advancing in ${s}, a short check focuses on "${t}". Which option shows the clearest grasp of that topic?`,
    (s, t) =>
      `A study partner mixes up nearby ideas around "${t}" in ${s}. Which line would you give to correct the misunderstanding?`,
    (s, t) =>
      `Which statement about "${t}" (as taught in introductory ${s}) is the most accurate for placement purposes?`,
    (s, t) =>
      `In ${s}, which practical consequence depends on correctly applying "${t}" at a prerequisite level?`,
    (s, t) =>
      `Which choice best distinguishes "${t}" from loosely related buzzwords that often appear in ${s} discussions?`,
    (s, t) =>
      `A five-minute warm-up quiz in ${s} targets "${t}". Which answer would instructors treat as solid evidence of readiness?`,
    (s, t) =>
      `Which option correctly situates "${t}" within the prerequisite map for ${s} (what you must know before harder modules)?`,
  ];

  const correctBank = [
    (s, t) => `Accurately reflects how "${t}" is defined and used in core ${s} curricula.`,
    (s, t) => `Matches the standard textbook-level explanation of "${t}" in ${s}.`,
    (s, t) => `States "${t}" in a way that is consistent with typical lecture notes for ${s}.`,
    (s, t) => `Captures the usual learning objectives associated with "${t}" in ${s}.`,
  ];

  const distractorBanks = [
    [
      (s, t) => `Treats "${t}" as optional trivia rather than a prerequisite idea in ${s}.`,
      (s, t) => `Imports jargon from a different field and pretends it defines "${t}" in ${s}.`,
      (s, t) => `Reverses the normal dependency: claims advanced ${s} topics justify ignoring "${t}".`,
    ],
    [
      (s, t) => `Overstates "${t}" so that it supposedly replaces unrelated fundamentals in ${s}.`,
      (s, t) => `Describes a common exam myth about "${t}" that contradicts introductory ${s}.`,
      (s, t) => `Confuses "${t}" with a similarly named but unrelated concept in ${s}.`,
    ],
    [
      (s, t) => `Frames "${t}" only as memorized vocabulary without operational meaning in ${s}.`,
      (s, t) => `Claims "${t}" is irrelevant until final-year ${s} (contrary to prerequisite design).`,
      (s, t) => `Blurs "${t}" with implementation details that belong to a different topic in ${s}.`,
    ],
    [
      (s, t) => `Uses "${t}" only as a label for "anything technical" in ${s}.`,
      (s, t) => `Attributes outcomes to "${t}" that actually follow from a different mechanism in ${s}.`,
      (s, t) => `Suggests "${t}" contradicts other basics that must coexist in ${s}.`,
    ],
  ];

  const stemFn = stems[pickVariant(`${key}|stem`, stems.length)];
  const correctFn = correctBank[pickVariant(`${key}|ok`, correctBank.length)];
  const distractorSet = distractorBanks[pickVariant(`${key}|bad`, distractorBanks.length)];

  const question = stemFn(subject, topic);
  const correctAnswer = correctFn(subject, topic);
  const distractors = distractorSet.map(fn => fn(subject, topic));
  const options = shuffleArray([correctAnswer, ...distractors]);

  const diffPool = ['easy', 'medium', 'hard'];
  const difficulty = diffPool[pickVariant(`${key}|d`, diffPool.length)];

  return {
    id: String(slotIndex + 1),
    question,
    options,
    correctAnswer,
    difficulty,
    topic,
    explanation: `For ${subject}, "${topic}" is being checked with a fresh scenario-style stem; the correct option aligns with how that topic is normally introduced and assessed before harder material.`,
  };
}

function topicMatchesWeak(topicLabel, weakPhrase) {
  const t = String(topicLabel || '').toLowerCase();
  const w = String(weakPhrase || '').toLowerCase().trim();
  if (!t || !w) return false;
  return t.includes(w) || w.includes(t);
}

function buildTopicQueueForFallback(weakTopicsRaw, normalized) {
  const baseTopics = SUBJECT_KNOWLEDGE_AREAS[normalized] || ['Core Concept'];
  const queue = [];
  const seenLower = new Set();

  const pushUnique = label => {
    const s = String(label).trim();
    if (!s) return;
    const k = s.toLowerCase();
    if (seenLower.has(k)) return;
    seenLower.add(k);
    queue.push(s);
  };

  for (const raw of weakTopicsRaw) {
    const w = String(raw).trim();
    if (!w) continue;
    const wl = w.toLowerCase();
    const syllabusHit = baseTopics.find(bt => topicMatchesWeak(bt, wl));
    if (syllabusHit) pushUnique(syllabusHit);
    else pushUnique(w);
  }

  for (const bt of baseTopics) pushUnique(bt);

  return queue.length > 0 ? queue : baseTopics;
}

function getFallbackQuestions(subject, numberOfQuestions = 5, options = {}) {
  const weakTopicsRaw = Array.isArray(options.weakTopics)
    ? options.weakTopics.map(t => String(t).trim()).filter(Boolean)
    : [];
  const sessionSalt =
    options.sessionSalt || `fb-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const normalized = subject.trim();
  const topicQueue = buildTopicQueueForFallback(weakTopicsRaw, normalized);

  if (weakTopicsRaw.length > 0) {
    const picked = [];
    for (let i = 0; i < numberOfQuestions; i += 1) {
      const topic = topicQueue[i % topicQueue.length];
      picked.push(createDiverseTemplateQuestion(subject, topic, i, sessionSalt));
    }
    return picked.map((q, i) => ({ ...q, id: String(i + 1) }));
  }

  const bank = (LOCAL_QUESTION_BANKS[normalized] || []).map(q => ({ ...q, id: String(q.id) }));
  const rotate = pickVariant(sessionSalt, Math.max(1, bank.length));
  const rotated = [...bank.slice(rotate), ...bank.slice(0, rotate)];
  const shuffledBank = shuffleArray(rotated);

  const picked = [];
  const seenKeys = new Set();
  for (const q of shuffledBank) {
    if (picked.length >= numberOfQuestions) break;
    const dedupe = `${q.question}|${q.correctAnswer}`;
    if (seenKeys.has(dedupe)) continue;
    seenKeys.add(dedupe);
    picked.push({ ...q, id: String(picked.length + 1) });
  }

  const breadthTopics = shuffleArray(SUBJECT_KNOWLEDGE_AREAS[normalized] || ['Core Concept']);
  let idx = picked.length;
  while (picked.length < numberOfQuestions) {
    const topic = breadthTopics[idx % breadthTopics.length];
    picked.push(createDiverseTemplateQuestion(subject, topic, idx, sessionSalt));
    idx += 1;
  }

  return picked.map((q, i) => ({ ...q, id: String(i + 1) }));
}

function normalizeTopicList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(v => String(v).trim()).filter(Boolean))].slice(0, 20);
}

function determineSkillLevel(score) {
  if (score >= SKILL_THRESHOLDS.ADVANCED.min) {
    return 'ADVANCED';
  }
  if (score >= SKILL_THRESHOLDS.INTERMEDIATE.min) {
    return 'INTERMEDIATE';
  }
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
  getSupportedSubjects() {
    return STUDENT_COURSE_SUBJECTS.map(subject => {
      const topics = SUBJECT_KNOWLEDGE_AREAS[subject] || [];
      return {
        name: subject,
        topicsCount: topics.length,
        topicPreview: topics.slice(0, 3),
      };
    });
  },

  async generateDynamicTest(subject, numberOfQuestions = 5, personalization = {}) {
    const weakTopics = Array.isArray(personalization.weakTopics)
      ? personalization.weakTopics.map(t => String(t).trim()).filter(Boolean).slice(0, 12)
      : [];
    const sessionSalt =
      typeof personalization.sessionSalt === 'string' && personalization.sessionSalt.length > 0
        ? personalization.sessionSalt
        : `openai-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    const personalizationBlock =
      weakTopics.length > 0
        ? `
Personalization (required â€” this student already took ${subject} assessments and struggled with specific areas):
- Weak / low-confidence topics to remediate: ${weakTopics.join('; ')}
- At least ${Math.max(2, Math.ceil(numberOfQuestions * 0.6))} of the ${numberOfQuestions} questions MUST directly assess those weak topics.
- Each such question's "topic" field must name the weak area it targets.
- Remaining questions: other prerequisite breadth within ${subject}.
`
        : '';

    if (!isAiEnabled()) {
      return {
        success: true,
        questions: getFallbackQuestions(subject, numberOfQuestions, { weakTopics, sessionSalt }),
        estimatedCompletionTime: Math.max(10, numberOfQuestions * 3),
        subject,
      };
    }

    try {
      const prompt = `
Generate a comprehensive prerequisite assessment test for ${subject}.

Instance identifier (vary scenarios, names, numbers, and framing using this â€” do NOT produce the same paper as a generic template): ${sessionSalt}

Anti-reuse rules:
- Every question must be a distinct scenario, comparison, or application â€” not a trivial reorder of "which defines X".
- Do not copy well-known textbook drill stems verbatim; rephrase and embed each idea in a short context (one or two sentences max).
- Wrong options must be plausible mistakes a student makes in ${subject}, not nonsense.

Requirements:
- Create ${numberOfQuestions} multiple-choice questions
- Questions should progress from basic to intermediate difficulty
- Each question should test core concepts
- Include 4 options per question with only 1 correct answer
- Overall syllabus context: ${SUBJECT_KNOWLEDGE_AREAS[subject] || 'core concepts'}
${personalizationBlock}
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
        AI_COMPLETIONS_URL,
        {
          model: getAiModel(),
          messages: [
            {
              role: 'system',
              content:
                'You are an expert educational test designer. Produce a genuinely new exam each time: different scenarios, contexts, and distractors â€” never shuffle the same stems. Wrong answers must be plausible student errors. Always respond with valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: weakTopics.length > 0 ? 0.82 : 0.72,
          max_tokens: 2000,
        },
        {
          headers: {
            ...getAiHeaders(),
            
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const testData = JSON.parse(content);
      const questions = (testData.questions || []).map((q, i) => ({
        ...q,
        id: String(q.id != null ? q.id : i + 1),
      }));
      return {
        success: true,
        questions,
        estimatedCompletionTime: testData.estimatedCompletionTime,
        subject,
      };
    } catch (error) {
      console.error('Dynamic Test Generation Error:', error);
      return {
        success: false,
        questions: getFallbackQuestions(subject, numberOfQuestions, { weakTopics, sessionSalt }),
        estimatedCompletionTime: Math.max(10, numberOfQuestions * 3),
        subject,
        fallback: true,
        error: error.message,
      };
    }
  },

  async evaluatePrerequisites(answers, subject, courseLevel) {
    if (!isAiEnabled()) {
      return buildFallbackEvaluation(answers, subject, courseLevel);
    }

    try {
      // Calculate raw score
      const totalQuestions = answers.length;
      const correctAnswers = answers.filter(a => a.isCorrect).length;
      const rawScore = (correctAnswers / totalQuestions) * 100;

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
          "estimatedHours": 20-40 number,
          "focusAreas": [],
          "suggestedPace": "2-3 hours per week"
        },
        "feedback": "personalized detailed feedback message",
        "confidenceScore": 0.85,
        "assessmentSummary": "overall assessment summary"
      }
      `;

      const response = await axios.post(
        AI_COMPLETIONS_URL,
        {
          model: getAiModel(),
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
            ...getAiHeaders(),
            
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const evaluation = JSON.parse(content);

      // Validate and normalize skill level
      const score = evaluation.score || rawScore;
      let recommendedLevel = evaluation.recommendedLevel || 'BEGINNER';

      // Ensure skill level matches score
      if (score >= SKILL_THRESHOLDS.ADVANCED.min) {
        recommendedLevel = 'ADVANCED';
      } else if (score >= SKILL_THRESHOLDS.INTERMEDIATE.min) {
        recommendedLevel = 'INTERMEDIATE';
      } else {
        recommendedLevel = 'BEGINNER';
      }

      return {
        ...evaluation,
        weaknesses: normalizeTopicList(evaluation.weaknesses),
        strengths: normalizeTopicList(evaluation.strengths),
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
      {
        "estimatedDuration": hours estimate,
        "weeklySchedule": {
          "hoursPerWeek": number,
          "sessionsPerWeek": number
        },
        "phases": [
          {
            "phase": 1,
            "name": "Foundation Building",
            "duration": "X weeks",
            "topics": ["topic1"],
            "activities": ["activity1"]
          }
        ],
        "milestones": ["milestone1"],
        "resources": {"videos": [], "articles": [], "projects": []},
        "assessmentStrategy": "detailed strategy",
        "checkpoints": ["checkpoint1"],
        "successCriteria": ["criterion1"]
      }
      `;

      const response = await axios.post(
        AI_COMPLETIONS_URL,
        {
          model: getAiModel(),
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
            ...getAiHeaders(),
            
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const learningPath = JSON.parse(content);

      return {
        ...learningPath,
        generatedFor: {
          skillLevel: studentProfile.skillLevel,
          courseId: courseId,
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
    if (!isAiEnabled()) {
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
      {
        "score": numeric 0-100,
        "accuracy": percentage,
        "conceptClarity": {
          "rating": "Poor|Fair|Good|Excellent",
          "details": "explanation"
        },
        "logicalThinking": {
          "rating": "Poor|Fair|Good|Excellent",
          "details": "explanation"
        },
        "skillLevel": "BEGINNER|INTERMEDIATE|ADVANCED",
        "strengths": ["demonstrated strength 1", "strength 2"],
        "weaknesses": ["area for improvement 1", "area 2"],
        "recommendations": ["specific learning module 1", "module 2"],
        "nextSteps": ["actionable step 1", "step 2"],
        "feedback": "comprehensive, encouraging, and actionable feedback",
        "areasOfExcellence": ["area 1"],
        "criticalareas": ["area 1"],
        "estimatedReviewTime": "in hours"
      }
      `;

      const response = await axios.post(
        AI_COMPLETIONS_URL,
        {
          model: getAiModel(),
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
            ...getAiHeaders(),
            
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const result = JSON.parse(content);

      // Normalise skill level based on numeric score
      const score = typeof result.score === 'number' ? result.score : parseFloat(result.score) || 0;
      if (score >= SKILL_THRESHOLDS.ADVANCED.min) {
        result.skillLevel = 'ADVANCED';
      } else if (score >= SKILL_THRESHOLDS.INTERMEDIATE.min) {
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

