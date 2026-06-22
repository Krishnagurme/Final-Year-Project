import express from 'express';

try {
  console.log('Starting server...');
  console.log('Express loaded successfully');
  
  const app = express();
  console.log('App created successfully');
  
  app.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint working' });
  });
  
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
