const db = require('../config/db');

exports.list = async (_req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT al.id, al.action, al.table_name, al.record_id, al.details, al.timestamp,
              u.username
         FROM audit_logs al
         LEFT JOIN users u ON u.user_id = al.user_id
        ORDER BY al.timestamp DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
};
