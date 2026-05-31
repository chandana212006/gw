USE groundwater_db;

SELECT * FROM users;
-- =====================================================================
-- Sample dummy data
-- Default admin: admin / admin123  (bcrypt hash below)
-- =====================================================================
USE groundwater_db;

INSERT INTO users (username, password_hash, role) VALUES
('admin', '$2b$10$X0bV5cXJktAatl/c59gsy.X.keA.HwrabNgEAbcHWEyJClM4SV/Ai', 'admin');
-- ^ bcrypt hash of 'admin123' (cost 10)

INSERT INTO well (well_name, district, taluk, latitude, longitude, threshold_level) VALUES
('Well-A1', 'Chennai',   'Tambaram',  12.9249, 80.1000, 10.00),
('Well-B2', 'Coimbatore','Pollachi',  10.6586, 77.0086,  8.50),
('Well-C3', 'Madurai',   'Melur',      9.9395, 78.3322, 12.00),
('Well-D4', 'Salem',     'Attur',     11.5946, 78.1665,  9.00);

INSERT INTO rainfall (district, rainfall_amount, rainfall_date) VALUES
('Chennai',    25.5, CURDATE() - INTERVAL 2 DAY),
('Chennai',    12.0, CURDATE() - INTERVAL 1 DAY),
('Coimbatore',  5.0, CURDATE() - INTERVAL 1 DAY),
('Madurai',     0.0, CURDATE()),
('Salem',      18.3, CURDATE());

-- Some readings — the trigger will auto-create alerts for low ones.
INSERT INTO water_level (well_id, water_level, recorded_at) VALUES
(1, 12.5, NOW() - INTERVAL 3 DAY),
(1,  9.2, NOW() - INTERVAL 1 DAY),   -- below threshold 10 → LOW alert
(2,  7.0, NOW() - INTERVAL 2 DAY),   -- below 8.5 → LOW
(2,  3.5, NOW()),                    -- below 8.5*0.5 → HIGH
(3, 13.0, NOW() - INTERVAL 1 DAY),
(4,  8.8, NOW());
