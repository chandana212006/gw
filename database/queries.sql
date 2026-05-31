-- =====================================================================
-- Important SQL queries used by the application
-- =====================================================================
USE groundwater_db;

-- 1. Login lookup
SELECT user_id, username, password_hash, role
  FROM users WHERE username = ?;

-- 2. Dashboard KPIs
SELECT COUNT(*) AS total_wells FROM well;
SELECT AVG(water_level) AS avg_level FROM water_level;
SELECT COUNT(*) AS active_alerts FROM alert;
SELECT * FROM rainfall ORDER BY rainfall_date DESC LIMIT 5;

-- 3. Dashboard summary (uses the VIEW)
SELECT * FROM Dashboard_Summary;

-- 4. CRUD — Wells
INSERT INTO well (well_name, district, taluk, latitude, longitude, threshold_level)
VALUES (?,?,?,?,?,?);
UPDATE well SET well_name=?, district=?, taluk=?, latitude=?, longitude=?, threshold_level=?
 WHERE well_id=?;
DELETE FROM well WHERE well_id=?;
SELECT * FROM well ORDER BY well_id;

-- 5. Water level — insert (trigger may fire), list with JOIN
INSERT INTO water_level (well_id, water_level) VALUES (?, ?);

SELECT wl.measurement_id, wl.water_level, wl.recorded_at,
       w.well_name, w.district
  FROM water_level wl
  JOIN well w ON w.well_id = wl.well_id
 WHERE (? IS NULL OR wl.well_id = ?)
 ORDER BY wl.recorded_at DESC;

-- 6. Rainfall
INSERT INTO rainfall (district, rainfall_amount, rainfall_date) VALUES (?,?,?);
SELECT * FROM rainfall ORDER BY rainfall_date DESC;

-- 7. Alerts with well info (JOIN)
SELECT a.alert_id, a.severity, a.message, a.created_at,
       w.well_name, w.district
  FROM alert a
  JOIN well w ON w.well_id = a.well_id
 ORDER BY a.created_at DESC;
