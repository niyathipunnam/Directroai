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

// GET /api/storyboards?project_id=
router.get('/', async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ success: false, error: 'project_id required' });
  try {
    const [boards] = await db.query('SELECT * FROM storyboards WHERE project_id = ? ORDER BY created_at DESC', [project_id]);

    // Load shots for each storyboard
    const data = await Promise.all(boards.map(async (board) => {
      const [shots] = await db.query('SELECT * FROM shots WHERE storyboard_id = ? ORDER BY shot_number ASC', [board.id]);
      return { ...board, shots };
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch storyboards' });
  }
});

// GET /api/storyboards/:id
router.get('/:id', async (req, res) => {
  try {
    const [boards] = await db.query('SELECT * FROM storyboards WHERE id = ?', [req.params.id]);
    if (boards.length === 0) return res.status(404).json({ success: false, error: 'Storyboard not found' });

    const [shots] = await db.query('SELECT * FROM shots WHERE storyboard_id = ? ORDER BY shot_number ASC', [req.params.id]);
    res.json({ success: true, data: { ...boards[0], shots } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch storyboard' });
  }
});

// POST /api/storyboards
router.post('/', async (req, res) => {
  const { project_id, character_id, environment_id, story_description } = req.body;
  if (!project_id || !story_description) {
    return res.status(400).json({ success: false, error: 'project_id and story_description are required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO storyboards (project_id, character_id, environment_id, story_description) VALUES (?, ?, ?, ?)',
      [project_id, character_id || null, environment_id || null, story_description]
    );
    const [boards] = await db.query('SELECT * FROM storyboards WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: { ...boards[0], shots: [] } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/storyboards/:id/generate
router.post('/:id/generate', async (req, res) => {
  try {
    const [boards] = await db.query('SELECT * FROM storyboards WHERE id = ?', [req.params.id]);
    if (boards.length === 0) return res.status(404).json({ success: false, error: 'Storyboard not found' });

    const board = boards[0];
    const { num_shots = 4 } = req.body;

    // Get character and environment info
    let character = null, environment = null;
    if (board.character_id) {
      const [chars] = await db.query('SELECT * FROM characters WHERE id = ?', [board.character_id]);
      character = chars[0] || null;
    }
    if (board.environment_id) {
      const [envs] = await db.query('SELECT * FROM environments WHERE id = ?', [board.environment_id]);
      environment = envs[0] || null;
    }

    const payload = {
      story_description: board.story_description,
      project_id: board.project_id,
      character_description: character?.description || '',
      environment_description: environment?.description || '',
      character_image_path: character?.image_path || null,
      environment_image_path: environment?.image_path || null,
      num_shots: Math.min(Math.max(parseInt(num_shots) || 4, 2), 6),
    };

    // This call waits for generation (FastAPI processes synchronously for storyboard)
    const result = await aiService.generateStoryboard(payload);

    if (result.shots && result.shots.length > 0) {
      // Delete existing shots for this storyboard (regeneration)
      await db.query('DELETE FROM shots WHERE storyboard_id = ?', [req.params.id]);

      // Insert new shots
      for (const shot of result.shots) {
        const url_path = shot.image_path ? toUrlPath(shot.image_path) : null;
        await db.query(
          'INSERT INTO shots (storyboard_id, shot_number, description, image_path, image_url, motion_prompt, camera_movement) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [req.params.id, shot.shot_number, shot.description, shot.image_path || null, url_path, shot.motion_prompt || '', shot.camera_movement || '']
        );
        // Save to media_assets
        if (shot.image_path) {
          await db.query(
            'INSERT INTO media_assets (project_id, asset_type, filename, file_path, url_path, source) VALUES (?, ?, ?, ?, ?, ?)',
            [board.project_id, 'storyboard_image', path.basename(shot.image_path), shot.image_path, url_path, 'generated']
          );
        }
      }
    }

    // Return updated storyboard with shots
    const [updatedShots] = await db.query('SELECT * FROM shots WHERE storyboard_id = ? ORDER BY shot_number ASC', [req.params.id]);
    res.json({ success: true, data: { ...board, shots: updatedShots } });
  } catch (err) {
    console.error('Storyboard generate error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Storyboard generation failed' });
  }
});

module.exports = router;
