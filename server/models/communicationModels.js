const { DataTypes } = require('sequelize');
const sequelize = require('../db/db');
const User = require('./userModels');
const Customer = require('./customerModels');

const CommunicationLog = sequelize.define('CommunicationLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Customer, key: 'id' }
  },
  type: {
    type: DataTypes.ENUM('Call', 'Email', 'WhatsApp', 'SMS', 'Meeting'),
    allowNull: false,
  },
    direction: {
    type: DataTypes.ENUM('Outgoing', 'Incoming'),
    defaultValue: 'Outgoing',
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true,
  },
    subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
status: {
  type: DataTypes.ENUM('Pending', 'Completed', 'Overdue'),
  allowNull: false,
  defaultValue: 'Pending',
},
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  notes: { type: DataTypes.TEXT }
}, {
  tableName: 'communication_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

const Chat = sequelize.define('Chat', {
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
  agent_id: {
    type: DataTypes.INTEGER,
    references: { model: User, key: 'id' },
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Pending', 'Closed', 'AI_Handled'),
    defaultValue: 'Active'
  }
}, {
  tableName: 'chats',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  chat_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Chat, key: 'id' }
  },
  sender_type: {
    type: DataTypes.ENUM('Staff', 'Customer', 'AI'),
    allowNull: false
  },
  sender_id: {
    type: DataTypes.INTEGER
  },
  message_text: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Relationships
User.hasMany(CommunicationLog, { foreignKey: 'assigned_to' });
CommunicationLog.belongsTo(User, { foreignKey: 'assigned_to' });

Customer.hasMany(CommunicationLog, { foreignKey: 'customer_id' });
CommunicationLog.belongsTo(Customer, { foreignKey: 'customer_id' });

Customer.hasMany(Chat, { foreignKey: 'customer_id' });
Chat.belongsTo(Customer, { foreignKey: 'customer_id' });

User.hasMany(Chat, { foreignKey: 'agent_id' });
Chat.belongsTo(User, { foreignKey: 'agent_id', as: 'Agent' });

Chat.hasMany(Message, { foreignKey: 'chat_id' });
Message.belongsTo(Chat, { foreignKey: 'chat_id' });

module.exports = { CommunicationLog, Chat, Message };
