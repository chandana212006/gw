const db = require('../config/db');
const audit = require('../middleware/audit');

exports.list = async (_req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT a.alert_id, a.severity, a.message, a.created_at, a.status, a.assigned_to, a.resolution_note,
              w.well_name, w.district
         FROM alert a
         JOIN well w ON w.well_id = a.well_id
        ORDER BY a.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.summary = async (_req, res, next) => {
  try {
    const [[{ total_wells }]] = await db.query('SELECT COUNT(*) AS total_wells FROM well WHERE is_deleted = FALSE');
    const [[{ avg_level }]]   = await db.query('SELECT AVG(water_level) AS avg_level FROM water_level WHERE is_deleted = FALSE');
    const [[{ active_alerts }]] = await db.query("SELECT COUNT(*) AS active_alerts FROM alert WHERE status != 'Resolved'");
    const [[{ total_rainfall }]] = await db.query('SELECT COUNT(*) AS total_rainfall FROM rainfall WHERE is_deleted = FALSE');
    const [[{ max_level }]]   = await db.query('SELECT MAX(water_level) AS max_level FROM water_level WHERE is_deleted = FALSE');
    const [[{ min_level }]]   = await db.query('SELECT MIN(water_level) AS min_level FROM water_level WHERE is_deleted = FALSE');
    const [[{ critical_wells }]] = await db.query("SELECT COUNT(DISTINCT well_id) AS critical_wells FROM alert WHERE status != 'Resolved'");
    const [[{ districts_monitored }]] = await db.query('SELECT COUNT(DISTINCT district) AS districts_monitored FROM well WHERE is_deleted = FALSE');

    const [recent_rainfall] = await db.query(
      'SELECT * FROM rainfall WHERE is_deleted = FALSE ORDER BY rainfall_date DESC LIMIT 5'
    );
    const [dashboard] = await db.query('SELECT * FROM Dashboard_Summary');

    // Bar chart data: Avg water level by district
    const [district_averages] = await db.query(
      `SELECT w.district, AVG(wl.water_level) AS avg_level
         FROM well w
         JOIN water_level wl ON wl.well_id = w.well_id AND wl.is_deleted = FALSE
        WHERE w.is_deleted = FALSE
        GROUP BY w.district`
    );

    // Pie chart safety distribution
    const [[safety_distribution]] = await db.query(
      `SELECT 
        SUM(CASE WHEN max_severity = 'HIGH' THEN 1 ELSE 0 END) AS critical_count,
        SUM(CASE WHEN max_severity IN ('MEDIUM', 'LOW') THEN 1 ELSE 0 END) AS warning_count,
        SUM(CASE WHEN max_severity IS NULL THEN 1 ELSE 0 END) AS safe_count
      FROM (
        SELECT w.well_id, MAX(CASE WHEN a.severity = 'HIGH' THEN 'HIGH' WHEN a.severity = 'MEDIUM' THEN 'MEDIUM' ELSE 'LOW' END) AS max_severity
        FROM well w
        LEFT JOIN alert a ON a.well_id = w.well_id AND a.status != 'Resolved'
        WHERE w.is_deleted = FALSE
        GROUP BY w.well_id
      ) t`
    );

    // Recent activities (audit log summary)
    const [recent_activities] = await db.query(
      `SELECT al.action, al.table_name, al.timestamp, u.username, al.details
         FROM audit_logs al
         LEFT JOIN users u ON u.user_id = al.user_id
        ORDER BY al.timestamp DESC LIMIT 10`
    );

    res.json({
      total_wells,
      avg_level: avg_level ? Number(avg_level).toFixed(2) : null,
      active_alerts,
      total_rainfall,
      max_level: max_level ? Number(max_level).toFixed(2) : null,
      min_level: min_level ? Number(min_level).toFixed(2) : null,
      critical_wells,
      districts_monitored,
      recent_rainfall,
      dashboard,
      district_averages,
      safety_distribution: {
        safe: safety_distribution.safe_count || 0,
        warning: safety_distribution.warning_count || 0,
        critical: safety_distribution.critical_count || 0
      },
      recent_activities
    });
  } catch (err) { next(err); }
};

exports.resolve = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution_note, assigned_to } = req.body;

    const [rows] = await db.query('SELECT * FROM alert WHERE alert_id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Alert not found' });
    const alert = rows[0];

    // Insert into history
    await db.query(
      `INSERT INTO alert_history (alert_id, well_id, severity, message, created_at, status, assigned_to, resolution_note, resolved_at)
       VALUES (?, ?, ?, ?, ?, 'Resolved', ?, ?, NOW())`,
      [alert.alert_id, alert.well_id, alert.severity, alert.message, alert.created_at, assigned_to || 'System Admin', resolution_note || '']
    );

    // Delete from active alerts
    await db.query('DELETE FROM alert WHERE alert_id = ?', [id]);

    // Audit Logging
    await audit.logAction(req.user?.user_id, 'RESOLVE', 'alert', id, { resolution_note, assigned_to });

    // Notification
    await db.query('INSERT INTO notifications (message) VALUES (?)', [
      `Alert resolved for Well ${alert.well_id} by ${assigned_to || 'Admin'}.`
    ]);

    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.listHistory = async (_req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT h.history_id, h.alert_id, h.severity, h.message, h.created_at, h.status, h.assigned_to, h.resolution_note, h.resolved_at,
              w.well_name, w.district
         FROM alert_history h
         JOIN well w ON w.well_id = h.well_id
        ORDER BY h.resolved_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

