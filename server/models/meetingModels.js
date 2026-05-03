const { DataTypes } = require('sequelize');
const sequelize = require('../db/db');
const Customer = require('./customerModels');
const User = require('./userModels');

const Meeting = sequelize.define('Meeting', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  meeting_type: {
    type: DataTypes.ENUM('Google Meet', 'Zoom', 'Other'),
    defaultValue: 'Google Meet'
  },
  meeting_link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled'),
    defaultValue: 'Scheduled'
  },
  participants: {
    type: DataTypes.TEXT, // Simple comma separated or JSON string for now
    allowNull: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Customer,
      key: 'id'
    }
  },
  internal_participants: {
    type: DataTypes.TEXT, // JSON string of user IDs
    allowNull: true
  }
}, {
  tableName: 'meetings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Relationships
Meeting.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Meeting, { foreignKey: 'customer_id' });

module.exports = Meeting;
