const router = require('express').Router();
const c = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, c.list);
router.get('/unread-count', auth, c.unreadCount);
router.put('/mark-as-read', auth, c.markAsRead);

module.exports = router;
