const { DataTypes } = require('sequelize');
const sequelize = require('../db/db');
const Customer = require('./customerModels');
const Question = require('./questionModels');

const QuestionAnswer = sequelize.define('QuestionAnswer', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Customer, key: 'id' }
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Question, key: 'id' }
  },
  answer_text: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'question_answers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Relationships
Customer.hasMany(QuestionAnswer, { foreignKey: 'customer_id' });
QuestionAnswer.belongsTo(Customer, { foreignKey: 'customer_id' });

Question.hasMany(QuestionAnswer, { foreignKey: 'question_id' });
QuestionAnswer.belongsTo(Question, { foreignKey: 'question_id' });

module.exports = QuestionAnswer;
