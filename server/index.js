const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const sequelize = require('./db/db');

// Import Models
const Customer = require('./models/customerModels');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const policyRoutes = require('./routes/policyRoutes');
const claimsRoutes = require('./routes/claimsRoutes');
const payoutsRoutes = require('./routes/payoutsRoutes');
const communicationRoutes = require('./routes/communicationRoutes');
const questionRoutes = require('./routes/questionRoutes');
const questionAnswerRoutes = require('./routes/questionAnswerRoutes');

const analyticsRoutes = require('./routes/analyticsRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this for production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/payouts', payoutsRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/question-answers', questionAnswerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('PolicyBazaar CRM API is running...');
});

// Socket.io logic
const { Chat, Message: ChatMessage } = require('./models/communicationModels');

const activeChats = new Map(); // customerSocketId -> { customerData, agentSocketId, chatId }
const pendingRequests = new Map(); // customerSocketId -> customerData
const aiChats = new Map(); // customerSocketId -> { customerData, messages: [] }

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('start_ai_chat', async (data) => {
    const { customerData } = data;
    
    // Fetch History from DB to populate the monitor for returning users
    let historyMessages = [];
    try {
      const dbMessages = await ChatMessage.findAll({
        include: [{
          model: Chat,
          where: { customer_id: customerData.id }
        }],
        order: [['created_at', 'ASC']]
      });
      historyMessages = dbMessages.map(m => ({
        text: m.message_text,
        sender: m.sender_type === 'Customer' ? 'user' : 'bot',
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
    } catch (e) {
      console.error('Error fetching history for start_ai_chat:', e);
    }

    aiChats.set(socket.id, { 
      customerData: { ...customerData, socketId: socket.id }, 
      messages: historyMessages 
    });
    
    console.log(`AI Chat started for ${customerData.name} with ${historyMessages.length} history messages`);
    io.emit('new_ai_chat', { ...customerData, socketId: socket.id, messages: historyMessages });

    // Find or create AI chat in DB
    try {
      let dbChat = await Chat.findOne({ where: { customer_id: customerData.id, status: 'AI' } });
      if (!dbChat) {
        await Chat.create({ customer_id: customerData.id, status: 'AI' });
      }
    } catch (e) {
      console.error('Error initializing AI chat in DB:', e);
    }
  });

  socket.on('ai_message', async (data) => {
    const { text, customerData } = data;
    const chat = aiChats.get(socket.id);
    if (chat) {
      const msg = { text, sender: 'user', time: new Date().toLocaleTimeString() };
      chat.messages.push(msg);
      io.emit('ai_chat_update', { customerSocketId: socket.id, message: msg });

      // Persist to DB
      try {
        let dbChat = await Chat.findOne({ where: { customer_id: customerData.id, status: 'AI' } });
        if (!dbChat) {
          dbChat = await Chat.create({ customer_id: customerData.id, status: 'AI' });
        }
        await ChatMessage.create({
          chat_id: dbChat.id,
          sender_type: 'Customer',
          sender_id: customerData.id,
          message_text: text
        });
      } catch (e) {
        console.error('Error saving AI user message to DB:', e);
      }
    }
  });

  socket.on('ai_response', async (data) => {
    const { text, customerSocketId } = data;
    const chat = aiChats.get(customerSocketId || socket.id);
    if (chat) {
      const msg = { text, sender: 'bot', time: new Date().toLocaleTimeString() };
      chat.messages.push(msg);
      io.emit('ai_chat_update', { customerSocketId: customerSocketId || socket.id, message: msg });

      // Persist to DB
      try {
        let dbChat = await Chat.findOne({ where: { customer_id: chat.customerData.id, status: 'AI' } });
        if (!dbChat) {
          dbChat = await Chat.create({ customer_id: chat.customerData.id, status: 'AI' });
        }
        await ChatMessage.create({
          chat_id: dbChat.id,
          sender_type: 'Staff', // Using Staff to represent AI in the DB for now
          sender_id: null,
          message_text: text
        });
      } catch (e) {
        console.error('Error saving AI response to DB:', e);
      }
    }
  });

  socket.on('request_ai_chat_history', (data) => {
    const { customerSocketId } = data;
    const chat = aiChats.get(customerSocketId);
    if (chat) {
      socket.emit('ai_chat_history', { customerSocketId, messages: chat.messages });
    }
  });

  socket.on('request_active_ai_chats', () => {
    const chats = Array.from(aiChats.values()).map(chat => ({
      ...chat.customerData,
      messages: chat.messages
    }));
    socket.emit('active_ai_chats', chats);
  });

  socket.on('takeover_chat', async (data) => {
    const { customerSocketId, agentId, agentName } = data;
    const aiChat = aiChats.get(customerSocketId);

    if (aiChat) {
      try {
        const customerData = aiChat.customerData;
        aiChats.delete(customerSocketId);

        // Create Chat record in DB
        const chatRecord = await Chat.create({
          customer_id: customerData.id,
          agent_id: agentId,
          status: 'Active'
        });

        activeChats.set(customerSocketId, { 
          customerData, 
          agentSocketId: socket.id, 
          agentId, 
          agentName,
          chatId: chatRecord.id 
        });

        // Notify customer that agent joined and AI is disabled
        io.to(customerSocketId).emit('agent_joined', { 
          agentId, 
          agentName, 
          agentSocketId: socket.id,
          mode: 'agent'
        });

        // Confirm to agent
        socket.emit('chat_joined', { customerData, chatId: chatRecord.id });
        
        // Notify all agents that this AI chat is now active with an agent
        io.emit('ai_chat_taken_over', { customerSocketId });

        console.log(`Agent ${agentName} took over AI chat with customer ${customerData.name}`);
      } catch (error) {
        console.error('Error taking over chat:', error);
        socket.emit('error', { message: 'Failed to take over chat' });
      }
    }
  });

  socket.on('request_chat', async (data) => {
    const { name, phone } = data;
    console.log(`Chat request from ${name} (${phone})`);

    try {
      // Find or create customer
      let customer = await Customer.findOne({ where: { phone } });
      let isNew = false;
      if (!customer) {
        customer = await Customer.create({ name, phone, status: 'New', customer_type: 'Warm', source: 'Chatbot' });
        isNew = true;
      }

      const customerData = {
        socketId: socket.id,
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        isNew
      };

      pendingRequests.set(socket.id, customerData);
      
      // Notify customer
      socket.emit('request_received', { 
        message: isNew ? 'Welcome! We are connecting you to an agent.' : `Found you, ${customer.name}! Connecting you to an agent.`,
        customer: customerData
      });

      // Broadcast to all agents
      io.emit('new_chat_request', customerData);
    } catch (error) {
      console.error('Error handling chat request:', error);
      socket.emit('error', { message: 'Failed to process chat request' });
    }
  });

  socket.on('join_chat', async (data) => {
    const { customerSocketId, agentId, agentName } = data;
    
    // Check if already active
    for (const [cSocketId, chat] of activeChats.entries()) {
      if (cSocketId === customerSocketId || chat.customerData.id === data.customerId) {
        chat.agentSocketId = socket.id;
        chat.agentId = agentId;
        chat.agentName = agentName;
        socket.emit('chat_joined', { customerData: chat.customerData, chatId: chat.chatId });
        return;
      }
    }

    const customerData = pendingRequests.get(customerSocketId);

    if (customerData) {
      try {
        pendingRequests.delete(customerSocketId);
        
        // Create Chat record in DB with agent_id
        const chatRecord = await Chat.create({
          customer_id: customerData.id,
          agent_id: agentId,
          status: 'Active'
        });

        activeChats.set(customerSocketId, { 
          customerData, 
          agentSocketId: socket.id, 
          agentId, 
          agentName,
          chatId: chatRecord.id 
        });
        
        // Notify customer that agent joined
        io.to(customerSocketId).emit('agent_joined', { 
          agentId, 
          agentName, 
          agentSocketId: socket.id 
        });
        
        // Confirm to agent
        socket.emit('chat_joined', { customerData, chatId: chatRecord.id });
        
        // Notify all other agents to remove this from their pending list
        socket.broadcast.emit('chat_accepted', { customerSocketId });
        
        console.log(`Agent ${agentName} joined chat with customer ${customerData.name}`);
      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    } else {
      socket.emit('error', { message: 'Chat request no longer available' });
    }
  });

  socket.on('send_message', async (data) => {
    const { text, to, fromName } = data;
    
    console.log(`Message from ${socket.id} to ${to}: ${text}`);

    // Find active chat to get chatId
    let chatInfo = null;
    let senderType = 'Customer';
    let senderId = null;
    let recipientSocketId = to;
    let customerSocketId = null;

    // Check if sender is a customer
    if (activeChats.has(socket.id)) {
      chatInfo = activeChats.get(socket.id);
      senderType = 'Customer';
      senderId = chatInfo.customerData.id;
      recipientSocketId = chatInfo.agentSocketId;
      customerSocketId = socket.id;
    } 
    // Check if sender is an agent
    else {
      for (const [cSocketId, chat] of activeChats.entries()) {
        if (chat.agentSocketId === socket.id && (cSocketId === to || chat.customerData.id === to)) {
          chatInfo = chat;
          senderType = 'Staff';
          senderId = chat.agentId;
          recipientSocketId = cSocketId;
          customerSocketId = cSocketId;
          break;
        }
      }
    }

    if (chatInfo && recipientSocketId) {
      try {
        // Persist message to DB
        await ChatMessage.create({
          chat_id: chatInfo.chatId,
          sender_type: senderType,
          sender_id: senderId,
          message_text: text
        });

        // Route message
        io.to(recipientSocketId).emit('receive_message', {
          text,
          from: socket.id,
          fromName,
          customerSocketId, // Always include this to help the admin dashboard
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        console.log(`Message routed to ${recipientSocketId}`);
      } catch (error) {
        console.error('Error saving message:', error);
      }
    } else {
      console.log('Chat info not found for message:', { from: socket.id, to });
      
      // Fallback for cases where the mapping might be loose
      if (to && !recipientSocketId) {
        io.to(to).emit('receive_message', {
          text,
          from: socket.id,
          fromName,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    }
  });

  socket.on('identify', (data) => {
    const { type, id } = data; // type: 'agent' or 'customer', id: their DB ID
    console.log(`Identifying ${type} with ID ${id} on socket ${socket.id}`);
    
    if (type === 'agent') {
      for (const [cSocketId, chat] of activeChats.entries()) {
        if (chat.agentId === id) {
          chat.agentSocketId = socket.id;
          io.to(cSocketId).emit('agent_reconnected', { agentSocketId: socket.id });
          console.log(`Updated agentSocketId for chat ${chat.chatId}`);
        }
      }
    } else if (type === 'customer') {
      // Find chat by customer ID and update socket
      for (const [cSocketId, chat] of activeChats.entries()) {
        if (chat.customerData.id === id) {
          const chatData = activeChats.get(cSocketId);
          activeChats.delete(cSocketId);
          const newChatData = { ...chatData, customerSocketId: socket.id };
          activeChats.set(socket.id, newChatData);
          
          io.to(chatData.agentSocketId).emit('customer_reconnected', { 
            oldSocketId: cSocketId, 
            newSocketId: socket.id,
            customerData: chatData.customerData 
          });
          
          console.log(`Updated customerSocketId for chat ${chat.chatId}`);
          break;
        }
      }
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    pendingRequests.delete(socket.id);
    
    for (const [customerSocketId, chat] of activeChats.entries()) {
      if (customerSocketId === socket.id || chat.agentSocketId === socket.id) {
        const targetSocketId = (customerSocketId === socket.id) ? chat.agentSocketId : customerSocketId;
        io.to(targetSocketId).emit('partner_disconnected');
        // We don't delete from activeChats or update DB status here to allow reconnection
        break;
      }
    }
  });

  socket.on('end_chat', async (data) => {
    const { customerSocketId } = data;
    const chatInfo = activeChats.get(customerSocketId);

    if (chatInfo) {
      try {
        // Update chat status to Closed in DB
        await Chat.update({ status: 'Closed' }, { where: { id: chatInfo.chatId } });
        
        // Notify both parties
        io.to(customerSocketId).emit('chat_ended', { message: 'Chat has been ended by the agent.' });
        io.to(chatInfo.agentSocketId).emit('chat_ended', { customerSocketId, message: 'Chat ended successfully.' });
        
        // Clean up
        activeChats.delete(customerSocketId);
        console.log(`Chat ${chatInfo.chatId} ended by agent/system.`);
      } catch (error) {
        console.error('Error ending chat:', error);
        socket.emit('error', { message: 'Failed to end chat' });
      }
    }
  });
});

// Database Sync & Server Start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    
    // Sync models
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();
