const { DataTypes } = require('sequelize');
const sequelize = require('../db/db');

const Workflow = sequelize.define('Workflow', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Paused', 'Draft'),
    defaultValue: 'Draft'
  },
  trigger: {
    type: DataTypes.JSON, // { type: 'new_lead', config: {} }
    allowNull: false
  },
  conditions: {
    type: DataTypes.JSON, // [{ field: 'source', operator: 'equals', value: 'Facebook' }]
    allowNull: true,
    defaultValue: []
  },
  actions: {
    type: DataTypes.JSON, // [{ type: 'send_email', config: { template: 'welcome' } }]
    allowNull: false,
    defaultValue: []
  },
  last_run: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'workflows',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Workflow;
