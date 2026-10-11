const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/editor/timeline?project_id=
router.get('/timeline', async (req, res) => {
  const { project_id } = req.query;
  
  if (!project_id) {
    return res.json({ success: true, data: [], tracks: { video: [], audio: [], sfx: [] }, clips: [] });
  }

  try {
    const [clips] = await db.query(`
      SELECT tc.*, 
             ma.filename, ma.url_path, ma.asset_type as media_type, ma.file_path
      FROM timeline_clips tc
      LEFT JOIN media_assets ma ON ma.id = tc.media_asset_id
      WHERE tc.project_id = ?
      ORDER BY tc.track_type, tc.position ASC
    `, [project_id]);

    // Group by track type
    const tracks = { video: [], audio: [], music: [], sfx: [] };
    clips.forEach(c => {
      const type = c.track_type || 'video';
      if (!tracks[type]) tracks[type] = [];
      tracks[type].push(c);
    });

    res.json({ success: true, data: clips, tracks });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch timeline' });
  }
});

// POST /api/editor/timeline (add clip)
router.post('/timeline', async (req, res) => {
  const { project_id, track_type, media_asset_id, position, duration, clip_label } = req.body;
  if (!project_id || !track_type) {
    return res.status(400).json({ success: false, error: 'project_id and track_type required' });
  }

  try {
    // Get max position if not provided
    let pos = position;
    if (pos === undefined) {
      const [maxRow] = await db.query(
        'SELECT MAX(position) as max FROM timeline_clips WHERE project_id = ? AND track_type = ?',
        [project_id, track_type]
      );
      pos = (maxRow[0].max !== null ? maxRow[0].max : -1) + 1;
    }

    const clipId = req.body.id || ('clip_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
    await db.query(
      'INSERT INTO timeline_clips (id, project_id, track_type, media_asset_id, position, duration, clip_label) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [clipId, project_id, track_type, media_asset_id || null, pos, duration || 0, clip_label || '']
    );

    const [rows] = await db.query(`
      SELECT tc.*, ma.filename, ma.url_path, ma.asset_type as media_type
      FROM timeline_clips tc
      LEFT JOIN media_assets ma ON ma.id = tc.media_asset_id
      WHERE tc.id = ?
    `, [clipId]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add clip to timeline' });
  }
});

// PUT /api/editor/timeline/:id
router.put('/timeline/:id', async (req, res) => {
  const { position, duration, trim_start, trim_end, clip_label } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM timeline_clips WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, error: 'Clip not found' });

    const clip = existing[0];
    await db.query(
      'UPDATE timeline_clips SET position = ?, duration = ?, trim_start = ?, trim_end = ?, clip_label = ? WHERE id = ?',
      [
        position !== undefined ? position : clip.position,
        duration !== undefined ? duration : clip.duration,
        trim_start !== undefined ? trim_start : clip.trim_start,
        trim_end !== undefined ? trim_end : clip.trim_end,
        clip_label !== undefined ? clip_label : clip.clip_label,
        req.params.id,
      ]
    );

    const [updated] = await db.query('SELECT * FROM timeline_clips WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update clip' });
  }
});

// DELETE /api/editor/timeline/:id
router.delete('/timeline/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM timeline_clips WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Clip removed from timeline' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove clip' });
  }
});

// POST /api/editor/timeline/reorder
router.post('/timeline/reorder', async (req, res) => {
  const { clips } = req.body; // [{id, position}, ...]
  if (!Array.isArray(clips)) return res.status(400).json({ success: false, error: 'clips array required' });

  try {
    await Promise.all(clips.map(({ id, position }) =>
      db.query('UPDATE timeline_clips SET position = ? WHERE id = ?', [position, id])
    ));
    res.json({ success: true, data: { message: 'Timeline reordered' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reorder timeline' });
  }
});


// POST /api/editor/timeline/bulk
router.post('/timeline/bulk', async (req, res) => {
  const { project_id, clips } = req.body;
  if (!project_id) return res.status(400).json({ success: false, error: 'project_id required' });

  try {
    await db.query('DELETE FROM timeline_clips WHERE project_id = ?', [project_id]);
    
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      await db.query(
        'INSERT INTO timeline_clips \(id, project_id, track_type, media_asset_id, position, duration, trim_start, trim_end, clip_label, transition, volume, fade_in, fade_out, start_time, linked_to, speed, text_overlay\) VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)',
          [c.id || Date.now().toString() + i, project_id, c.track_type || 'video', c.media_asset_id || null, i, c.duration || 0, c.trim_start || 0, c.trim_end || 0, c.clip_label || '', c.transition || null, c.volume !== undefined ? c.volume : 1.0, c.fade_in || 0, c.fade_out || 0, c.start_time || 0, c.linked_to || null, c.speed !== undefined ? c.speed : 1.0, c.text_overlay || '']
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Bulk update failed' });
  }
});

module.exports = router;
