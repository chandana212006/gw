const db = require('../config/db');
const audit = require('../middleware/audit');

exports.list = async (req, res, next) => {
  try {
    const wellId = req.query.well_id || null;
    const showDeleted = req.query.show_deleted === 'true';
    const query = `
      SELECT wl.measurement_id, wl.water_level, wl.recorded_at, wl.is_deleted,
             w.well_name, w.district
        FROM water_level wl
        JOIN well w ON w.well_id = wl.well_id
       WHERE (? IS NULL OR wl.well_id = ?)
         AND (${showDeleted} = TRUE OR wl.is_deleted = FALSE)
       ORDER BY wl.recorded_at DESC`;
    const [rows] = await db.query(query, [wellId, wellId]);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { well_id, water_level } = req.body;
    // The BEFORE INSERT trigger will create an alert automatically if needed.
    const [r] = await db.query(
      'INSERT INTO water_level (well_id, water_level) VALUES (?, ?)',
      [well_id, water_level]
    );
    const measurementId = r.insertId;

    // Audit Logging
    await audit.logAction(req.user?.user_id, 'INSERT', 'water_level', measurementId, { well_id, water_level });

    // Check if the trigger auto-created a new alert for this insert
    const [alerts] = await db.query(
      `SELECT a.alert_id, a.severity, w.well_name 
         FROM alert a 
         JOIN well w ON w.well_id = a.well_id 
        WHERE a.well_id = ? 
        ORDER BY a.created_at DESC LIMIT 1`,
      [well_id]
    );
    if (alerts.length > 0) {
      // Create notification
      await db.query('INSERT INTO notifications (message) VALUES (?)', [
        `New Alert [${alerts[0].severity}] generated for Well "${alerts[0].well_name}" (Level: ${water_level}m).`
      ]);
    }

    res.status(201).json({ measurement_id: measurementId });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.query('UPDATE water_level SET is_deleted = TRUE WHERE measurement_id=?', [req.params.id]);

    // Audit Logging
    await audit.logAction(req.user?.user_id, 'DELETE', 'water_level', req.params.id, 'Soft deleted water level reading');

    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.restore = async (req, res, next) => {
  try {
    await db.query('UPDATE water_level SET is_deleted = FALSE WHERE measurement_id=?', [req.params.id]);

    // Audit Logging
    await audit.logAction(req.user?.user_id, 'RESTORE', 'water_level', req.params.id, 'Restored water level reading');

    res.json({ ok: true });
  } catch (err) { next(err); }
};
