const { DataTypes } = require('sequelize');
const sequelize = require('../db/db');
const Category = require('./categoryModels');

const Policy = sequelize.define('Policy', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Category, key: 'id' }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: false
  },
  premium_base: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  coverage_amount: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: { type: DataTypes.TEXT },
  features: { type: DataTypes.JSON }
}, {
  tableName: 'policies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Relationships
Category.hasMany(Policy, { foreignKey: 'category_id' });
Policy.belongsTo(Category, { foreignKey: 'category_id' });

module.exports = Policy;
