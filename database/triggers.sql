-- =====================================================================
-- TRIGGER: trg_water_level_alert
-- Fires BEFORE INSERT on water_level. If the new reading is below the
-- well's threshold_level, automatically insert a row into `alert`.
-- =====================================================================
USE groundwater_db;

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
