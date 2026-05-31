# Database Schema Explanation

## Normalization (up to 3NF)

- **1NF** — every column holds an atomic value, no repeating groups.
- **2NF** — all tables use single-column surrogate primary keys
  (`well_id`, `measurement_id`, `rainfall_id`, `alert_id`), so every
  non-key attribute fully depends on the primary key.
- **3NF** — no transitive dependencies. For example, `water_level` stores
  only `well_id` and the measurement; well details (name, district, taluk)
  live in `well`, accessed via JOIN.

## Keys & Constraints

| Table        | PK              | FKs                              | Other constraints                            |
|--------------|-----------------|----------------------------------|----------------------------------------------|
| users        | user_id         | —                                | username UNIQUE, password_hash NOT NULL      |
| well         | well_id         | —                                | threshold_level CHECK (> 0)                  |
| water_level  | measurement_id  | well_id → well (CASCADE)         | water_level CHECK (>= 0)                     |
| rainfall     | rainfall_id     | —                                | rainfall_amount CHECK (>= 0)                 |
| alert        | alert_id        | well_id → well (CASCADE)         | severity NOT NULL                            |

## Indexes (why)

- `idx_well_district` — dashboard filters and rainfall joins by district.
- `idx_wl_well_time (well_id, recorded_at)` — fast "latest reading per well".
- `idx_rainfall_district_date` — sort/filter rainfall by district & date.
- `idx_alert_well` — count and list alerts per well.

## Views

- **Dashboard_Summary** — pre-joined per-well snapshot for the dashboard.

## Trigger

- **trg_water_level_alert** — BEFORE INSERT on `water_level`. Reads the
  well's threshold, classifies severity (LOW/MEDIUM/HIGH), and inserts a row
  into `alert` automatically — no application-side logic required.
