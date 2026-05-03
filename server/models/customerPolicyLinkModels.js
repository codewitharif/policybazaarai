const { DataTypes } = require('sequelize');
const sequelize = require('../db/db');
const Customer = require('./customerModels');
const Policy = require('./policyModels');

const CustomerPolicy = sequelize.define('CustomerPolicy', {
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
  policy_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Policy, key: 'id' }
  },
  policy_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Expired', 'Lapsed', 'Pending'),
    defaultValue: 'Active'
  },
  premium_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  start_date: { type: DataTypes.DATEONLY },
  expiry_date: { type: DataTypes.DATEONLY }
}, {
  tableName: 'customer_policies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Relationships
Customer.hasMany(CustomerPolicy, { foreignKey: 'customer_id' });
CustomerPolicy.belongsTo(Customer, { foreignKey: 'customer_id' });

Policy.hasMany(CustomerPolicy, { foreignKey: 'policy_id' });
CustomerPolicy.belongsTo(Policy, { foreignKey: 'policy_id' });

module.exports = CustomerPolicy;
