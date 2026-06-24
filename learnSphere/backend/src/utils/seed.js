import mongoose from 'mongoose';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import QuestionBank from '../models/QuestionBank.js';
import Test from '../models/Test.js';
import { authService } from '../services/auth.service.js';

const SEED_USERS = [
  {
    email: 'student@example.com',
    password: 'Student@123',
    firstName: 'John',
    lastName: 'Student',
    role: 'STUDENT',
  },
  {
    email: 'instructor@example.com',
    password: 'Instructor@123',
    firstName: 'Jane',
    lastName: 'Instructor',
    role: 'INSTRUCTOR',
  },
  {
    email: 'admin@example.com',
    password: 'Admin@123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
  },
];

const SAMPLE_COURSES = [
  {
    title: 'Discrete Mathematics',
    shortDescription: 'Foundational mathematical concepts for computer science.',
    description: 'Learn sets, logic, combinatorics, graph theory, and mathematical proofs essential for algorithmic thinking.',
    category: 'Computer Science',
    level: 'INTERMEDIATE',
    topics: [
      {
        title: 'Sets and Set Theory',
        description: 'Understanding sets, subsets, unions, intersections, and set operations.',
        notes: 'Sets are fundamental collections in mathematics. Learn about Venn diagrams, De Morgan laws, and set algebra.',
        studyMaterial: 'Practice set operations using Python sets. Solve problems involving unions, intersections, and complements.',
        pdfUrl: 'https://www.geeksforgeeks.org/discrete-mathematics-set-theory/',
        resources: [
          { title: 'Set Theory Basics', url: 'https://www.geeksforgeeks.org/discrete-mathematics-set-theory/', type: 'Reference' },
        ],
      },
      {
        title: 'Logic and Propositions',
        description: 'Propositional logic, truth tables, and logical equivalence.',
        notes: 'Understand logical operators, implications, and quantifiers. Learn to construct truth tables and prove logical statements.',
        studyMaterial: 'Build truth tables for compound propositions. Practice logical equivalences and proof techniques.',
        resources: [
          { title: 'Propositional Logic', url: 'https://www.geeksforgeeks.org/discrete-mathematics-propositional-logic/', type: 'Reference' },
        ],
      },
      {
        title: 'Combinatorics',
        description: 'Permutations, combinations, and counting principles.',
        notes: 'Master the fundamental counting principle, permutations, combinations, and the pigeonhole principle.',
        studyMaterial: 'Solve counting problems using permutations and combinations. Apply the inclusion-exclusion principle.',
        resources: [
          { title: 'Combinatorics', url: 'https://www.geeksforgeeks.org/discrete-mathematics-combinatorics/', type: 'Reference' },
        ],
      },
      {
        title: 'Graph Theory',
        description: 'Graphs, paths, cycles, trees, and graph algorithms.',
        notes: 'Study graph representations, BFS, DFS, shortest paths, and minimum spanning trees.',
        studyMaterial: 'Implement graph traversal algorithms. Solve problems using Dijkstra and Prim algorithms.',
        resources: [
          { title: 'Graph Theory', url: 'https://www.geeksforgeeks.org/graph-theory/', type: 'Reference' },
        ],
      },
    ],
  },
  {
    title: 'Data Structures and Algorithms',
    shortDescription: 'Master fundamental data structures and algorithm design.',
    description: 'Learn arrays, linked lists, trees, graphs, sorting, searching, and algorithm analysis techniques.',
    category: 'Computer Science',
    level: 'INTERMEDIATE',
    topics: [
      {
        title: 'Arrays and Linked Lists',
        description: 'Array operations, linked list implementation, and memory management.',
        notes: 'Understand array indexing, dynamic arrays, singly and doubly linked lists with practical implementations.',
        studyMaterial: 'Implement linked list operations in your preferred language. Compare array vs linked list performance.',
        resources: [
          { title: 'Linked List', url: 'https://www.geeksforgeeks.org/data-structures/linked-list/', type: 'Reference' },
        ],
      },
      {
        title: 'Stacks and Queues',
        description: 'LIFO and FIFO data structures with applications.',
        notes: 'Learn stack operations (push, pop, peek) and queue operations (enqueue, dequeue). Understand their use cases.',
        studyMaterial: 'Implement stack using arrays and linked list. Build a queue using two stacks.',
        resources: [
          { title: 'Stack Data Structure', url: 'https://www.geeksforgeeks.org/stack-data-structure/', type: 'Reference' },
        ],
      },
      {
        title: 'Trees and Binary Search Trees',
        description: 'Tree traversal, BST operations, and balanced trees.',
        notes: 'Master inorder, preorder, postorder traversals. Learn BST insertion, deletion, and AVL trees.',
        studyMaterial: 'Implement a binary search tree with all operations. Practice tree traversal algorithms.',
        resources: [
          { title: 'Binary Search Tree', url: 'https://www.geeksforgeeks.org/binary-search-tree-data-structure/', type: 'Reference' },
        ],
      },
      {
        title: 'Sorting Algorithms',
        description: 'Bubble sort, merge sort, quick sort, and complexity analysis.',
        notes: 'Understand sorting algorithms, their time complexity, and when to use each one.',
        studyMaterial: 'Implement merge sort and quick sort. Compare their performance on different datasets.',
        resources: [
          { title: 'Sorting Algorithms', url: 'https://www.geeksforgeeks.org/sorting-algorithms/', type: 'Reference' },
        ],
      },
    ],
  },
  {
    title: 'Computer Organization and Architecture',
    shortDescription: 'Understanding computer systems at the hardware level.',
    description: 'Learn about CPU design, memory hierarchy, instruction sets, and computer arithmetic.',
    category: 'Computer Science',
    level: 'INTERMEDIATE',
    topics: [
      {
        title: 'Number Systems and Computer Arithmetic',
        description: 'Binary, hexadecimal, and arithmetic operations.',
        notes: 'Master binary, octal, hexadecimal conversions. Learn signed numbers, complements, and floating-point representation.',
        studyMaterial: 'Practice number system conversions. Implement binary arithmetic operations.',
        resources: [
          { title: 'Number Systems', url: 'https://www.geeksforgeeks.org/number-system-and-its-conversions/', type: 'Reference' },
        ],
      },
      {
        title: 'CPU Architecture',
        description: 'Processor design, registers, ALU, and control unit.',
        notes: 'Understand von Neumann architecture, instruction cycles, pipelining, and RISC vs CISC.',
        studyMaterial: 'Study CPU instruction cycle. Compare different processor architectures.',
        resources: [
          { title: 'CPU Architecture', url: 'https://www.geeksforgeeks.org/computer-organization-and-architecture/', type: 'Reference' },
        ],
      },
      {
        title: 'Memory Organization',
        description: 'Cache memory, virtual memory, and memory management.',
        notes: 'Learn about cache hierarchy, mapping techniques, virtual memory, and paging.',
        studyMaterial: 'Understand cache hit/miss ratios. Study virtual memory and page replacement algorithms.',
        resources: [
          { title: 'Memory Hierarchy', url: 'https://www.geeksforgeeks.org/computer-memory/', type: 'Reference' },
        ],
      },
      {
        title: 'Instruction Set Architecture',
        description: 'Instruction formats, addressing modes, and assembly language.',
        notes: 'Study instruction formats, addressing modes, and basic assembly programming concepts.',
        studyMaterial: 'Write simple assembly programs. Understand different addressing modes.',
        resources: [
          { title: 'Instruction Set', url: 'https://www.geeksforgeeks.org/instruction-set/', type: 'Reference' },
        ],
      },
    ],
  },
  {
    title: 'Object Oriented Programming',
    shortDescription: 'Master OOP principles and design patterns.',
    description: 'Learn classes, objects, inheritance, polymorphism, encapsulation, and SOLID principles.',
    category: 'Programming',
    level: 'INTERMEDIATE',
    topics: [
      {
        title: 'Classes and Objects',
        description: 'Understanding class structure, object creation, and constructors.',
        notes: 'Learn about class definition, object instantiation, constructors, and destructors.',
        studyMaterial: 'Create classes with properties and methods. Practice object initialization and usage.',
        resources: [
          { title: 'OOP Basics', url: 'https://www.geeksforgeeks.org/object-oriented-programming-in-python/', type: 'Reference' },
        ],
      },
      {
        title: 'Inheritance',
        description: 'Single, multiple inheritance, and method overriding.',
        notes: 'Understand parent-child relationships, method overriding, and the super keyword.',
        studyMaterial: 'Implement inheritance hierarchies. Practice method overriding and super calls.',
        resources: [
          { title: 'Inheritance', url: 'https://www.geeksforgeeks.org/inheritance-in-python/', type: 'Reference' },
        ],
      },
      {
        title: 'Polymorphism',
        description: 'Method overloading, overriding, and dynamic binding.',
        notes: 'Learn about compile-time and runtime polymorphism, abstract classes, and interfaces.',
        studyMaterial: 'Implement polymorphic behavior. Practice abstract classes and interfaces.',
        resources: [
          { title: 'Polymorphism', url: 'https://www.geeksforgeeks.org/polymorphism-in-python/', type: 'Reference' },
        ],
      },
      {
        title: 'Encapsulation and Abstraction',
        description: 'Data hiding, access modifiers, and abstract classes.',
        notes: 'Understand access control, getters/setters, and abstraction principles.',
        studyMaterial: 'Implement encapsulation with private members. Create abstract classes and interfaces.',
        resources: [
          { title: 'Encapsulation', url: 'https://www.geeksforgeeks.org/encapsulation-in-python/', type: 'Reference' },
        ],
      },
    ],
  },
  {
    title: 'Computer Graphics',
    shortDescription: 'Learn to create visual content using algorithms.',
    description: 'Study raster graphics, geometric transformations, 3D rendering, and graphics programming.',
    category: 'Computer Science',
    level: 'ADVANCED',
    topics: [
      {
        title: 'Introduction to Graphics',
        description: 'Raster vs vector graphics, display devices, and color models.',
        notes: 'Understand pixel-based graphics, vector graphics, RGB color model, and display technologies.',
        studyMaterial: 'Experiment with different color models. Compare raster and vector graphics.',
        resources: [
          { title: 'Graphics Basics', url: 'https://www.geeksforgeeks.org/computer-graphics/', type: 'Reference' },
        ],
      },
      {
        title: 'Line and Circle Drawing',
        description: 'Bresenham algorithm, DDA algorithm, and circle drawing.',
        notes: 'Learn line drawing algorithms, circle drawing algorithms, and their implementations.',
        studyMaterial: 'Implement Bresenham line algorithm. Practice circle drawing algorithms.',
        resources: [
          { title: 'Line Drawing', url: 'https://www.geeksforgeeks.org/dda-line-generation-algorithm-computer-graphics/', type: 'Reference' },
        ],
      },
      {
        title: '2D Transformations',
        description: 'Translation, rotation, scaling, and shearing.',
        notes: 'Master 2D transformation matrices, homogeneous coordinates, and composite transformations.',
        studyMaterial: 'Implement 2D transformations. Practice matrix operations for graphics.',
        resources: [
          { title: '2D Transformations', url: 'https://www.geeksforgeeks.org/2d-transformation-in-computer-graphics/', type: 'Reference' },
        ],
      },
      {
        title: '3D Graphics and Rendering',
        description: '3D transformations, projections, and rendering pipeline.',
        notes: 'Learn 3D coordinate systems, viewing transformations, and basic rendering concepts.',
        studyMaterial: 'Implement 3D transformations. Study projection techniques.',
        resources: [
          { title: '3D Graphics', url: 'https://www.geeksforgeeks.org/3d-computer-graphics/', type: 'Reference' },
        ],
      },
    ],
  },
  {
    title: 'Database Management Systems',
    shortDescription: 'Master database design, SQL, and database administration.',
    description: 'Learn ER models, relational algebra, SQL, normalization, and transaction management.',
    category: 'Computer Science',
    level: 'INTERMEDIATE',
    topics: [
      {
        title: 'Introduction to Databases',
        description: 'Database concepts, DBMS vs file systems, and database architecture.',
        notes: 'Understand what databases are, why we need them, and different database models.',
        studyMaterial: 'Compare file-based storage vs database systems. Study different database models.',
        resources: [
          { title: 'DBMS Basics', url: 'https://www.geeksforgeeks.org/database-management-system-dbms/', type: 'Reference' },
        ],
      },
      {
        title: 'ER Modeling',
        description: 'Entity-Relationship diagrams, entities, attributes, and relationships.',
        notes: 'Learn to create ER diagrams, understand cardinality, and map ER to relational schema.',
        studyMaterial: 'Design ER diagrams for real-world scenarios. Practice mapping to relational tables.',
        resources: [
          { title: 'ER Model', url: 'https://www.geeksforgeeks.org/entity-relationship-model/', type: 'Reference' },
        ],
      },
      {
        title: 'SQL Fundamentals',
        description: 'SELECT, INSERT, UPDATE, DELETE, and complex queries.',
        notes: 'Master SQL DML operations, joins, subqueries, and aggregate functions.',
        studyMaterial: 'Write complex SQL queries. Practice joins and subqueries.',
        resources: [
          { title: 'SQL Basics', url: 'https://www.geeksforgeeks.org/sql-tutorial/', type: 'Reference' },
        ],
      },
      {
        title: 'Normalization',
        description: 'First, second, third normal forms and BCNF.',
        notes: 'Understand normalization principles, functional dependencies, and normal forms.',
        studyMaterial: 'Normalize database tables to 3NF. Practice identifying functional dependencies.',
        resources: [
          { title: 'Normalization', url: 'https://www.geeksforgeeks.org/normalization-in-dbms/', type: 'Reference' },
        ],
      },
    ],
  },
  {
    title: 'Computer Networks',
    shortDescription: 'Understand network protocols, architecture, and security.',
    description: 'Learn OSI model, TCP/IP, routing, switching, and network security fundamentals.',
    category: 'Computer Science',
    level: 'INTERMEDIATE',
    topics: [
      {
        title: 'Network Fundamentals',
        description: 'OSI model, TCP/IP stack, and network topologies.',
        notes: 'Understand the 7-layer OSI model, TCP/IP protocol suite, and different network topologies.',
        studyMaterial: 'Study OSI layer functions. Compare different network topologies.',
        resources: [
          { title: 'OSI Model', url: 'https://www.geeksforgeeks.org/osi-model/', type: 'Reference' },
        ],
      },
      {
        title: 'IP Addressing and Subnetting',
        description: 'IPv4, IPv6, subnet masks, and CIDR notation.',
        notes: 'Master IP address classes, subnetting techniques, and CIDR notation.',
        studyMaterial: 'Practice subnetting problems. Calculate network addresses and broadcast addresses.',
        resources: [
          { title: 'IP Addressing', url: 'https://www.geeksforgeeks.org/ip-addressing/', type: 'Reference' },
        ],
      },
      {
        title: 'Routing Protocols',
        description: 'Static routing, RIP, OSPF, and BGP.',
        notes: 'Learn about routing algorithms, distance vector and link-state protocols.',
        studyMaterial: 'Configure static routes. Study routing protocol comparison.',
        resources: [
          { title: 'Routing Protocols', url: 'https://www.geeksforgeeks.org/routing-protocols/', type: 'Reference' },
        ],
      },
      {
        title: 'Network Security',
        description: 'Firewalls, VPNs, encryption, and security protocols.',
        notes: 'Understand network security threats, encryption, SSL/TLS, and firewall concepts.',
        studyMaterial: 'Study common network attacks. Learn about SSL/TLS handshake.',
        resources: [
          { title: 'Network Security', url: 'https://www.geeksforgeeks.org/network-security/', type: 'Reference' },
        ],
      },
    ],
  },
  {
    title: 'Software Engineering and Project Management',
    shortDescription: 'Learn software development methodologies and project management.',
    description: 'Study SDLC, agile methodologies, testing, requirements engineering, and project planning.',
    category: 'Software Engineering',
    level: 'INTERMEDIATE',
    topics: [
      {
        title: 'Software Development Life Cycle',
        description: 'Waterfall, spiral, and agile methodologies.',
        notes: 'Understand different SDLC models, their phases, advantages, and disadvantages.',
        studyMaterial: 'Compare waterfall vs agile methodologies. Study SDLC phases in detail.',
        resources: [
          { title: 'SDLC Models', url: 'https://www.geeksforgeeks.org/software-development-life-cycle-sdlc/', type: 'Reference' },
        ],
      },
      {
        title: 'Requirements Engineering',
        description: 'Requirements gathering, analysis, and specification.',
        notes: 'Learn about functional and non-functional requirements, SRS documents, and requirement validation.',
        studyMaterial: 'Create sample SRS documents. Practice requirement elicitation techniques.',
        resources: [
          { title: 'Requirements Engineering', url: 'https://www.geeksforgeeks.org/software-requirements-specification-srs/', type: 'Reference' },
        ],
      },
      {
        title: 'Software Testing',
        description: 'Unit testing, integration testing, system testing, and test cases.',
        notes: 'Understand testing levels, black-box and white-box testing, and test case design.',
        studyMaterial: 'Write unit tests for sample code. Design test cases for given requirements.',
        resources: [
          { title: 'Software Testing', url: 'https://www.geeksforgeeks.org/software-testing/', type: 'Reference' },
        ],
      },
      {
        title: 'Project Management',
        description: 'Project planning, scheduling, risk management, and estimation.',
        notes: 'Learn project planning techniques, Gantt charts, critical path method, and risk assessment.',
        studyMaterial: 'Create project schedules. Practice effort estimation techniques.',
        resources: [
          { title: 'Project Management', url: 'https://www.geeksforgeeks.org/software-project-management/', type: 'Reference' },
        ],
      },
    ],
  },
  {
    title: 'Machine Learning',
    shortDescription: 'Introduction to ML algorithms and practical applications.',
    description: 'Learn supervised learning, unsupervised learning, model evaluation, and popular ML algorithms.',
    category: 'Artificial Intelligence',
    level: 'ADVANCED',
    topics: [
      {
        title: 'Introduction to Machine Learning',
        description: 'ML types, applications, and basic concepts.',
        notes: 'Understand supervised vs unsupervised learning, regression vs classification, and ML workflow.',
        studyMaterial: 'Study ML use cases. Understand the machine learning pipeline.',
        resources: [
          { title: 'ML Basics', url: 'https://www.geeksforgeeks.org/machine-learning/', type: 'Reference' },
        ],
      },
      {
        title: 'Linear Regression',
        description: 'Simple and multiple linear regression, gradient descent.',
        notes: 'Learn linear regression, cost function, gradient descent, and model evaluation metrics.',
        studyMaterial: 'Implement linear regression from scratch. Practice with scikit-learn.',
        resources: [
          { title: 'Linear Regression', url: 'https://www.geeksforgeeks.org/linear-regression/', type: 'Reference' },
        ],
      },
      {
        title: 'Classification Algorithms',
        description: 'Logistic regression, decision trees, and random forests.',
        notes: 'Understand classification metrics, decision tree learning, and ensemble methods.',
        studyMaterial: 'Implement logistic regression. Build decision tree classifiers.',
        resources: [
          { title: 'Classification', url: 'https://www.geeksforgeeks.org/classification-algorithms/', type: 'Reference' },
        ],
      },
      {
        title: 'Clustering',
        description: 'K-means, hierarchical clustering, and evaluation metrics.',
        notes: 'Learn unsupervised learning, K-means algorithm, and cluster evaluation techniques.',
        studyMaterial: 'Implement K-means clustering. Practice with real datasets.',
        resources: [
          { title: 'Clustering', url: 'https://www.geeksforgeeks.org/clustering-in-machine-learning/', type: 'Reference' },
        ],
      },
    ],
  },
  {
    title: 'Information and Cyber Security',
    shortDescription: 'Learn cybersecurity fundamentals and best practices.',
    description: 'Study encryption, network security, ethical hacking, and security protocols.',
    category: 'Cybersecurity',
    level: 'INTERMEDIATE',
    topics: [
      {
        title: 'Introduction to Cybersecurity',
        description: 'Security principles, threats, vulnerabilities, and attacks.',
        notes: 'Understand CIA triad, common attack vectors, and security fundamentals.',
        studyMaterial: 'Study common cyber attacks. Learn security best practices.',
        resources: [
          { title: 'Cybersecurity Basics', url: 'https://www.geeksforgeeks.org/cyber-security/', type: 'Reference' },
        ],
      },
      {
        title: 'Cryptography',
        description: 'Symmetric and asymmetric encryption, hash functions.',
        notes: 'Learn encryption algorithms, digital signatures, and cryptographic protocols.',
        studyMaterial: 'Implement basic encryption. Study hash functions and digital signatures.',
        resources: [
          { title: 'Cryptography', url: 'https://www.geeksforgeeks.org/cryptography/', type: 'Reference' },
        ],
      },
      {
        title: 'Network Security',
        description: 'Firewalls, IDS/IPS, VPNs, and secure protocols.',
        notes: 'Understand network security measures, intrusion detection, and secure communication.',
        studyMaterial: 'Study firewall configurations. Learn about SSL/TLS.',
        resources: [
          { title: 'Network Security', url: 'https://www.geeksforgeeks.org/network-security/', type: 'Reference' },
        ],
      },
      {
        title: 'Ethical Hacking',
        description: 'Penetration testing, vulnerability assessment, and security tools.',
        notes: 'Learn ethical hacking methodology, common tools, and vulnerability scanning.',
        studyMaterial: 'Practice with security tools. Learn penetration testing phases.',
        resources: [
          { title: 'Ethical Hacking', url: 'https://www.geeksforgeeks.org/ethical-hacking/', type: 'Reference' },
        ],
      },
    ],
  },
];

export async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    const existingCount = await User.countDocuments();
    if (existingCount === 0) {
      for (const userData of SEED_USERS) {
        const hashedPassword = await authService.hashPassword(userData.password);
        const user = new User({
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          isEmailVerified: true,
        });
        await user.save();
        console.log(`✅ Created user: ${userData.email}`);
      }
    } else {
      console.log(`✅ Users already exist (${existingCount} found)`);
    }

    await seedAssessmentSamples();
    await seedSampleCourses();
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    throw error;
  }
}

async function seedSampleCourses() {
  // Clear existing courses, lessons, and enrollments to ensure clean seed
  await Lesson.deleteMany({});
  await Course.deleteMany({});
  
  // Clear all user enrollments to avoid ID mismatches after re-seeding
  await User.updateMany({}, { enrolledCourses: [] });
  console.log('🗑️  Cleared existing courses, lessons, and user enrollments');

  let instructor = await User.findOne({ role: 'INSTRUCTOR' });
  if (!instructor) {
    instructor = await User.findOne({ role: 'ADMIN' });
  }
  if (!instructor) {
    const hashedPassword = await authService.hashPassword('Instructor@123');
    instructor = await User.create({
      email: 'instructor@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Instructor',
      role: 'INSTRUCTOR',
      isEmailVerified: true,
    });
    console.log('✅ Created instructor user: instructor@example.com');
  }

  for (const sample of SAMPLE_COURSES) {
    const course = await Course.create({
      title: sample.title,
      shortDescription: sample.shortDescription,
      description: sample.description,
      category: sample.category,
      level: sample.level,
      instructor: instructor._id,
      isPublished: true,
      isFeatured: true,
    });
    console.log(`✅ Created course: ${sample.title}`);

    let order = 1;
    let totalDuration = 0;
    for (const topic of sample.topics) {
      const lesson = await Lesson.create({
        title: topic.title,
        description: topic.description,
        courseId: course._id,
        order: order++,
        notes: topic.notes,
        content: topic.notes,
        studyMaterial: topic.studyMaterial,
        contentType: 'TEXT',
        pdfUrl: topic.pdfUrl || '',
        duration: 45,
        isPublished: true,
      });
      course.lessons.push(lesson._id);
      totalDuration += lesson.duration;
    }

    course.duration = totalDuration;
    await course.save();
    console.log(`✅ Seeded topics for: ${sample.title} (${sample.topics.length} topics)`);
  }
}

async function seedAssessmentSamples() {
  const questionCount = await QuestionBank.countDocuments();
  if (questionCount > 0) return;

  const admin = await User.findOne({ role: 'ADMIN' });
  const samples = [
    {
      subject: 'Python Basics',
      question: 'Which keyword defines a function in Python?',
      options: ['func', 'def', 'function', 'define'],
      correctAnswer: 'def',
      difficulty: 'EASY',
      createdBy: admin?._id,
    },
    {
      subject: 'Python Basics',
      question: 'What is the output of print(2 ** 3)?',
      options: ['6', '8', '9', '5'],
      correctAnswer: '8',
      difficulty: 'MEDIUM',
      createdBy: admin?._id,
    },
    {
      subject: 'Data Structures',
      question: 'Which structure uses LIFO ordering?',
      options: ['Queue', 'Stack', 'Tree', 'Graph'],
      correctAnswer: 'Stack',
      difficulty: 'MEDIUM',
      createdBy: admin?._id,
    },
  ];

  const created = await QuestionBank.insertMany(samples);
  await Test.create({
    title: 'Python Fundamentals Quiz',
    subject: 'Python Basics',
    description: 'Introductory Python assessment for new students.',
    difficulty: 'EASY',
    questions: created.map(q => q._id),
    passingScore: 60,
    timeLimit: 20,
    schedule: 'ALWAYS',
    status: 'PUBLISHED',
    createdBy: admin?._id,
  });
  console.log('✅ Seeded sample questions and test');
}

export async function clearDatabase() {
  try {
    console.log('🗑️  Clearing database...');
    await User.deleteMany({});
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('❌ Failed to clear database:', error.message);
    throw error;
  }
}
