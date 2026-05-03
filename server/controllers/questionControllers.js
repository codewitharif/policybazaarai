const Question = require('../models/questionModels');
const Category = require('../models/categoryModels');

const questionController = {
  getAllQuestions: async (req, res) => {
    try {
      const questions = await Question.findAll({ include: [Category] });
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  getQuestionsByCategory: async (req, res) => {
    try {
      const questions = await Question.findAll({
        where: { category_id: req.params.categoryId },
        order: [['sort_order', 'ASC']]
      });
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  createQuestion: async (req, res) => {
    try {
      const question = await Question.create(req.body);
      res.status(201).json(question);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  updateQuestion: async (req, res) => {
    try {
      const question = await Question.findByPk(req.params.id);
      if (!question) return res.status(404).json({ message: 'Question not found' });
      await question.update(req.body);
      res.json({ message: 'Question updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  deleteQuestion: async (req, res) => {
    try {
      const question = await Question.findByPk(req.params.id);
      if (!question) return res.status(404).json({ message: 'Question not found' });
      await question.destroy();
      res.json({ message: 'Question deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = questionController;
