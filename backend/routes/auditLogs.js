const router = require('express').Router();
const c = require('../controllers/auditController');
const auth = require('../middleware/auth');

router.get('/', auth, auth.checkRole(['admin']), c.list);

module.exports = router;
