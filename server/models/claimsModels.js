const { DataTypes } = require('sequelize');
const sequelize = require('../db/db');
const CustomerPolicy = require('./customerPolicyLinkModels');

const Claim = sequelize.define('Claim', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  claim_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  customer_policy_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: CustomerPolicy, key: 'id' }
  },
  amount_claimed: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  type: { type: DataTypes.STRING },
  status: {
    type: DataTypes.ENUM('Submitted', 'In Review', 'Approved', 'Rejected'),
    defaultValue: 'Submitted'
  },
  claim_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  description: { type: DataTypes.TEXT },
  attachment_url: { type: DataTypes.STRING }
}, {
  tableName: 'claims',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

CustomerPolicy.hasMany(Claim, { foreignKey: 'customer_policy_id' });
Claim.belongsTo(CustomerPolicy, { foreignKey: 'customer_policy_id' });

module.exports = Claim;
