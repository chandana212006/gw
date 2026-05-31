USE groundwater_db;

-- 1. Re-create the trigger (in case it was never applied)
DROP TRIGGER IF EXISTS trg_water_level_alert;

DELIMITER //
CREATE TRIGGER trg_water_level_alert
BEFORE INSERT ON water_level
FOR EACH ROW
BEGIN
  DECLARE v_threshold  DECIMAL(8,2);
  DECLARE v_well_name  VARCHAR(100);
  DECLARE v_severity   VARCHAR(20);

  SELECT threshold_level, well_name
    INTO v_threshold, v_well_name
    FROM well
   WHERE well_id = NEW.well_id;

  IF NEW.water_level < v_threshold THEN
      IF NEW.water_level < (v_threshold * 0.5) THEN
          SET v_severity = 'HIGH';
      ELSEIF NEW.water_level < (v_threshold * 0.8) THEN
          SET v_severity = 'MEDIUM';
      ELSE
          SET v_severity = 'LOW';
      END IF;

      INSERT INTO alert (well_id, severity, message)
      VALUES (
        NEW.well_id,
        v_severity,
        CONCAT('Well "', v_well_name, '" water level ', NEW.water_level,
               ' below threshold ', v_threshold)
      );
  END IF;
END//
DELIMITER ;

-- 2. Back-fill alerts for existing water_level rows that are below threshold
-- (trigger only fires on INSERT, so past rows need manual back-fill)
INSERT INTO alert (well_id, severity, message)
SELECT
    wl.well_id,
    CASE
        WHEN wl.water_level < (w.threshold_level * 0.5) THEN 'HIGH'
        WHEN wl.water_level < (w.threshold_level * 0.8) THEN 'MEDIUM'
        ELSE 'LOW'
    END,
    CONCAT('Well "', w.well_name, '" water level ', wl.water_level,
           ' below threshold ', w.threshold_level)
FROM water_level wl
JOIN well w ON w.well_id = wl.well_id
WHERE wl.water_level < w.threshold_level
  AND NOT EXISTS (
      SELECT 1 FROM alert a
      WHERE a.well_id = wl.well_id
  );

-- 3. Verify results
SELECT 'Trigger' AS check_item, COUNT(*) AS count
  FROM information_schema.TRIGGERS
 WHERE TRIGGER_SCHEMA = 'groundwater_db'
UNION ALL
SELECT 'Alerts', COUNT(*) FROM alert
UNION ALL
SELECT 'Wells', COUNT(*) FROM well
UNION ALL
SELECT 'Water Levels', COUNT(*) FROM water_level;
