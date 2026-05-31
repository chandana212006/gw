# Groundwater Monitoring Dashboard (DBMS Mini Project)

A simple full-stack admin dashboard to manage groundwater monitoring wells,
water-level records, rainfall records and auto-generated alerts.

**Stack:** React (Vite) · Axios · React Router · Node.js · Express · MySQL · JWT

---

## Folder Structure

```
groundwater-dbms/
├── backend/                # Node + Express REST API (MVC)
│   ├── config/db.js        # MySQL connection pool
│   ├── controllers/        # Business logic per resource
│   ├── routes/             # Express routers
│   ├── middleware/auth.js  # JWT auth middleware
│   ├── server.js           # Entry point
│   ├── .env.example
│   └── package.json
├── frontend/               # React + Vite dashboard
│   ├── src/
│   │   ├── api/axios.js
│   │   ├── components/Sidebar.jsx
│   │   ├── pages/          # Login, Dashboard, Wells, WaterLevels, Rainfall, Alerts
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   └── package.json
├── database/
│   ├── schema.sql          # Tables, PKs, FKs, constraints, indexes
│   ├── triggers.sql        # BEFORE INSERT trigger on water_level
│   ├── views.sql           # Dashboard_Summary view
│   ├── seed.sql            # Sample dummy data
│   └── queries.sql         # Important SQL queries used by APIs
└── docs/
    ├── ER_DIAGRAM.md
    ├── SCHEMA_EXPLANATION.md
    ├── ARCHITECTURE.md
    └── TEST_CASES.md
```

---

## Setup Instructions

### 1. Database (MySQL)

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/triggers.sql
mysql -u root -p < database/views.sql
mysql -u root -p < database/seed.sql
```

Default admin: **username `admin` / password `admin123`** (seeded, bcrypt-hashed).

### 2. Backend

```bash
cd backend
cp .env.example .env       # then edit DB creds + JWT_SECRET
npm install
npm run dev                # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Login with `admin / admin123`.

---

## API Routes

| Method | Endpoint                    | Description                |
|--------|-----------------------------|----------------------------|
| POST   | `/api/auth/login`           | Admin login → JWT          |
| GET    | `/api/wells`                | List all wells             |
| POST   | `/api/wells`                | Create well                |
| PUT    | `/api/wells/:id`            | Update well                |
| DELETE | `/api/wells/:id`            | Delete well                |
| GET    | `/api/water-levels`         | List water-level records (optional `?well_id=`) |
| POST   | `/api/water-levels`         | Insert measurement (trigger may fire alert) |
| DELETE | `/api/water-levels/:id`     | Delete measurement         |
| GET    | `/api/rainfall`             | List rainfall records      |
| POST   | `/api/rainfall`             | Add rainfall record        |
| DELETE | `/api/rainfall/:id`         | Delete rainfall record     |
| GET    | `/api/alerts`               | List alerts                |
| GET    | `/api/dashboard/summary`    | KPI cards + Dashboard_Summary view |

All routes except `/api/auth/login` require `Authorization: Bearer <token>`.

---

## DBMS Highlights

- **3NF normalization** — separate tables for users, wells, water-level, rainfall, alerts.
- **Primary & foreign keys** with `ON DELETE CASCADE` where appropriate.
- **Indexes** on `well_id`, `district`, `recorded_at` for fast filters.
- **Trigger** `trg_water_level_alert` (BEFORE INSERT) compares `water_level`
  with the well's `threshold_level` and inserts into `alert` automatically.
- **View** `Dashboard_Summary` joins wells, latest water level, rainfall and alert status.
- **Constraints** — `NOT NULL`, `UNIQUE`, `CHECK` on positive measurements.

See `docs/` for ER diagram, schema explanation, architecture and test cases.
