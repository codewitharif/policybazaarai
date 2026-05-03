const express = require('express');
const router = express.Router();
const questionAnswerController = require('../controllers/questionAnswerControllers');

router.post('/', questionAnswerController.saveAnswer);
router.get('/customer/:customerId', questionAnswerController.getAnswersByCustomer);

module.exports = router;
