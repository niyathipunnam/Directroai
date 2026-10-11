const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY;

const client = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 180000, // 3 min for generation calls
  headers: {
    'X-Service-Key': AI_SERVICE_KEY,
    'Content-Type': 'application/json',
  },
});

// Error helper
function extractError(err) {
  if (err.response) {
    const detail = err.response.data?.detail || err.response.data?.error || err.response.data?.message;
    return detail || `AI service error: HTTP ${err.response.status}`;
  }
  if (err.code === 'ECONNREFUSED') return 'AI service is not running. Start FastAPI on port 8000.';
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') return 'AI service timed out. Generation may take a while – please retry.';
  return err.message || 'Unknown AI service error';
}

async function generateCharacter(description, projectId) {
  try {
    const res = await client.post('/generate-character', { description, project_id: projectId });
    return res.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

async function generateEnvironment(description, projectId) {
  try {
    const res = await client.post('/generate-environment', { description, project_id: projectId });
    return res.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

async function generateStoryboard(payload) {
  try {
    const res = await client.post('/generate-storyboard', payload, { timeout: 300000 }); // 5 min
    return res.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

async function generateVideo(payload) {
  try {
    const res = await client.post('/generate-video', payload, { timeout: 300000 });
    return res.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

async function generateAudio(description, projectId, audioType = 'music') {
  try {
    const res = await client.post('/generate-audio', { description, project_id: projectId, audio_type: audioType });
    return res.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

async function getTaskStatus(taskId) {
  try {
    const res = await client.get(`/task/${taskId}`, { timeout: 10000 });
    return res.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

module.exports = {
  generateCharacter,
  generateEnvironment,
  generateStoryboard,
  generateVideo,
  generateAudio,
  getTaskStatus,
};
