const router = require('express').Router();
const c = require('../controllers/wellController');
const auth = require('../middleware/auth');

router.get('/', auth, c.list);
router.post('/', auth, auth.checkRole(['admin', 'operator']), c.create);
router.put('/:id', auth, auth.checkRole(['admin']), c.update);
router.delete('/:id', auth, auth.checkRole(['admin']), c.remove);
router.put('/:id/restore', auth, auth.checkRole(['admin']), c.restore);

module.exports = router;

