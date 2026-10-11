const express = require('express');
const fs = require('fs');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

router.use(auth);



// GET /api/media?project_id=&type=
router.get('/', async (req, res) => {
  const { project_id, type } = req.query;

  try {
    let query = 'SELECT * FROM media_assets';
    const params = [];

    if (project_id && project_id !== 'undefined') {
      query += ' WHERE project_id = ?';
      params.push(project_id);
    } else {
      query += ' WHERE 1=1'; // Fallback if no project selected
    }

    if (type) {
      query += ' AND asset_type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';



    const [rows] = await db.query(query, params);

    // Group by asset_type
    const grouped = {};
    rows.forEach(r => {
      if (!grouped[r.asset_type]) grouped[r.asset_type] = [];
      grouped[r.asset_type].push(r);
    });

    res.json({ success: true, data: rows, grouped });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch media assets' });
  }
});


// DELETE /api/media/:id
router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM media_assets WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    
    const asset = rows[0];
    
    // Delete from DB
    await db.query('DELETE FROM media_assets WHERE id = ?', [req.params.id]);
    
    // Delete from timeline (if any)
    await db.query('DELETE FROM timeline_clips WHERE media_asset_id = ?', [req.params.id]);
    
    // Attempt to delete file from disk
    if (asset.file_path && fs.existsSync(asset.file_path)) {
      fs.unlinkSync(asset.file_path);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete asset' });
  }
});

const { uploadMedia } = require('../middleware/upload');
const path = require('path');

function toUrlPath(filePath) {
  if (!filePath) return null;
  const rel = filePath.replace(/\\/g, '/');
  const idx = rel.indexOf('/uploads/');
  return idx >= 0 ? rel.substring(idx) : '/uploads/' + path.basename(filePath);
}

// POST /api/media/upload
router.post('/upload', uploadMedia.single('file'), async (req, res) => {
  const { project_id, asset_type } = req.body;
  if (!project_id || !asset_type) return res.status(400).json({ success: false, error: 'project_id and asset_type required' });
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

  try {
    const image_path = req.file.path.replace(/\\/g, '/');
    const url_path = toUrlPath(image_path);

    // Save to media_assets
    const [result] = await db.query(
      'INSERT INTO media_assets (project_id, asset_type, filename, file_path, url_path, source) VALUES (?, ?, ?, ?, ?, ?)',
      [project_id, asset_type, req.body.name || req.file.originalname, image_path, url_path, 'upload']
    );

    // Also populate characters/environments table so it's a valid reference
    if (asset_type === 'character') {
      await db.query(
        'INSERT INTO characters (project_id, name, description, image_path, url_path, source, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [project_id, req.body.name || req.file.originalname, 'Uploaded reference image', image_path, url_path, 'upload', 'completed']
      );
    } else if (asset_type === 'environment') {
      await db.query(
        'INSERT INTO environments (project_id, name, description, image_path, url_path, source, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [project_id, req.body.name || req.file.originalname, 'Uploaded reference image', image_path, url_path, 'upload', 'completed']
      );
    }

    res.json({ success: true, data: { url_path, media_id: result.insertId } });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to upload media' });
  }
});

// POST /api/media/:id/animate
router.post('/:id/animate', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM media_assets WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Asset not found' });
    const asset = rows[0];
    if (!asset.file_path) return res.status(400).json({ success: false, error: 'No file attached' });

    const aiService = require('../services/aiService');
    const result = await aiService.generateVideo({ shot_id: 0, image_path: asset.file_path, prompt: req.body.prompt || '', motion_prompt: req.body.prompt || '', project_id: asset.project_id });

    await db.query(
      "INSERT INTO media_assets (project_id, asset_type, filename, file_path, url_path, source, task_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [asset.project_id, 'video', 'animated_' + asset.filename, null, null, 'generated', result.task_id]
    );
    res.json({ success: true, data: { task_id: result.task_id } });
  } catch (err) {
    console.error('Animate error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Animation failed' });
  }
});

module.exports = router;


