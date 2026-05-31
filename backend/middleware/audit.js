const db = require('../config/db');

exports.logAction = async (userId, action, tableName, recordId, details) => {
  try {
    await db.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?)',
      [userId || null, action, tableName, recordId, details ? (typeof details === 'string' ? details : JSON.stringify(details)) : '']
    );
  } catch (err) {
    console.error('Audit logging error:', err);
  }
};
