const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/', cartController.getCart);
router.post('/add', cartController.addItem);
router.put('/update', cartController.updateItem);
router.delete('/remove', cartController.removeItem);

module.exports = router;
