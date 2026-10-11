const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../config/db');
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');

router.use(auth);

function toUrlPath(filePath) {
  if (!filePath) return null;
  const rel = filePath.replace(/\\/g, '/');
  const idx = rel.indexOf('/uploads/');
  return idx >= 0 ? rel.substring(idx) : '/uploads/' + path.basename(filePath);
}

// POST /api/shots (add new shot to storyboard)
router.post('/', async (req, res) => {
  const { storyboard_id, description, shot_number } = req.body;
  if (!storyboard_id) return res.status(400).json({ success: false, error: 'storyboard_id required' });
  try {
    // Get next shot number
    const [maxRow] = await db.query('SELECT MAX(shot_number) as max FROM shots WHERE storyboard_id = ?', [storyboard_id]);
    const nextNum = (maxRow[0].max || 0) + 1;

    const [result] = await db.query(
      'INSERT INTO shots (storyboard_id, shot_number, description) VALUES (?, ?, ?)',
      [storyboard_id, shot_number || nextNum, description || '']
    );
    const [rows] = await db.query('SELECT * FROM shots WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add shot' });
  }
});

// PUT /api/shots/:id (edit shot)
router.put('/:id', async (req, res) => {
  const { description, motion_prompt, camera_movement } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM shots WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Shot not found' });

    await db.query(
      'UPDATE shots SET description = ?, motion_prompt = ?, camera_movement = ? WHERE id = ?',
      [
        description !== undefined ? description : rows[0].description,
        motion_prompt !== undefined ? motion_prompt : rows[0].motion_prompt,
        camera_movement !== undefined ? camera_movement : rows[0].camera_movement,
        req.params.id,
      ]
    );
    const [updated] = await db.query('SELECT * FROM shots WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update shot' });
  }
});

// POST /api/shots/:id/regenerate
router.post('/:id/regenerate', async (req, res) => {
  try {
    const [shots] = await db.query(`
      SELECT s.*, sb.project_id, sb.story_description, sb.character_id, sb.environment_id
      FROM shots s
      JOIN storyboards sb ON sb.id = s.storyboard_id
      WHERE s.id = ?`, [req.params.id]);
    if (shots.length === 0) return res.status(404).json({ success: false, error: 'Shot not found' });

    const shot = shots[0];

    // Get character and environment
    let charDesc = '', envDesc = '';
    if (shot.character_id) {
      const [chars] = await db.query('SELECT description FROM characters WHERE id = ?', [shot.character_id]);
      charDesc = chars[0]?.description || '';
    }
    if (shot.environment_id) {
      const [envs] = await db.query('SELECT description FROM environments WHERE id = ?', [shot.environment_id]);
      envDesc = envs[0]?.description || '';
    }

    const payload = {
      story_description: shot.description || shot.story_description,
      project_id: shot.project_id,
      character_description: charDesc,
      environment_description: envDesc,
      num_shots: 1,
      single_shot: true,
    };

    const result = await aiService.generateStoryboard(payload);

    if (result.shots && result.shots.length > 0) {
      const newShot = result.shots[0];
      const url_path = newShot.image_path ? toUrlPath(newShot.image_path) : null;
      await db.query('UPDATE shots SET image_path = ?, image_url = ? WHERE id = ?', [
        newShot.image_path || shot.image_path,
        url_path || shot.image_url,
        req.params.id,
      ]);
      if (newShot.image_path) {
        await db.query(
          'INSERT INTO media_assets (project_id, asset_type, filename, file_path, url_path, source) VALUES (?, ?, ?, ?, ?, ?)',
          [shot.project_id, 'storyboard_image', path.basename(newShot.image_path), newShot.image_path, url_path, 'generated']
        );
      }
    }

    const [updated] = await db.query('SELECT * FROM shots WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error('Regenerate shot error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Regeneration failed' });
  }
});

// DELETE /api/shots/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM shots WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Shot deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete shot' });
  }
});

// POST /api/shots/:id/video (start video generation)
router.post('/:id/video', async (req, res) => {
  try {
    const [shots] = await db.query('SELECT s.*, sb.project_id FROM shots s JOIN storyboards sb ON sb.id = s.storyboard_id WHERE s.id = ?', [req.params.id]);
    if (shots.length === 0) return res.status(404).json({ success: false, error: 'Shot not found' });

    const shot = shots[0];
    if (!shot.image_path) {
      return res.status(400).json({ success: false, error: 'Shot must have an image before generating video. Generate storyboard first.' });
    }

    const { motion_prompt, camera_movement } = req.body;

    const payload = {
      shot_id: shot.id,
      image_path: shot.image_path,
      prompt: shot.description || '',
      motion_prompt: motion_prompt || shot.motion_prompt || '',
      camera_movement: camera_movement || shot.camera_movement || '',
      project_id: shot.project_id,
    };

    const result = await aiService.generateVideo(payload);

    await db.query("UPDATE shots SET video_task_id = ?, video_status = 'queued' WHERE id = ?", [result.task_id, req.params.id]);

    res.json({ success: true, data: { task_id: result.task_id, status: 'queued', shot_id: req.params.id, not_configured: result.not_configured || false } });
  } catch (err) {
    await db.query("UPDATE shots SET video_status = 'failed' WHERE id = ?", [req.params.id]).catch(() => {});
    res.status(500).json({ success: false, error: err.message || 'Video generation failed' });
  }
});

// GET /api/shots/:id/video/status
router.get('/:id/video/status', async (req, res) => {
  try {
    const [shots] = await db.query('SELECT s.*, sb.project_id FROM shots s JOIN storyboards sb ON sb.id = s.storyboard_id WHERE s.id = ?', [req.params.id]);
    if (shots.length === 0) return res.status(404).json({ success: false, error: 'Shot not found' });

    const shot = shots[0];

    if (['completed', 'failed', 'none'].includes(shot.video_status)) {
      return res.json({ success: true, data: shot });
    }

    if (shot.video_task_id) {
      const taskData = await aiService.getTaskStatus(shot.video_task_id);

      if (taskData.status === 'completed' && taskData.file_path) {
        const url_path = toUrlPath(taskData.file_path);
        await db.query(
          "UPDATE shots SET video_status = 'completed', video_path = ?, video_url = ? WHERE id = ?",
          [taskData.file_path, url_path, req.params.id]
        );
        // Save to media_assets
        await db.query(
          'INSERT INTO media_assets (project_id, asset_type, filename, file_path, url_path, source, task_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [shot.project_id, 'video', path.basename(taskData.file_path), taskData.file_path, url_path, 'runway', shot.video_task_id]
        );

        const [updated] = await db.query('SELECT * FROM shots WHERE id = ?', [req.params.id]);
        return res.json({ success: true, data: updated[0] });
      } else if (taskData.status === 'failed') {
        await db.query("UPDATE shots SET video_status = 'failed' WHERE id = ?", [req.params.id]);
        const [updated] = await db.query('SELECT * FROM shots WHERE id = ?', [req.params.id]);
        return res.json({ success: true, data: { ...updated[0], error: taskData.error || 'Video generation failed' } });
      } else {
        const newStatus = taskData.status || shot.video_status;
        if (newStatus !== shot.video_status) {
          await db.query('UPDATE shots SET video_status = ? WHERE id = ?', [newStatus, req.params.id]);
        }
        const [updated] = await db.query('SELECT * FROM shots WHERE id = ?', [req.params.id]);
        return res.json({ success: true, data: updated[0] });
      }
    }

    res.json({ success: true, data: shot });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
