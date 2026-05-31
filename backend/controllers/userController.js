const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.list = async (_req, res, next) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, role, created_at FROM users ORDER BY user_id');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    // Check if user already exists
    const [exists] = await db.query('SELECT user_id FROM users WHERE username = ?', [username]);
    if (exists.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [r] = await db.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, role]
    );

    res.status(201).json({ user_id: r.insertId, username, role });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { role } = req.body;
    await db.query('UPDATE users SET role = ? WHERE user_id = ?', [role, req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Don't allow deleting self or root admin
    const [user] = await db.query('SELECT username FROM users WHERE user_id = ?', [id]);
    if (user.length > 0 && user[0].username === 'admin') {
      return res.status(400).json({ error: 'Cannot delete the primary root administrator' });
    }
    
    await db.query('DELETE FROM users WHERE user_id = ?', [id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
};
