const router = require('express').Router();
const c = require('../controllers/userController');
const auth = require('../middleware/auth');

router.use(auth, auth.checkRole(['admin']));

router.get('/', c.list);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
