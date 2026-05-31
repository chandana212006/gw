USE groundwater_db;
SHOW TABLES;
-- =====================================================================
-- Groundwater Monitoring DBMS — Schema (3NF)
-- =====================================================================
-- Each table is normalized: no repeating groups, every non-key attribute
-- depends on the whole primary key, no transitive dependencies.
-- =====================================================================

DROP DATABASE IF EXISTS groundwater_db;
CREATE DATABASE groundwater_db;
USE groundwater_db;

-- ---------------------------------------------------------------------
-- USERS — admin accounts that can log in to the dashboard.
-- Kept separate from any monitoring entity (separation of concerns).
-- ---------------------------------------------------------------------
CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,       -- bcrypt hash, never plaintext
  role          VARCHAR(20)  NOT NULL DEFAULT 'admin',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- WELL — master table of monitoring wells. One row per physical well.
-- threshold_level is the critical groundwater depth that triggers alerts.
-- ---------------------------------------------------------------------
CREATE TABLE well (
  well_id         INT AUTO_INCREMENT PRIMARY KEY,
  well_name       VARCHAR(100) NOT NULL,
  district        VARCHAR(80)  NOT NULL,
  taluk           VARCHAR(80)  NOT NULL,
  latitude        DECIMAL(9,6) NOT NULL,
  longitude       DECIMAL(9,6) NOT NULL,
  threshold_level DECIMAL(8,2) NOT NULL CHECK (threshold_level > 0),
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_well_district (district)
);

-- ---------------------------------------------------------------------
-- WATER_LEVEL — time-series measurements per well (1:N with well).
-- FK to well with CASCADE so deleting a well removes its readings.
-- ---------------------------------------------------------------------
CREATE TABLE water_level (
  measurement_id INT AUTO_INCREMENT PRIMARY KEY,
  well_id        INT          NOT NULL,
  water_level    DECIMAL(8,2) NOT NULL CHECK (water_level >= 0),
  recorded_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wl_well FOREIGN KEY (well_id)
      REFERENCES well(well_id) ON DELETE CASCADE,
  INDEX idx_wl_well_time (well_id, recorded_at)
);

-- ---------------------------------------------------------------------
-- RAINFALL — daily rainfall per district. Independent of wells.
-- ---------------------------------------------------------------------
CREATE TABLE rainfall (
  rainfall_id     INT AUTO_INCREMENT PRIMARY KEY,
  district        VARCHAR(80)  NOT NULL,
  rainfall_amount DECIMAL(7,2) NOT NULL CHECK (rainfall_amount >= 0),  -- mm
  rainfall_date   DATE         NOT NULL,
  INDEX idx_rainfall_district_date (district, rainfall_date)
);

-- ---------------------------------------------------------------------
-- ALERT — generated automatically by trigger when water_level < threshold.
-- Stored separately so dashboard can fetch active alerts quickly.
-- ---------------------------------------------------------------------
CREATE TABLE alert (
  alert_id   INT AUTO_INCREMENT PRIMARY KEY,
  well_id    INT          NOT NULL,
  severity   VARCHAR(20)  NOT NULL,         -- LOW / MEDIUM / HIGH
  message    VARCHAR(255) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alert_well FOREIGN KEY (well_id)
      REFERENCES well(well_id) ON DELETE CASCADE,
  INDEX idx_alert_well (well_id)
);
