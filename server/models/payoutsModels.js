const { DataTypes } = require('sequelize');
const sequelize = require('../db/db');
const CustomerPolicy = require('./customerPolicyLinkModels');

const Payout = sequelize.define('Payout', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  customer_policy_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: CustomerPolicy, key: 'id' }
  },
  sale_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  commission_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Paid', 'Pending', 'Processing'),
    defaultValue: 'Pending'
  },
  payout_date: { type: DataTypes.DATE }
}, {
  tableName: 'payouts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

CustomerPolicy.hasMany(Payout, { foreignKey: 'customer_policy_id' });
Payout.belongsTo(CustomerPolicy, { foreignKey: 'customer_policy_id' });

module.exports = Payout;
