const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../config/db');
const auth = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const aiService = require('../services/aiService');

router.use(auth);

function toUrlPath(filePath) {
  if (!filePath) return null;
  const rel = filePath.replace(/\\/g, '/');
  const idx = rel.indexOf('/uploads/');
  return idx >= 0 ? rel.substring(idx) : '/uploads/' + path.basename(filePath);
}

// GET /api/environments?project_id=
router.get('/', async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ success: false, error: 'project_id required' });
  try {
    const [rows] = await db.query('SELECT * FROM environments WHERE project_id = ? ORDER BY created_at DESC', [project_id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch environments' });
  }
});

// POST /api/environments
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

      await db.query(
        'INSERT INTO media_assets (project_id, asset_type, filename, file_path, url_path, source) VALUES (?, ?, ?, ?, ?, ?)',
        [project_id, 'environment', req.file.filename, image_path, url_path, 'upload']
      );
    }

    const [result] = await db.query(
      'INSERT INTO environments (project_id, name, description, image_path, url_path, source, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [project_id, name || 'Environment', description || '', image_path, url_path, source, status]
    );

    const [rows] = await db.query('SELECT * FROM environments WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Create environment error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create environment' });
  }
});

// POST /api/environments/:id/generate
router.post('/:id/generate', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM environments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Environment not found' });

    const env = rows[0];
    if (!env.description) {
      return res.status(400).json({ success: false, error: 'Environment description is required for generation' });
    }

    const result = await aiService.generateEnvironment(env.description, env.project_id);
    await db.query("UPDATE environments SET task_id = ?, status = 'queued' WHERE id = ?", [result.task_id, req.params.id]);

    res.json({ success: true, data: { task_id: result.task_id, status: 'queued', environment_id: req.params.id } });
  } catch (err) {
    await db.query("UPDATE environments SET status = 'failed' WHERE id = ?", [req.params.id]).catch(() => {});
    res.status(500).json({ success: false, error: err.message || 'Generation failed' });
  }
});

// GET /api/environments/:id/status
router.get('/:id/status', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM environments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Environment not found' });

    const env = rows[0];

    if (['completed', 'failed', 'pending'].includes(env.status) && env.status !== 'queued') {
      return res.json({ success: true, data: env });
    }

    if (env.task_id) {
      const taskData = await aiService.getTaskStatus(env.task_id);

      if (taskData.status === 'completed' && taskData.file_path) {
        const url_path = toUrlPath(taskData.file_path);
        await db.query(
          "UPDATE environments SET status = 'completed', image_path = ?, url_path = ? WHERE id = ?",
          [taskData.file_path, url_path, req.params.id]
        );
        await db.query(
          'INSERT INTO media_assets (project_id, asset_type, filename, file_path, url_path, source, task_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [env.project_id, 'environment', path.basename(taskData.file_path), taskData.file_path, url_path, 'generated', env.task_id]
        );

        const [updated] = await db.query('SELECT * FROM environments WHERE id = ?', [req.params.id]);
        return res.json({ success: true, data: updated[0] });
      } else if (taskData.status === 'failed') {
        await db.query("UPDATE environments SET status = 'failed' WHERE id = ?", [req.params.id]);
        const [updated] = await db.query('SELECT * FROM environments WHERE id = ?', [req.params.id]);
        return res.json({ success: true, data: { ...updated[0], error: taskData.error || 'Generation failed' } });
      } else {
        const newStatus = taskData.status || env.status;
        if (newStatus !== env.status) {
          await db.query('UPDATE environments SET status = ? WHERE id = ?', [newStatus, req.params.id]);
        }
        const [updated] = await db.query('SELECT * FROM environments WHERE id = ?', [req.params.id]);
        return res.json({ success: true, data: updated[0] });
      }
    }

    res.json({ success: true, data: env });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/environments/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM environments WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Environment deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete environment' });
  }
});

module.exports = router;
