require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure upload directories exist
const uploadDirs = [
  'uploads/characters',
  'uploads/environments',
  'uploads/storyboards',
  'uploads/videos',
  'uploads/audio',
  'uploads/exports',
];
uploadDirs.forEach(dir => fs.mkdirSync(path.join(__dirname, dir), { recursive: true }));

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public'), { setHeaders: (res, path) => { if (path.endsWith('.html') || path.endsWith('.js')) { res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); res.setHeader('Expires', '0'); res.setHeader('Surrogate-Control', 'no-store'); } } }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/projects', require('./src/routes/projects'));
app.use('/api/characters', require('./src/routes/characters'));
app.use('/api/environments', require('./src/routes/environments'));
app.use('/api/storyboards', require('./src/routes/storyboards'));
app.use('/api/shots', require('./src/routes/shots'));
app.use('/api/audio', require('./src/routes/audio'));
app.use('/api/media', require('./src/routes/media'));
app.use('/api/editor', require('./src/routes/editor'));
app.use('/api/export', require('./src/routes/export'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'DIRECTRO AI', version: '1.0.0' });
});

// Catch-all: serve SPA index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🎬 DIRECTRO AI is running!`);
  console.log(`   Frontend: http://localhost:${PORT}`);
  console.log(`   API:      http://localhost:${PORT}/api`);
  console.log(`   AI Svc:   ${process.env.AI_SERVICE_URL || 'http://localhost:8000'}`);
  console.log(`   Env:      ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;

// force restart
