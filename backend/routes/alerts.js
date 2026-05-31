const router = require('express').Router();
const c = require('../controllers/alertController');
const auth = require('../middleware/auth');

router.get('/alerts', auth, c.list);
router.get('/alerts/history', auth, c.listHistory);
router.put('/alerts/:id/resolve', auth, auth.checkRole(['admin']), c.resolve);
router.get('/dashboard/summary', auth, c.summary);

module.exports = router;

