const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');

router.use(auth);

// POST /api/audio (generate or attempt)
router.post('/', async (req, res) => {
  let { project_id, description, audio_type = 'music' } = req.body;
  if (audio_type === 'voice') audio_type = 'voiceover';
  if (!project_id) return res.status(400).json({ success: false, error: 'project_id required' });
  if (!description) return res.status(400).json({ success: false, error: 'description required' });

  try {
    // Create audio asset record
    const [result] = await db.query(
      "INSERT INTO audio_assets (project_id, description, audio_type, status) VALUES (?, ?, ?, 'generating')",
      [project_id, description, audio_type]
    );
    const audioId = result.insertId;

    // Call AI service for audio
    const aiResult = await aiService.generateAudio(description, project_id, audio_type);

    if (aiResult.not_configured) {
      // Audio provider not configured - update to not_configured status
      await db.query("UPDATE audio_assets SET status = 'not_configured' WHERE id = ?", [audioId]);
      return res.json({
        success: true,
        data: {
          id: audioId,
          status: 'not_configured',
          not_configured: true,
          message: 'AI audio provider is not configured yet. You can skip audio or configure a provider.',
        },
      });
    }

    if (aiResult.audio_path) {
      await db.query(
        "UPDATE audio_assets SET status = 'completed', audio_path = ?, task_id = ? WHERE id = ?",
        [aiResult.audio_path, aiResult.task_id, audioId]
      );
      
      const path = require('path');
      const url_path = aiResult.audio_path.replace(/\\/g, '/');
      const urlIdx = url_path.indexOf('/uploads/');
      const finalUrl = urlIdx >= 0 ? url_path.substring(urlIdx) : '/uploads/audio/' + path.basename(aiResult.audio_path);

      let mappedType = 'music';
      if (audio_type === 'sfx') mappedType = 'sfx';
      if (audio_type === 'voiceover') mappedType = 'sfx'; // Treating VO as SFX for timeline purposes

      await db.query(
        "INSERT INTO media_assets (project_id, asset_type, filename, file_path, url_path, source, task_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [project_id, mappedType, path.basename(aiResult.audio_path), aiResult.audio_path, finalUrl, 'generated', aiResult.task_id]
      );
    }

    const [rows] = await db.query('SELECT * FROM audio_assets WHERE id = ?', [audioId]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Audio generate error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Audio generation failed' });
  }
});

// POST /api/audio/skip
router.post('/skip', async (req, res) => {
  const { project_id, reason } = req.body;
  if (!project_id) return res.status(400).json({ success: false, error: 'project_id required' });
  try {
    const [result] = await db.query(
      "INSERT INTO audio_assets (project_id, description, audio_type, status) VALUES (?, ?, ?, 'skipped')",
      [project_id, reason || 'Skipped by user', 'music']
    );
    res.json({ success: true, data: { id: result.insertId, status: 'skipped', message: 'Audio step skipped' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to skip audio' });
  }
});

// GET /api/audio?project_id=
router.get('/', async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ success: false, error: 'project_id required' });
  try {
    const [rows] = await db.query('SELECT * FROM audio_assets WHERE project_id = ? ORDER BY created_at DESC', [project_id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch audio assets' });
  }
});

module.exports = router;

