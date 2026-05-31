SHOW FULL TABLES;
-- =====================================================================
-- VIEW: Dashboard_Summary
-- Single source for dashboard table: well name, latest water level,
-- district, latest rainfall in that district, and alert status.
-- =====================================================================
USE groundwater_db;

DROP VIEW IF EXISTS Dashboard_Summary;

CREATE VIEW Dashboard_Summary AS
SELECT
    w.well_id,
    w.well_name,
    w.district,
    w.threshold_level,
    (SELECT wl.water_level
       FROM water_level wl
      WHERE wl.well_id = w.well_id
      ORDER BY wl.recorded_at DESC
      LIMIT 1)                                            AS latest_water_level,
    (SELECT wl.recorded_at
       FROM water_level wl
      WHERE wl.well_id = w.well_id
      ORDER BY wl.recorded_at DESC
      LIMIT 1)                                            AS latest_reading_at,
    (SELECT r.rainfall_amount
       FROM rainfall r
      WHERE r.district = w.district
      ORDER BY r.rainfall_date DESC
      LIMIT 1)                                            AS latest_rainfall_mm,
    CASE
       WHEN EXISTS (SELECT 1 FROM alert a WHERE a.well_id = w.well_id)
       THEN 'ALERT' ELSE 'OK'
    END                                                   AS alert_status
FROM well w;
