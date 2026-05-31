USE groundwater_db;

-- 1. Add soft-delete columns
ALTER TABLE well ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE water_level ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE rainfall ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- 2. Enhance alert columns
ALTER TABLE alert ADD COLUMN status VARCHAR(20) DEFAULT 'Active';
ALTER TABLE alert ADD COLUMN assigned_to VARCHAR(50) DEFAULT NULL;
ALTER TABLE alert ADD COLUMN resolution_note TEXT DEFAULT NULL;
ALTER TABLE alert ADD COLUMN resolved_at DATETIME DEFAULT NULL;

-- 3. Create Alert History table
CREATE TABLE IF NOT EXISTS alert_history (
  history_id      INT AUTO_INCREMENT PRIMARY KEY,
  alert_id        INT,
  well_id         INT,
  severity        VARCHAR(20),
  message         VARCHAR(255),
  created_at      DATETIME,
  status          VARCHAR(20) DEFAULT 'Resolved',
  assigned_to     VARCHAR(50),
  resolution_note TEXT,
  resolved_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NULL,
  action      VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE, RESTORE
  table_name  VARCHAR(50) NOT NULL,
  record_id   INT NOT NULL,
  details     TEXT,
  timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  message     VARCHAR(255) NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Add Optimizations & Indexes
ALTER TABLE well ADD INDEX idx_well_is_deleted (is_deleted);
ALTER TABLE water_level ADD INDEX idx_wl_is_deleted (is_deleted);
ALTER TABLE rainfall ADD INDEX idx_rf_is_deleted (is_deleted);
ALTER TABLE alert ADD INDEX idx_alert_status (status);

-- 7. Create/Replace District_Rainfall_Impact View
CREATE OR REPLACE VIEW District_Rainfall_Impact AS
SELECT 
    w.district,
    DATE(wl.recorded_at) AS date_recorded,
    AVG(r.rainfall_amount) AS avg_rainfall,
    AVG(wl.water_level) AS avg_water_level
FROM well w
JOIN water_level wl ON wl.well_id = w.well_id AND wl.is_deleted = FALSE
LEFT JOIN rainfall r ON r.district = w.district AND r.rainfall_date = DATE(wl.recorded_at) AND r.is_deleted = FALSE
WHERE w.is_deleted = FALSE
GROUP BY w.district, DATE(wl.recorded_at);
