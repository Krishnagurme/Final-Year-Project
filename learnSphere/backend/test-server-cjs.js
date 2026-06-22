const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Test Server running on port ${PORT}`);
  console.log(`📍 API Base URL: http://localhost:${PORT}/api\n`);
});
