const router = require('express').Router();
const c = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

router.get('/rainfall-impact', auth, c.rainfallImpact);

module.exports = router;
