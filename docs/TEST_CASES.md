# Sample Test Cases

## Authentication

| # | Test                       | Input                          | Expected                       |
|---|----------------------------|--------------------------------|--------------------------------|
| 1 | Valid login                | admin / admin123               | 200 + JWT token                |
| 2 | Invalid password           | admin / wrong                  | 401 Invalid credentials        |
| 3 | Missing token on `/wells`  | no Authorization header        | 401 Missing token              |

## Wells CRUD

| # | Test            | Input                                                       | Expected             |
|---|-----------------|-------------------------------------------------------------|----------------------|
| 4 | Add well        | name=Well-X, district=Erode, taluk=Gobi, threshold=10       | 201 + new well_id    |
| 5 | List wells      | GET /api/wells                                              | Array including Well-X |
| 6 | Update well     | PUT threshold=15                                            | 200, updated         |
| 7 | Delete well     | DELETE /api/wells/:id                                       | 200; cascades readings & alerts |

## Trigger (most important)

| # | Test                                  | Input                              | Expected                                  |
|---|---------------------------------------|------------------------------------|-------------------------------------------|
| 8 | Reading above threshold               | water_level=20 for Well-A1 (th=10) | 201; no new alert row                     |
| 9 | Reading below threshold (LOW)         | water_level=9 for Well-A1          | 201; 1 alert with severity=LOW            |
|10 | Reading well below threshold (HIGH)   | water_level=4 for Well-A1          | 201; alert with severity=HIGH             |

Verification SQL:
```sql
SELECT COUNT(*) FROM alert WHERE well_id = 1;
```

## View

| # | Test                       | Query                              | Expected                                 |
|---|----------------------------|------------------------------------|------------------------------------------|
|11 | Dashboard_Summary present  | SELECT * FROM Dashboard_Summary    | One row per well, alert_status=OK/ALERT  |

## Rainfall

| # | Test           | Input                                  | Expected   |
|---|----------------|----------------------------------------|------------|
|12 | Add rainfall   | district=Chennai, amount=30, date=today| 201        |
|13 | Negative amount| amount=-5                              | DB CHECK constraint fails |
