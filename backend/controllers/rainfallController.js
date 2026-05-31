const db = require('../config/db');
const audit = require('../middleware/audit');

exports.list = async (req, res, next) => {
  try {
    const showDeleted = req.query.show_deleted === 'true';
    const query = showDeleted
      ? 'SELECT * FROM rainfall ORDER BY rainfall_date DESC'
      : 'SELECT * FROM rainfall WHERE is_deleted = FALSE ORDER BY rainfall_date DESC';
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { district, rainfall_amount, rainfall_date } = req.body;
    const [r] = await db.query(
      'INSERT INTO rainfall (district, rainfall_amount, rainfall_date) VALUES (?,?,?)',
      [district, rainfall_amount, rainfall_date]
    );
    const rainfallId = r.insertId;

    // Audit Logging
    await audit.logAction(req.user?.user_id, 'INSERT', 'rainfall', rainfallId, { district, rainfall_amount });

    // Notification
    await db.query('INSERT INTO notifications (message) VALUES (?)', [
      `New Rainfall reading of ${rainfall_amount}mm recorded in ${district}.`
    ]);

    res.status(201).json({ rainfall_id: rainfallId });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.query('UPDATE rainfall SET is_deleted = TRUE WHERE rainfall_id=?', [req.params.id]);

    // Audit Logging
    await audit.logAction(req.user?.user_id, 'DELETE', 'rainfall', req.params.id, 'Soft deleted rainfall entry');

    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.restore = async (req, res, next) => {
  try {
    await db.query('UPDATE rainfall SET is_deleted = FALSE WHERE rainfall_id=?', [req.params.id]);

    // Audit Logging
    await audit.logAction(req.user?.user_id, 'RESTORE', 'rainfall', req.params.id, 'Restored rainfall entry');

    res.json({ ok: true });
  } catch (err) { next(err); }
};

