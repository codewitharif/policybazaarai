const { DataTypes } = require('sequelize');
const sequelize = require('../db/db');
const Product = require('./productModels');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Product, key: 'id' }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Relationships
Product.hasMany(Category, { foreignKey: 'product_id' });
Category.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = Category;
