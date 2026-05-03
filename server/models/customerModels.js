const { DataTypes } = require('sequelize');
const sequelize = require('../db/db');
const Category = require('./categoryModels');
const User = require('./userModels');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: { type: DataTypes.TEXT },
  city: { type: DataTypes.STRING },
  dob: { type: DataTypes.DATEONLY },
  policy_category_id: {
    type: DataTypes.INTEGER,
    references: { model: Category, key: 'id' }
  },
  status: {
    type: DataTypes.ENUM('New', 'Contacted', 'Qualified', 'Active', 'Inactive', 'Closed', 'Lost'),
    defaultValue: 'New'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Medium'
  },
  customer_type: {
    type: DataTypes.ENUM('Hot', 'Warm', 'Cold'),
    defaultValue: 'Cold'
  },
  source: { type: DataTypes.STRING },
  customer_photo: { type: DataTypes.STRING },
  id_photo: { type: DataTypes.STRING },
  verification_status: {
    type: DataTypes.ENUM('Pending', 'Verified', 'Failed'),
    defaultValue: 'Pending'
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    references: { model: User, key: 'id' },
    allowNull: true
  },
  conversion_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'customers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Relationships
Category.hasMany(Customer, { foreignKey: 'policy_category_id' });
Customer.belongsTo(Category, { foreignKey: 'policy_category_id' });

User.hasMany(Customer, { foreignKey: 'assigned_to' });
Customer.belongsTo(User, { foreignKey: 'assigned_to' });

module.exports = Customer;
