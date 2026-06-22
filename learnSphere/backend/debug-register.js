import express from 'express';
console.log('Imports loaded');

const app = express();
app.use(express.json());

// Test endpoint without all middleware
app.post('/test-register', (req, res) => {
  try {
    console.log('Request body:', req.body);
    
    // Test validation
    const { error, value } = schemas.register.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details);
      return res.status(400).json({ message: 'Validation failed', errors: error.details });
    }
    
    console.log('Validation passed:', value);
    
    // Test auth service
    authService.register(value)
      .then(result => {
        console.log('Registration success:', result);
        res.json({ message: 'Registration successful', data: result });
      })
      .catch(err => {
        console.log('Auth service error:', err.message);
        res.status(400).json({ message: err.message });
      });
      
  } catch (err) {
    console.log('Server error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
});
