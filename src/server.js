require('dotenv').config();
const express = require('express');
const { testConnection } = require('./db');
const routes = require('./routes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API health and info
app.get('/', (req, res) => {
  res.json({
    service: 'Recruiter Bot Matching API',
    status: 'online',
    endpoints: {
      job_matches: 'GET /jobs/:id/matches',
      candidate_matches: 'GET /candidates/:id/matches'
    }
  });
});

// Mount matching routes
app.use('/', routes);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Generic 500 Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    await testConnection();
    console.log('Connected to MySQL successfully.');

    const server = app.listen(PORT, () => {
      console.log(`Recruiter Bot API running at http://localhost:${PORT}`);
    });

    return server;
  } catch (err) {
    console.error('Failed to start server due to database connection issue.');
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
