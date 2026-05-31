require('dotenv').config();
const express = require('express');
const cors = require('cors');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.json({ ok: true, service: 'groundwater-api' }));

app.use('/api/auth', require('./routes/auth'));

// Protected resources
app.use('/api/wells',         auth, require('./routes/wells'));
app.use('/api/water-levels',  auth, require('./routes/waterLevels'));
app.use('/api/rainfall',      auth, require('./routes/rainfall'));
app.use('/api',               auth, require('./routes/alerts')); // /api/alerts + /api/dashboard/summary
app.use('/api/users',         require('./routes/users'));
app.use('/api/audit-logs',    require('./routes/auditLogs'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics',     require('./routes/analytics'));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

