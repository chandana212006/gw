const db = require('../config/db');

exports.rainfallImpact = async (_req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM District_Rainfall_Impact ORDER BY date_recorded ASC');
    res.json(rows);
  } catch (err) { next(err); }
};
