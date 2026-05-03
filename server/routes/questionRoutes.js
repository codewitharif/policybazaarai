const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionControllers');

router.get('/', questionController.getAllQuestions);
router.get('/category/:categoryId', questionController.getQuestionsByCategory);
router.post('/', questionController.createQuestion);
router.put('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;
