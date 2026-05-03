const QuestionAnswer = require('../models/questionAnswerModels');

const questionAnswerController = {
  saveAnswer: async (req, res) => {
    try {
      const answer = await QuestionAnswer.create(req.body);
      res.status(201).json(answer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  getAnswersByCustomer: async (req, res) => {
    try {
      const answers = await QuestionAnswer.findAll({
        where: { customer_id: req.params.customerId },
        include: ['Question']
      });
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = questionAnswerController;
