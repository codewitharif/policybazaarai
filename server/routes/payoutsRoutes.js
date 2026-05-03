const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutControllers');

router.get('/', payoutController.getAllPayouts);
router.get('/:id', payoutController.getPayoutById);
router.post('/', payoutController.createPayout);
router.put('/:id', payoutController.updatePayoutStatus);
router.delete('/:id', payoutController.deletePayout);

module.exports = router;
