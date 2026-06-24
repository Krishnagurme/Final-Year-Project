export const PREREQUISITE_QUESTION_COUNT = 15;

export const QUESTION_BANK = {
  python: [
    { q: "What is the correct syntax to output 'Hello World' in Python?", options: ["print('Hello World')", "echo('Hello World')", "p('Hello World')", "console.log('Hello World')"], a: "print('Hello World')" },
    { q: 'How do you insert comments in Python code?', options: ['# comment', '// comment', '/* comment */', '<!-- comment -->'], a: '# comment' },
    { q: 'Which data type is mutable in Python?', options: ['List', 'Tuple', 'String', 'Integer'], a: 'List' },
    { q: 'Which keyword is used to create a function in Python?', options: ['def', 'function', 'fun', 'define'], a: 'def' },
    { q: 'What is the output of 3 * 1 ** 3 in Python?', options: ['3', '27', '1', '9'], a: '3' },
    { q: 'Which collection is ordered, changeable, and allows duplicate members?', options: ['List', 'Set', 'Dictionary', 'Tuple'], a: 'List' },
    { q: 'How do you start a loop in Python?', options: ['for x in y:', 'for x y:', 'while x in y:', 'for (x=0; x<10; x++)'], a: 'for x in y:' },
    { q: 'What is the correct way to handle exceptions in Python?', options: ['try/except', 'try/catch', 'throw/catch', 'do/catch'], a: 'try/except' },
    { q: 'Which method removes whitespace from the beginning and end of a string?', options: ['strip()', 'trim()', 'len()', 'replace()'], a: 'strip()' },
    { q: "What is the default return value of a function that doesn't return anything?", options: ['None', 'Null', 'void', '0'], a: 'None' },
    { q: 'How can you check if a key exists in a dictionary?', options: ['key in dict', 'dict.has(key)', 'dict.exists(key)', 'key.exists(dict)'], a: 'key in dict' },
    { q: 'What is the output of print(type([]) == list)?', options: ['True', 'False', 'Error', 'None'], a: 'True' },
    { q: 'Which keyword is used to import a library in Python?', options: ['import', 'using', 'require', 'include'], a: 'import' },
    { q: "What is the length of the string 'LearnSphere'?", options: ['11', '10', '12', '9'], a: '11' },
    { q: 'What does OOP stand for in programming?', options: ['Object-Oriented Programming', 'Optimal Operator Process', 'Open Object Protocol', 'Objective Online Program'], a: 'Object-Oriented Programming' },
  ],
  javascript: [
    { q: 'Inside which HTML element do we put JavaScript?', options: ['<script>', '<javascript>', '<js>', '<scripting>'], a: '<script>' },
    { q: "How do you write 'Hello World' in an alert box?", options: ["alert('Hello World');", "msg('Hello World');", "msgBox('Hello World');", "alertBox('Hello World');"], a: "alert('Hello World');" },
    { q: 'Which operator is used to assign a value to a variable?', options: ['=', '*', '-', '=='], a: '=' },
    { q: 'What is the correct way to write a JavaScript array?', options: ["const colors = ['red', 'green', 'blue']", "const colors = 1:('red'), 2:('green')", "const colors = 'red', 'green', 'blue'", "const colors = (1:'red', 2:'green')"], a: "const colors = ['red', 'green', 'blue']" },
    { q: 'Which event occurs when the user clicks on an HTML element?', options: ['onclick', 'onchange', 'onmouseclick', 'onmouseover'], a: 'onclick' },
    { q: 'How do you declare a block-scoped variable in JavaScript?', options: ['let', 'var', 'declare', 'def'], a: 'let' },
    { q: 'What is the output of console.log(typeof null)?', options: ['object', 'null', 'undefined', 'string'], a: 'object' },
    { q: 'Which array method adds elements to the end of an array?', options: ['push()', 'pop()', 'shift()', 'unshift()'], a: 'push()' },
    { q: "How do you write a conditional statement for executing some code if 'i' is equal to 5?", options: ['if (i === 5)', 'if i = 5 then', 'if i === 5', 'if i = 5'], a: 'if (i === 5)' },
    { q: "How does a 'for' loop start?", options: ['for (let i = 0; i < 5; i++)', 'for (i <= 5; i++)', 'for i = 1 to 5', 'for (let i = 0; i <= 5)'], a: 'for (let i = 0; i < 5; i++)' },
    { q: 'How do you add a comment in JavaScript?', options: ['// comment', "' comment", '<!-- comment -->', '/* comment */'], a: '// comment' },
    { q: "What is the correct way to check if 'a' is NOT equal to 'b'?", options: ['a !== b', 'a <> b', 'a != b', 'a not b'], a: 'a !== b' },
    { q: 'Which keyword is used to create a class in JavaScript?', options: ['class', 'constructor', 'object', 'define'], a: 'class' },
    { q: 'What is a Promise in JavaScript?', options: ['An object representing completion or failure of an async operation', 'A synchronous loop construct', 'A security token', 'A compiler directive'], a: 'An object representing completion or failure of an async operation' },
    { q: 'Which keyword is used to handle asynchronous operations sequentially?', options: ['async/await', 'then/catch', 'try/catch', 'defer/promise'], a: 'async/await' },
  ],
  discreteMathematics: [
    { q: 'What is the union of sets A = {1,2,3} and B = {3,4,5}?', options: ['{1,2,3,4,5}', '{3}', '{1,2,4,5}', '{}'], a: '{1,2,3,4,5}' },
    { q: 'Which logical operator represents AND?', options: ['∧ (AND)', '∨ (OR)', '¬ (NOT)', '→ (IMPLIES)'], a: '∧ (AND)' },
    { q: 'What is the number of permutations of 3 distinct items?', options: ['6', '3', '9', '12'], a: '6' },
    { q: 'In graph theory, what is a path?', options: ['A sequence of edges connecting vertices', 'A closed loop', 'A disconnected component', 'A weighted edge'], a: 'A sequence of edges connecting vertices' },
    { q: 'What is the complement of a set A in universal set U?', options: ['U - A', 'A ∪ U', 'A ∩ U', 'A × U'], a: 'U - A' },
    { q: 'Which of these is a tautology?', options: ['p ∨ ¬p', 'p ∧ ¬p', 'p → q', 'p ↔ q'], a: 'p ∨ ¬p' },
    { q: 'What is the pigeonhole principle?', options: ['If n items are more than m containers, at least one container has more than one item', 'Items can be placed in any container', 'All containers must be empty', 'Items cannot be moved'], a: 'If n items are more than m containers, at least one container has more than one item' },
    { q: 'What is a tree in graph theory?', options: ['A connected acyclic graph', 'A graph with cycles', 'A disconnected graph', 'A directed graph'], a: 'A connected acyclic graph' },
    { q: 'What is the intersection of sets A = {1,2,3} and B = {3,4,5}?', options: ['{3}', '{1,2,4,5}', '{1,2,3,4,5}', '{}'], a: '{3}' },
    { q: 'Which logical operator represents OR?', options: ['∨ (OR)', '∧ (AND)', '¬ (NOT)', '→ (IMPLIES)'], a: '∨ (OR)' },
    { q: 'What is n choose k (nCk)?', options: ['n!/(k!(n-k)!)', 'n!/(n-k)!', 'n!/k!', 'k!/(n!(n-k)!)'], a: 'n!/(k!(n-k)!)' },
    { q: 'What is a bipartite graph?', options: ['A graph whose vertices can be divided into two disjoint sets', 'A graph with two edges', 'A graph with two components', 'A directed graph'], a: 'A graph whose vertices can be divided into two disjoint sets' },
    { q: 'What is the power set of {a,b}?', options: ['{{},{a},{b},{a,b}}', '{a,b}', '{{a},{b}}', '{a,b,{a,b}}'], a: '{{},{a},{b},{a,b}}' },
    { q: 'What is De Morgan\'s law for (A ∪ B)\'?', options: ['A\' ∩ B\'', 'A\' ∪ B\'', 'A ∩ B', 'A ∪ B'], a: 'A\' ∩ B\'' },
    { q: 'What is the degree of a vertex in a graph?', options: ['Number of edges incident to the vertex', 'Number of vertices', 'Number of components', 'Number of cycles'], a: 'Number of edges incident to the vertex' },
  ],
  dataStructures: [
    { q: 'What is the time complexity of binary search?', options: ['O(log n)', 'O(n)', 'O(1)', 'O(n²)'], a: 'O(log n)' },
    { q: 'Which data structure follows LIFO?', options: ['Stack', 'Queue', 'Array', 'Tree'], a: 'Stack' },
    { q: 'What is the worst-case time complexity of quicksort?', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)'], a: 'O(n²)' },
    { q: 'In a binary search tree, where is the smallest element located?', options: ['Leftmost node', 'Rightmost node', 'Root', 'Middle node'], a: 'Leftmost node' },
    { q: 'What is the time complexity of inserting into a linked list at the head?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], a: 'O(1)' },
    { q: 'Which data structure uses FIFO?', options: ['Queue', 'Stack', 'Tree', 'Graph'], a: 'Queue' },
    { q: 'What is the space complexity of merge sort?', options: ['O(n)', 'O(1)', 'O(log n)', 'O(n²)'], a: 'O(n)' },
    { q: 'What is a hash collision?', options: ['Two keys hash to the same index', 'Two keys are the same', 'Hash function fails', 'Array is full'], a: 'Two keys hash to the same index' },
    { q: 'What is the time complexity of accessing an array element by index?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], a: 'O(1)' },
    { q: 'Which traversal visits root, left subtree, right subtree?', options: ['Preorder', 'Inorder', 'Postorder', 'Level order'], a: 'Preorder' },
    { q: 'What is the height of a binary tree with n nodes?', options: ['O(log n)', 'O(n)', 'O(1)', 'O(n²)'], a: 'O(log n)' },
    { q: 'What is a priority queue?', options: ['A queue where elements are removed in priority order', 'A regular queue', 'A stack', 'A linked list'], a: 'A queue where elements are removed in priority order' },
    { q: 'What is the time complexity of heap sort?', options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], a: 'O(n log n)' },
    { q: 'What is a graph represented as?', options: ['Adjacency matrix or adjacency list', 'Only matrix', 'Only list', 'Tree'], a: 'Adjacency matrix or adjacency list' },
    { q: 'What is the time complexity of BFS?', options: ['O(V + E)', 'O(V)', 'O(E)', 'O(V × E)'], a: 'O(V + E)' },
  ],
  computerOrganization: [
    { q: 'What is the binary equivalent of decimal 10?', options: ['1010', '1100', '1001', '1110'], a: '1010' },
    { q: 'Which component is the brain of the computer?', options: ['CPU', 'RAM', 'Hard Drive', 'GPU'], a: 'CPU' },
    { q: 'What is cache memory?', options: ['Fast memory between CPU and RAM', 'Slow memory', 'Hard disk', 'External memory'], a: 'Fast memory between CPU and RAM' },
    { q: 'What is pipelining?', options: ['Overlapping execution of instructions', 'Sequential execution', 'Parallel processing', 'Cache management'], a: 'Overlapping execution of instructions' },
    { q: 'What is the hexadecimal equivalent of binary 1010?', options: ['A', 'B', 'C', 'D'], a: 'A' },
    { q: 'What is the purpose of the ALU?', options: ['Perform arithmetic and logical operations', 'Store data', 'Control operations', 'Input/output'], a: 'Perform arithmetic and logical operations' },
    { q: 'What is virtual memory?', options: ['Memory management technique using disk as extension of RAM', 'Physical memory', 'Cache memory', 'External storage'], a: 'Memory management technique using disk as extension of RAM' },
    { q: 'What is RISC?', options: ['Reduced Instruction Set Computer', 'Random Instruction Set Computer', 'Real Instruction Set Computer', 'Regular Instruction Set Computer'], a: 'Reduced Instruction Set Computer' },
    { q: 'What is the difference between RAM and ROM?', options: ['RAM is volatile, ROM is non-volatile', 'RAM is non-volatile, ROM is volatile', 'Both are volatile', 'Both are non-volatile'], a: 'RAM is volatile, ROM is non-volatile' },
    { q: 'What is an interrupt?', options: ['Signal that interrupts normal program execution', 'A type of memory', 'A CPU instruction', 'A bus'], a: 'Signal that interrupts normal program execution' },
    { q: 'What is the purpose of the control unit?', options: ['Control data flow and instruction execution', 'Perform calculations', 'Store data', 'Handle I/O'], a: 'Control data flow and instruction execution' },
    { q: 'What is the von Neumann architecture?', options: ['Stored-program computer architecture', 'Harvard architecture', 'RISC architecture', 'CISC architecture'], a: 'Stored-program computer architecture' },
    { q: 'What is the binary equivalent of hexadecimal F?', options: ['1111', '1010', '1100', '1001'], a: '1111' },
    { q: 'What is DMA?', options: ['Direct Memory Access', 'Direct Memory Allocation', 'Data Memory Access', 'Digital Memory Access'], a: 'Direct Memory Access' },
    { q: 'What is the purpose of the clock in a CPU?', options: ['Synchronize operations', 'Store data', 'Perform calculations', 'Handle interrupts'], a: 'Synchronize operations' },
  ],
  oop: [
    { q: 'What is encapsulation?', options: ['Bundling data and methods together', 'Creating objects', 'Inheritance', 'Polymorphism'], a: 'Bundling data and methods together' },
    { q: 'What is inheritance?', options: ['Creating new classes from existing classes', 'Creating objects', 'Data hiding', 'Method overloading'], a: 'Creating new classes from existing classes' },
    { q: 'What is polymorphism?', options: ['Same interface, different implementations', 'Data hiding', 'Inheritance', 'Encapsulation'], a: 'Same interface, different implementations' },
    { q: 'What is a class?', options: ['Blueprint for creating objects', 'An object', 'A method', 'A variable'], a: 'Blueprint for creating objects' },
    { q: 'What is an object?', options: ['Instance of a class', 'A class', 'A method', 'A variable'], a: 'Instance of a class' },
    { q: 'What is abstraction?', options: ['Hiding implementation details', 'Data hiding', 'Inheritance', 'Polymorphism'], a: 'Hiding implementation details' },
    { q: 'What is method overloading?', options: ['Same method name, different parameters', 'Same method name, same parameters', 'Different method names', 'No parameters'], a: 'Same method name, different parameters' },
    { q: 'What is method overriding?', options: ['Redefining a method in subclass', 'Creating new methods', 'Method overloading', 'Static methods'], a: 'Redefining a method in subclass' },
    { q: 'What is a constructor?', options: ['Special method called when object is created', 'Regular method', 'Destructor', 'Static method'], a: 'Special method called when object is created' },
    { q: 'What is multiple inheritance?', options: ['Class inheriting from multiple parent classes', 'Class inheriting from one parent', 'No inheritance', 'Interface inheritance'], a: 'Class inheriting from multiple parent classes' },
    { q: 'What is an interface?', options: ['Contract for classes to implement', 'Implementation', 'Object', 'Variable'], a: 'Contract for classes to implement' },
    { q: 'What is the difference between abstract class and interface?', options: ['Abstract class can have implementation, interface cannot', 'Interface can have implementation, abstract cannot', 'Both are same', 'Neither has methods'], a: 'Abstract class can have implementation, interface cannot' },
    { q: 'What is a static method?', options: ['Method that belongs to class, not instance', 'Method that belongs to object', 'Constructor', 'Destructor'], a: 'Method that belongs to class, not instance' },
    { q: 'What is composition?', options: ['Has-a relationship between objects', 'Is-a relationship', 'Inheritance', 'Polymorphism'], a: 'Has-a relationship between objects' },
    { q: 'What is the SOLID principle?', options: ['Five design principles for OOP', 'Five database principles', 'Five security principles', 'Five network principles'], a: 'Five design principles for OOP' },
  ],
  computerGraphics: [
    { q: 'What is a pixel?', options: ['Smallest unit of a digital image', 'A color', 'A shape', 'A line'], a: 'Smallest unit of a digital image' },
    { q: 'What is RGB?', options: ['Red, Green, Blue color model', 'Red, Green, Black', 'Red, Gray, Blue', 'Random Green Blue'], a: 'Red, Green, Blue color model' },
    { q: 'What is raster graphics?', options: ['Pixel-based images', 'Vector-based images', '3D graphics', 'Animation'], a: 'Pixel-based images' },
    { q: 'What is the Bresenham line algorithm used for?', options: ['Line drawing', 'Circle drawing', 'Fill algorithms', 'Clipping'], a: 'Line drawing' },
    { q: 'What is vector graphics?', options: ['Mathematical description of shapes', 'Pixel-based images', '3D graphics', 'Animation'], a: 'Mathematical description of shapes' },
    { q: 'What is 2D transformation?', options: ['Manipulating 2D objects', '3D rendering', 'Color manipulation', 'Animation'], a: 'Manipulating 2D objects' },
    { q: 'What is clipping?', options: ['Removing parts outside a window', 'Adding parts', 'Coloring', 'Scaling'], a: 'Removing parts outside a window' },
    { q: 'What is the difference between raster and vector?', options: ['Raster is pixel-based, vector is mathematical', 'Vector is pixel-based, raster is mathematical', 'Both are same', 'Neither uses pixels'], a: 'Raster is pixel-based, vector is mathematical' },
    { q: 'What is a frame buffer?', options: ['Memory that stores pixel values', 'Memory for code', 'Memory for audio', 'Memory for text'], a: 'Memory that stores pixel values' },
    { q: 'What is scan conversion?', options: ['Converting geometric primitives to pixels', 'Converting pixels to geometry', 'Color conversion', 'Animation'], a: 'Converting geometric primitives to pixels' },
    { q: 'What is the DDA algorithm?', options: ['Digital Differential Analyzer for line drawing', 'Direct Drawing Algorithm', 'Dynamic Drawing Algorithm', 'Data Display Algorithm'], a: 'Digital Differential Analyzer for line drawing' },
    { q: 'What is homogeneous coordinate?', options: ['Coordinate system for transformations', 'Regular coordinate', '3D coordinate', '2D coordinate'], a: 'Coordinate system for transformations' },
    { q: 'What is anti-aliasing?', options: ['Smoothing jagged edges', 'Sharpening edges', 'Color correction', 'Brightness adjustment'], a: 'Smoothing jagged edges' },
    { q: 'What is a viewport?', options: ['Area on screen where image is displayed', 'Area in memory', 'Area on disk', 'Area in network'], a: 'Area on screen where image is displayed' },
    { q: 'What is the Cohen-Sutherland algorithm used for?', options: ['Line clipping', 'Line drawing', 'Circle drawing', 'Fill algorithms'], a: 'Line clipping' },
  ],
  database: [
    { q: 'What is a primary key?', options: ['Unique identifier for each record', 'Foreign key', 'Index', 'Constraint'], a: 'Unique identifier for each record' },
    { q: 'What is SQL?', options: ['Structured Query Language', 'Simple Query Language', 'Structured Question Language', 'Standard Query Language'], a: 'Structured Query Language' },
    { q: 'What is normalization?', options: ['Organizing data to reduce redundancy', 'Creating backups', 'Encrypting data', 'Deleting data'], a: 'Organizing data to reduce redundancy' },
    { q: 'What is a foreign key?', options: ['Key that references another table\'s primary key', 'Primary key in another table', 'Unique identifier', 'Index'], a: 'Key that references another table\'s primary key' },
    { q: 'What is the SELECT statement used for?', options: ['Retrieving data from database', 'Inserting data', 'Deleting data', 'Updating data'], a: 'Retrieving data from database' },
    { q: 'What is a transaction?', options: ['Sequence of operations treated as single unit', 'Single query', 'Database backup', 'User login'], a: 'Sequence of operations treated as single unit' },
    { q: 'What is the difference between DELETE and TRUNCATE?', options: ['DELETE can have WHERE clause, TRUNCATE cannot', 'TRUNCATE can have WHERE clause, DELETE cannot', 'Both are same', 'Neither deletes data'], a: 'DELETE can have WHERE clause, TRUNCATE cannot' },
    { q: 'What is an index?', options: ['Data structure that improves query speed', 'Primary key', 'Foreign key', 'Constraint'], a: 'Data structure that improves query speed' },
    { q: 'What is the JOIN operation used for?', options: ['Combine rows from multiple tables', 'Delete rows', 'Update rows', 'Create tables'], a: 'Combine rows from multiple tables' },
    { q: 'What is the GROUP BY clause used for?', options: ['Group rows that have same values', 'Sort rows', 'Filter rows', 'Join tables'], a: 'Group rows that have same values' },
    { q: 'What is a stored procedure?', options: ['Precompiled SQL code stored in database', 'Regular SQL query', 'Database backup', 'User account'], a: 'Precompiled SQL code stored in database' },
    { q: 'What is the difference between CHAR and VARCHAR?', options: ['CHAR is fixed length, VARCHAR is variable', 'VARCHAR is fixed length, CHAR is variable', 'Both are same', 'Neither stores text'], a: 'CHAR is fixed length, VARCHAR is variable' },
    { q: 'What is ACID in database transactions?', options: ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Index, Data', 'Add, Create, Insert, Delete', 'All of the above'], a: 'Atomicity, Consistency, Isolation, Durability' },
    { q: 'What is the HAVING clause used for?', options: ['Filter groups after GROUP BY', 'Filter rows before GROUP BY', 'Sort groups', 'Join tables'], a: 'Filter groups after GROUP BY' },
    { q: 'What is a view in database?', options: ['Virtual table based on result of query', 'Physical table', 'Backup table', 'Temporary table'], a: 'Virtual table based on result of query' },
  ],
  computerNetworks: [
    { q: 'What is the OSI model?', options: ['7-layer network model', '5-layer network model', '3-layer network model', '10-layer network model'], a: '7-layer network model' },
    { q: 'What is IP address?', options: ['Unique identifier for device on network', 'Email address', 'Website address', 'MAC address'], a: 'Unique identifier for device on network' },
    { q: 'What is the default port for HTTP?', options: ['80', '443', '21', '25'], a: '80' },
    { q: 'What is the default port for HTTPS?', options: ['443', '80', '21', '25'], a: '443' },
    { q: 'What is TCP?', options: ['Transmission Control Protocol', 'Transfer Control Protocol', 'Transmission Computer Protocol', 'Transfer Computer Protocol'], a: 'Transmission Control Protocol' },
    { q: 'What is UDP?', options: ['User Datagram Protocol', 'Universal Data Protocol', 'User Data Process', 'Universal Data Process'], a: 'User Datagram Protocol' },
    { q: 'What is a MAC address?', options: ['Physical address of network interface', 'IP address', 'Website address', 'Email address'], a: 'Physical address of network interface' },
    { q: 'What is a router?', options: ['Device that forwards data packets', 'Device that stores data', 'Device that processes data', 'Device that displays data'], a: 'Device that forwards data packets' },
    { q: 'What is DNS?', options: ['Domain Name System', 'Data Name System', 'Digital Name System', 'Domain Network System'], a: 'Domain Name System' },
    { q: 'What is the difference between TCP and UDP?', options: ['TCP is reliable, UDP is unreliable', 'UDP is reliable, TCP is unreliable', 'Both are reliable', 'Both are unreliable'], a: 'TCP is reliable, UDP is unreliable' },
    { q: 'What is a firewall?', options: ['Security system that monitors traffic', 'Hardware device', 'Software application', 'Database'], a: 'Security system that monitors traffic' },
    { q: 'What is a subnet mask?', options: ['Used to divide IP network', 'Used to encrypt data', 'Used to compress data', 'Used to store data'], a: 'Used to divide IP network' },
    { q: 'What is the difference between IPv4 and IPv6?', options: ['IPv4 is 32-bit, IPv6 is 128-bit', 'IPv6 is 32-bit, IPv4 is 128-bit', 'Both are 32-bit', 'Both are 128-bit'], a: 'IPv4 is 32-bit, IPv6 is 128-bit' },
    { q: 'What is VPN?', options: ['Virtual Private Network', 'Virtual Public Network', 'Virtual Private Protocol', 'Virtual Public Protocol'], a: 'Virtual Private Network' },
    { q: 'What is the purpose of the transport layer?', options: ['End-to-end communication', 'Routing', 'Physical transmission', 'Data link'], a: 'End-to-end communication' },
  ],
  softwareEngineering: [
    { q: 'What is SDLC?', options: ['Software Development Life Cycle', 'Software Design Life Cycle', 'System Development Life Cycle', 'Software Deployment Life Cycle'], a: 'Software Development Life Cycle' },
    { q: 'What is the waterfall model?', options: ['Sequential SDLC model', 'Iterative SDLC model', 'Agile SDLC model', 'Spiral SDLC model'], a: 'Sequential SDLC model' },
    { q: 'What is agile methodology?', options: ['Iterative and incremental approach', 'Sequential approach', 'Waterfall approach', 'Spiral approach'], a: 'Iterative and incremental approach' },
    { q: 'What is unit testing?', options: ['Testing individual units of code', 'Testing entire system', 'Testing integration', 'Testing performance'], a: 'Testing individual units of code' },
    { q: 'What is integration testing?', options: ['Testing combined units', 'Testing individual units', 'Testing performance', 'Testing security'], a: 'Testing combined units' },
    { q: 'What is version control?', options: ['System for managing changes to code', 'System for compiling code', 'System for deploying code', 'System for testing code'], a: 'System for managing changes to code' },
    { q: 'What is a requirement?', options: ['What the software must do', 'What the software must not do', 'How software is built', 'When software is delivered'], a: 'What the software must do' },
    { q: 'What is the difference between functional and non-functional requirements?', options: ['Functional describes behavior, non-functional describes quality', 'Non-functional describes behavior, functional describes quality', 'Both describe behavior', 'Both describe quality'], a: 'Functional describes behavior, non-functional describes quality' },
    { q: 'What is a use case?', options: ['Description of system interaction', 'Code example', 'Test case', 'Database schema'], a: 'Description of system interaction' },
    { q: 'What is refactoring?', options: ['Improving code structure without changing behavior', 'Adding new features', 'Fixing bugs', 'Writing tests'], a: 'Improving code structure without changing behavior' },
    { q: 'What is continuous integration?', options: ['Automatically merging and testing code changes', 'Manually testing code', 'Deploying code manually', 'Writing documentation'], a: 'Automatically merging and testing code changes' },
    { q: 'What is the spiral model?', options: ['Risk-driven SDLC model', 'Sequential SDLC model', 'Agile SDLC model', 'Waterfall SDLC model'], a: 'Risk-driven SDLC model' },
    { q: 'What is a Gantt chart?', options: ['Project scheduling tool', 'Testing tool', 'Code editor', 'Database tool'], a: 'Project scheduling tool' },
    { q: 'What is the critical path?', options: ['Longest path through project schedule', 'Shortest path', 'Middle path', 'Random path'], a: 'Longest path through project schedule' },
    { q: 'What is code review?', options: ['Examining code by others', 'Writing code alone', 'Testing code automatically', 'Deploying code'], a: 'Examining code by others' },
  ],
  machineLearning: [
    { q: 'What is supervised learning?', options: ['Learning with labeled data', 'Learning without labels', 'Learning with rewards', 'Learning with punishments'], a: 'Learning with labeled data' },
    { q: 'What is unsupervised learning?', options: ['Learning without labeled data', 'Learning with labels', 'Learning with rewards', 'Learning with punishments'], a: 'Learning without labeled data' },
    { q: 'What is a neural network?', options: ['Computational model inspired by biological neurons', 'Database', 'Algorithm', 'Data structure'], a: 'Computational model inspired by biological neurons' },
    { q: 'What is overfitting?', options: ['Model performs well on training data but poorly on new data', 'Model performs poorly on training data', 'Model performs well on all data', 'Model has no parameters'], a: 'Model performs well on training data but poorly on new data' },
    { q: 'What is the difference between regression and classification?', options: ['Regression predicts continuous values, classification predicts categories', 'Classification predicts continuous values, regression predicts categories', 'Both predict continuous values', 'Both predict categories'], a: 'Regression predicts continuous values, classification predicts categories' },
    { q: 'What is gradient descent?', options: ['Optimization algorithm for finding minimum', 'Sorting algorithm', 'Search algorithm', 'Clustering algorithm'], a: 'Optimization algorithm for finding minimum' },
    { q: 'What is a decision tree?', options: ['Tree-like model for decisions', 'Data structure for storage', 'Sorting algorithm', 'Search algorithm'], a: 'Tree-like model for decisions' },
    { q: 'What is k-means clustering?', options: ['Unsupervised clustering algorithm', 'Supervised classification algorithm', 'Regression algorithm', 'Optimization algorithm'], a: 'Unsupervised clustering algorithm' },
    { q: 'What is the purpose of a validation set?', options: ['Tune hyperparameters and evaluate model', 'Train model', 'Test model', 'Store data'], a: 'Tune hyperparameters and evaluate model' },
    { q: 'What is bias-variance tradeoff?', options: ['Balance between underfitting and overfitting', 'Balance between speed and accuracy', 'Balance between memory and speed', 'Balance between training and testing'], a: 'Balance between underfitting and overfitting' },
    { q: 'What is deep learning?', options: ['Neural networks with multiple layers', 'Simple neural network', 'Decision tree', 'Linear regression'], a: 'Neural networks with multiple layers' },
    { q: 'What is the purpose of regularization?', options: ['Prevent overfitting', 'Increase overfitting', 'Speed up training', 'Reduce data'], a: 'Prevent overfitting' },
    { q: 'What is a confusion matrix?', options: ['Table showing classification performance', 'Matrix for data storage', 'Matrix for calculations', 'Matrix for visualization'], a: 'Table showing classification performance' },
    { q: 'What is precision?', options: ['TP / (TP + FP)', 'TP / (TP + FN)', '(TP + TN) / Total', 'FP / (FP + TN)'], a: 'TP / (TP + FP)' },
    { q: 'What is recall?', options: ['TP / (TP + FN)', 'TP / (TP + FP)', '(TP + TN) / Total', 'FP / (FP + TN)'], a: 'TP / (TP + FN)' },
  ],
  cybersecurity: [
    { q: 'What is the CIA triad?', options: ['Confidentiality, Integrity, Availability', 'Central Intelligence Agency', 'Computer Internet Association', 'Cyber Intelligence Agency'], a: 'Confidentiality, Integrity, Availability' },
    { q: 'What is encryption?', options: ['Converting data to unreadable format', 'Deleting data', 'Compressing data', 'Storing data'], a: 'Converting data to unreadable format' },
    { q: 'What is a firewall?', options: ['Security system that monitors traffic', 'Hardware device', 'Software application', 'Database'], a: 'Security system that monitors traffic' },
    { q: 'What is phishing?', options: ['Fraudulent attempt to obtain sensitive information', 'Type of encryption', 'Type of firewall', 'Type of antivirus'], a: 'Fraudulent attempt to obtain sensitive information' },
    { q: 'What is the difference between symmetric and asymmetric encryption?', options: ['Symmetric uses same key, asymmetric uses different keys', 'Asymmetric uses same key, symmetric uses different keys', 'Both use same key', 'Both use different keys'], a: 'Symmetric uses same key, asymmetric uses different keys' },
    { q: 'What is a VPN?', options: ['Virtual Private Network', 'Virtual Public Network', 'Verified Private Network', 'Virtual Protocol Network'], a: 'Virtual Private Network' },
    { q: 'What is a DDoS attack?', options: ['Distributed Denial of Service', 'Direct Denial of Service', 'Digital Denial of Service', 'Data Denial of Service'], a: 'Distributed Denial of Service' },
    { q: 'What is SQL injection?', options: ['Injecting malicious SQL code', 'Encrypting SQL', 'Compressing SQL', 'Deleting SQL'], a: 'Injecting malicious SQL code' },
    { q: 'What is a hash function?', options: ['One-way function that produces fixed-size output', 'Two-way function', 'Encryption algorithm', 'Compression algorithm'], a: 'One-way function that produces fixed-size output' },
    { q: 'What is the purpose of penetration testing?', options: ['Identify security vulnerabilities', 'Encrypt data', 'Compress data', 'Store data'], a: 'Identify security vulnerabilities' },
    { q: 'What is a digital signature?', options: ['Cryptographic signature for authentication', 'Handwritten signature', 'Email signature', 'Password'], a: 'Cryptographic signature for authentication' },
    { q: 'What is the difference between authentication and authorization?', options: ['Authentication verifies identity, authorization grants permissions', 'Authorization verifies identity, authentication grants permissions', 'Both are same', 'Neither is important'], a: 'Authentication verifies identity, authorization grants permissions' },
    { q: 'What is malware?', options: ['Malicious software', 'Antivirus software', 'Firewall software', 'Encryption software'], a: 'Malicious software' },
    { q: 'What is social engineering?', options: ['Manipulating people to divulge information', 'Writing code', 'Configuring firewall', 'Installing antivirus'], a: 'Manipulating people to divulge information' },
    { q: 'What is the purpose of SSL/TLS?', options: ['Secure communication over network', 'Store data', 'Compress data', 'Encrypt files'], a: 'Secure communication over network' },
  ],
  generic: [
    { q: 'Which data structure uses LIFO (Last In First Out) order?', options: ['Stack', 'Queue', 'Binary Tree', 'Linked List'], a: 'Stack' },
    { q: 'What is the time complexity of searching in a balanced binary search tree?', options: ['O(log n)', 'O(n)', 'O(1)', 'O(n log n)'], a: 'O(log n)' },
    { q: 'Which SQL clause is used to filter records in a database query?', options: ['WHERE', 'GROUP BY', 'ORDER BY', 'HAVING'], a: 'WHERE' },
    { q: 'What does HTTP stand for?', options: ['Hypertext Transfer Protocol', 'High Transfer Tech Protocol', 'Hyper Transfer Text Processor', 'Hypertext Tech Protocol'], a: 'Hypertext Transfer Protocol' },
    { q: 'Which port is commonly used for secure HTTP traffic (HTTPS)?', options: ['443', '80', '22', '8080'], a: '443' },
    { q: 'Which Git command is used to record changes to the repository?', options: ['git commit', 'git push', 'git add', 'git save'], a: 'git commit' },
    { q: 'What is the binary representation of decimal number 5?', options: ['101', '110', '011', '111'], a: '101' },
    { q: 'What is a primary key in a database table?', options: ['A field that uniquely identifies each record', 'A decryption password', 'A foreign link key', 'A sorting index'], a: 'A field that uniquely identifies each record' },
    { q: 'What does JSON stand for?', options: ['JavaScript Object Notation', 'Java Schema Online Network', 'Join Selected Operator Node', 'JavaScript Online Node'], a: 'JavaScript Object Notation' },
    { q: 'Which loop runs at least once, even if the condition is false?', options: ['do-while', 'while', 'for', 'foreach'], a: 'do-while' },
    { q: 'Which protocol is responsible for assigning IP addresses automatically?', options: ['DHCP', 'DNS', 'FTP', 'SMTP'], a: 'DHCP' },
    { q: 'What does API stand for?', options: ['Application Programming Interface', 'Access Program Integrator', 'Applied Protocol Inspector', 'Advanced Package Installation'], a: 'Application Programming Interface' },
    { q: 'Which data type stores true or false values?', options: ['Boolean', 'String', 'Character', 'Float'], a: 'Boolean' },
    { q: 'What is the name of the first index in most programming arrays?', options: ['0', '1', '-1', 'A'], a: '0' },
    { q: 'Which component is the brain of the computer?', options: ['CPU', 'RAM', 'Hard Drive', 'GPU'], a: 'CPU' },
  ],
};

export function resolveQuestionBankKey(category = '') {
  const cat = category.toLowerCase();
  if (cat.includes('discrete mathematics')) return 'discreteMathematics';
  if (cat.includes('data structures and algorithms')) return 'dataStructures';
  if (cat.includes('computer organization and architecture')) return 'computerOrganization';
  if (cat.includes('object oriented programming')) return 'oop';
  if (cat.includes('computer graphics')) return 'computerGraphics';
  if (cat.includes('database management systems')) return 'database';
  if (cat.includes('computer networks')) return 'computerNetworks';
  if (cat.includes('software engineering and project management')) return 'softwareEngineering';
  if (cat.includes('machine learning')) return 'machineLearning';
  if (cat.includes('information and cyber security') || cat.includes('cyber security')) return 'cybersecurity';
  if (cat.includes('python')) return 'python';
  if (cat.includes('javascript')) return 'javascript';
  return 'generic';
}

export function getQuestionsForCourse(category) {
  const key = resolveQuestionBankKey(category);
  return QUESTION_BANK[key].slice(0, PREREQUISITE_QUESTION_COUNT);
}

export function scorePrerequisiteAnswers(category, answers) {
  const qList = getQuestionsForCourse(category);
  let correct = 0;
  qList.forEach((q, idx) => {
    const studentAns = answers.find(a => a.questionIndex === idx);
    if (studentAns && studentAns.selectedAnswer === q.a) {
      correct += 1;
    }
  });
  const score = Math.round((correct / qList.length) * 100);
  let knowledgeLevel = 'BEGINNER';
  if (score >= 80) knowledgeLevel = 'ADVANCED';
  else if (score >= 50) knowledgeLevel = 'INTERMEDIATE';
  return { score, knowledgeLevel, totalQuestions: qList.length, correctCount: correct };
}
