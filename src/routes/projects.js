const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// All routes require auth
router.use(auth);

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM projects WHERE user_id = ? AND status != ? ORDER BY created_at DESC',
      [req.user.id, 'archived']
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

// POST /api/projects
router.post('/', async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Project name is required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)',
      [req.user.id, name.trim(), description || '']
    );
    const [rows] = await db.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch project' });
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req, res) => {
  const { name, description } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Project not found' });

    await db.query('UPDATE projects SET name = ?, description = ? WHERE id = ?', [
      name || rows[0].name,
      description !== undefined ? description : rows[0].description,
      req.params.id,
    ]);
    const [updated] = await db.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Project not found' });
    await db.query("UPDATE projects SET status = 'archived' WHERE id = ?", [req.params.id]);
    res.json({ success: true, data: { message: 'Project archived' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
});

module.exports = router;
