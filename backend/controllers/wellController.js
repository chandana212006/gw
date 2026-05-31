const db = require('../config/db');
const audit = require('../middleware/audit');

exports.list = async (req, res, next) => {
  try {
    const showDeleted = req.query.show_deleted === 'true';
    const query = showDeleted
      ? 'SELECT * FROM well ORDER BY well_id'
      : 'SELECT * FROM well WHERE is_deleted = FALSE ORDER BY well_id';
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { well_name, district, taluk, latitude, longitude, threshold_level } = req.body;
    const [r] = await db.query(
      `INSERT INTO well (well_name, district, taluk, latitude, longitude, threshold_level)
       VALUES (?,?,?,?,?,?)`,
      [well_name, district, taluk, latitude, longitude, threshold_level]
    );
    const wellId = r.insertId;

    // Audit Logging
    await audit.logAction(req.user?.user_id, 'INSERT', 'well', wellId, { well_name, district });

    // Notification
    await db.query('INSERT INTO notifications (message) VALUES (?)', [
      `New Well "${well_name}" added in ${district}.`
    ]);

    res.status(201).json({ well_id: wellId });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { well_name, district, taluk, latitude, longitude, threshold_level } = req.body;
    await db.query(
      `UPDATE well SET well_name=?, district=?, taluk=?, latitude=?, longitude=?, threshold_level=?
         WHERE well_id=?`,
      [well_name, district, taluk, latitude, longitude, threshold_level, req.params.id]
    );

    // Audit Logging
    await audit.logAction(req.user?.user_id, 'UPDATE', 'well', req.params.id, { well_name, district });

    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    // Soft Delete
    await db.query('UPDATE well SET is_deleted = TRUE WHERE well_id = ?', [req.params.id]);

    // Audit Logging
    await audit.logAction(req.user?.user_id, 'DELETE', 'well', req.params.id, 'Soft deleted well');

    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.restore = async (req, res, next) => {
  try {
    await db.query('UPDATE well SET is_deleted = FALSE WHERE well_id = ?', [req.params.id]);

    // Audit Logging
    await audit.logAction(req.user?.user_id, 'RESTORE', 'well', req.params.id, 'Restored soft deleted well');

    res.json({ ok: true });
  } catch (err) { next(err); }
};
