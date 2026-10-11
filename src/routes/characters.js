const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../config/db');
const auth = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const aiService = require('../services/aiService');

router.use(auth);

// Helper: build URL path from file path
function toUrlPath(filePath) {
  if (!filePath) return null;
  const rel = filePath.replace(/\\/g, '/');
  const idx = rel.indexOf('/uploads/');
  return idx >= 0 ? rel.substring(idx) : '/uploads/' + path.basename(filePath);
}

// GET /api/characters?project_id=
router.get('/', async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ success: false, error: 'project_id required' });
  try {
    const [rows] = await db.query('SELECT * FROM characters WHERE project_id = ? ORDER BY created_at DESC', [project_id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch characters' });
  }
});

// POST /api/characters (create, optionally upload image)
router.post('/', uploadImage.single('image'), async (req, res) => {
  const { name, description, project_id } = req.body;
  if (!project_id) return res.status(400).json({ success: false, error: 'project_id required' });

  try {
    let image_path = null, url_path = null, source = 'generated', status = 'pending';

    if (req.file) {
      image_path = req.file.path.replace(/\\/g, '/');
      url_path = toUrlPath(image_path);
      source = 'upload';
      status = 'completed';

      // Save to media_assets
      await db.query(
        'INSERT INTO media_assets (project_id, asset_type, filename, file_path, url_path, source) VALUES (?, ?, ?, ?, ?, ?)',
        [project_id, 'character', req.file.filename, image_path, url_path, 'upload']
      );
    }

    const [result] = await db.query(
      'INSERT INTO characters (project_id, name, description, image_path, url_path, source, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [project_id, name || 'Character', description || '', image_path, url_path, source, status]
    );

    const [rows] = await db.query('SELECT * FROM characters WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Create character error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create character' });
  }
});

// POST /api/characters/:id/generate
router.post('/:id/generate', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM characters WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Character not found' });

    const character = rows[0];
    if (!character.description) {
      return res.status(400).json({ success: false, error: 'Character description is required for generation' });
    }

    // Start generation (returns task_id immediately)
    const result = await aiService.generateCharacter(character.description, character.project_id);

    // Update character with task_id and queued status
    await db.query("UPDATE characters SET task_id = ?, status = 'queued' WHERE id = ?", [result.task_id, req.params.id]);

    res.json({ success: true, data: { task_id: result.task_id, status: 'queued', character_id: req.params.id } });
  } catch (err) {
    await db.query("UPDATE characters SET status = 'failed' WHERE id = ?", [req.params.id]).catch(() => {});
    res.status(500).json({ success: false, error: err.message || 'Generation failed' });
  }
});

// GET /api/characters/:id/status
router.get('/:id/status', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM characters WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Character not found' });

    const character = rows[0];

    // If already completed or failed, return DB state
    if (['completed', 'failed', 'pending'].includes(character.status) && character.status !== 'queued') {
      return res.json({ success: true, data: character });
    }

    // Poll FastAPI for task status
    if (character.task_id) {
      const taskData = await aiService.getTaskStatus(character.task_id);

      if (taskData.status === 'completed' && taskData.file_path) {
        const url_path = toUrlPath(taskData.file_path);
        await db.query(
          "UPDATE characters SET status = 'completed', image_path = ?, url_path = ? WHERE id = ?",
          [taskData.file_path, url_path, req.params.id]
        );
        // Save to media_assets
        await db.query(
          'INSERT INTO media_assets (project_id, asset_type, filename, file_path, url_path, source, task_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [character.project_id, 'character', path.basename(taskData.file_path), taskData.file_path, url_path, 'generated', character.task_id]
        );

        const [updated] = await db.query('SELECT * FROM characters WHERE id = ?', [req.params.id]);
        return res.json({ success: true, data: updated[0] });
      } else if (taskData.status === 'failed') {
        await db.query("UPDATE characters SET status = 'failed' WHERE id = ?", [req.params.id]);
        const [updated] = await db.query('SELECT * FROM characters WHERE id = ?', [req.params.id]);
        return res.json({ success: true, data: { ...updated[0], error: taskData.error || 'Generation failed' } });
      } else {
        // Update status from task
        const newStatus = taskData.status || character.status;
        if (newStatus !== character.status) {
          await db.query('UPDATE characters SET status = ? WHERE id = ?', [newStatus, req.params.id]);
        }
        const [updated] = await db.query('SELECT * FROM characters WHERE id = ?', [req.params.id]);
        return res.json({ success: true, data: updated[0] });
      }
    }

    res.json({ success: true, data: character });
  } catch (err) {
    console.error('Status poll error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/characters/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM characters WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Character deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete character' });
  }
});

module.exports = router;
