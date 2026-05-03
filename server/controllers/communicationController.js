const { CommunicationLog, Chat, Message } = require('../models/communicationModels');
const Customer = require('../models/customerModels');
const User = require('../models/userModels');
const messagingService = require('../services/messagingService');
const axios = require('axios');
const FormData = require('form-data');
const { updateCustomerScore } = require('../utils/scoringUtils');

const communicationController = {
  // CommunicationLogs
  getAllCommunicationLogs: async (req, res) => {
    try {
      const logs = await CommunicationLog.findAll({ include: [User, Customer] });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  createCommunicationLog: async (req, res) => {
    try {
      const log = await CommunicationLog.create(req.body);
      
      // Update score
      if (log.customer_id) await updateCustomerScore(log.customer_id);
      
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  sendCommunication: async (req, res) => {
    try {
      const { customer_id, user_id, type, subject, content, attachVoice } = req.body;
      console.log(`[DEBUG] Received sendCommunication request:`, { customer_id, type, attachVoice });

      // 1. Fetch customer details
      const customer = await Customer.findByPk(customer_id);
      if (!customer) {
        console.error(`[DEBUG] Customer not found: ${customer_id}`);
        return res.status(404).json({ message: 'Customer not found' });
      }

      let attachment = null;

      // 2. Handle TTS if requested
      if (attachVoice && type.toUpperCase() === 'EMAIL') {
        console.log(`[DEBUG] Attempting TTS generation for content: "${content.substring(0, 50)}..."`);
        try {
          const ttsResponse = await axios.post(
            'https://api.groq.com/openai/v1/audio/speech',
            {
              model: 'canopylabs/orpheus-v1-english',
              input: content.substring(0, 200), // Groq Orpheus limit
              voice: 'autumn', // Valid Groq Orpheus voice
              response_format: 'wav'
            },
            {
              headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
              },
              responseType: 'arraybuffer'
            }
          );
          
          console.log(`[DEBUG] TTS generation successful. Buffer size: ${ttsResponse.data.byteLength} bytes`);
          
          attachment = {
            filename: 'voice_message.wav',
            content: Buffer.from(ttsResponse.data)
          };
        } catch (ttsError) {
          let errorData = ttsError.message;
          if (ttsError.response?.data) {
            try {
              // Convert Buffer to string if it's an ArrayBuffer/Buffer
              const decoded = Buffer.from(ttsError.response.data).toString();
              errorData = decoded;
            } catch (e) {
              errorData = ttsError.response.data;
            }
          }
          console.error('[DEBUG] TTS Error Details:', errorData);
          // Continue without attachment if TTS fails
        }
      }

      // 3. "Send" the message based on type
      let result;
      switch (type.toUpperCase()) {
        case 'EMAIL':
          console.log(`[DEBUG] Sending email to ${customer.email} ${attachment ? 'WITH' : 'WITHOUT'} voice attachment`);
          result = await messagingService.sendEmail(customer.email, subject || 'No Subject', content, attachment);
          break;
        case 'SMS':
          result = await messagingService.sendSMS(customer.phone, content);
          break;
        case 'WHATSAPP':
          result = await messagingService.sendWhatsApp(customer.phone, content);
          break;
        default:
          throw new Error('Invalid communication type');
      }

      // 4. Create a log entry in the database
      const log = await CommunicationLog.create({
        assigned_to: user_id,
        customer_id: customer_id,
        type: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
        direction: 'Outgoing',
        subject: subject || `${type} Message`,
        summary: content,
        status: 'Completed',
        scheduled_at: new Date(),
        notes: `Sent via System on ${new Date().toLocaleString()}${attachment ? ' (with voice attachment)' : ''}`
      });

      // Update score
      await updateCustomerScore(customer_id);

      res.status(201).json({ message: 'Communication sent successfully', log });
    } catch (error) {
      console.error('[DEBUG] Global sendCommunication Error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  speechToText: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No audio file provided' });
      }

      const formData = new FormData();
      formData.append('file', req.file.buffer, {
        filename: 'audio.wav',
        contentType: req.file.mimetype,
      });
      formData.append('model', 'whisper-large-v3');

      const groqResponse = await axios.post(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          },
        }
      );

      res.json({ text: groqResponse.data.text });
    } catch (error) {
      console.error('STT Error:', error.response?.data || error.message);
      res.status(500).json({ message: 'Failed to transcribe audio' });
    }
  },

  updateCommunicationLogStatus: async (req, res) => {
    try {
      const log = await CommunicationLog.findByPk(req.params.id);
      if (!log) return res.status(404).json({ message: 'CommunicationLog not found' });
      await log.update({ status: req.body.status });
      
      // Update score
      await updateCustomerScore(log.customer_id);
      
      res.json({ message: 'CommunicationLog updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Chats
  getActiveChats: async (req, res) => {
    try {
      const { agent_id } = req.query;
      const whereClause = { status: 'Active' };
      if (agent_id) whereClause.agent_id = agent_id;

      const chats = await Chat.findAll({ 
        where: whereClause,
        include: [Customer] 
      });
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  getAllChats: async (req, res) => {
    try {
      const chats = await Chat.findAll({ include: [Customer] });
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  getChatMessages: async (req, res) => {
    try {
      const messages = await Message.findAll({ 
        where: { chat_id: req.params.chatId },
        order: [['created_at', 'ASC']]
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  sendMessage: async (req, res) => {
    try {
      const message = await Message.create(req.body);
      
      // Update score if it's a customer message or if we have chat info
      const chat = await Chat.findByPk(message.chat_id);
      if (chat) await updateCustomerScore(chat.customer_id);
      
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getCustomerChatHistory: async (req, res) => {
    try {
      const { phone, customer_id } = req.query;
      let customer;
      
      if (customer_id) {
        customer = await Customer.findByPk(customer_id);
      } else if (phone) {
        customer = await Customer.findOne({ where: { phone } });
      }

      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Fetch Chat Messages only
      const messages = await Message.findAll({
        include: [{
          model: Chat,
          where: { customer_id: customer.id },
          attributes: ['id', 'status', 'created_at'],
          include: [{
            model: User,
            as: 'Agent',
            attributes: ['name']
          }]
        }],
        order: [['created_at', 'ASC']]
      });

      // Map to a unified format for the admin chat
      const history = messages.map(m => ({
        id: m.id,
        text: m.message_text,
        sender: m.sender_type === 'Staff' ? 'admin' : 'user', // Mapping for admin UI
        senderName: m.sender_type === 'Staff' ? (m.Chat.Agent ? m.Chat.Agent.name : 'Admin') : customer.name,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(m.created_at).toLocaleDateString('en-IN'),
        full_timestamp: m.created_at
      }));

      res.json(history);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = communicationController;
