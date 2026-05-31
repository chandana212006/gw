# Project Architecture

```text
+-----------------+      HTTP/JSON       +------------------+      SQL       +-----------+
|  React (Vite)   |  <---------------->  |  Express API     |  <---------->  |  MySQL    |
|  - Pages        |   Axios + JWT        |  - Controllers   |  mysql2 pool   |  - Tables |
|  - Components   |                      |  - Routes        |                |  - Views  |
|  - Sidebar nav  |                      |  - Middleware    |                |  - Trigger|
+-----------------+                      +------------------+                +-----------+
```

## Layers

1. **Presentation (React)** — pages call `/api/*` through a shared Axios
   instance that attaches the JWT.
2. **API (Express, MVC)** —
   - `routes/` define HTTP endpoints,
   - `controllers/` hold business logic and SQL calls,
   - `middleware/auth.js` validates JWT on protected routes.
3. **Data (MySQL)** — stores everything; triggers and views push logic into
   the database where it belongs.

## Request Flow (example: insert water level)

1. Admin submits form → `POST /api/water-levels` with JWT.
2. `auth` middleware verifies token.
3. `waterLevelController.create` runs `INSERT INTO water_level ...`.
4. **MySQL trigger** `trg_water_level_alert` fires BEFORE INSERT.
5. If the reading < threshold, the trigger inserts into `alert`.
6. Dashboard auto-reflects new alert via `Dashboard_Summary` view.
