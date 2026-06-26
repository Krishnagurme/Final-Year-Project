const jwt = require('jsonwebtoken');
const token = jwt.sign({ user: 'test' }, 'learnsphere_super_secret_jwt_key_2025');
console.log(token);