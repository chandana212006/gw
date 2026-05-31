const db = require('../config/db');

exports.list = async (_req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.unreadCount = async (_req, res, next) => {
  try {
    const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM notifications WHERE is_read = FALSE');
    res.json({ count });
  } catch (err) { next(err); }
};

exports.markAsRead = async (_req, res, next) => {
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
    res.json({ ok: true });
  } catch (err) { next(err); }
};
