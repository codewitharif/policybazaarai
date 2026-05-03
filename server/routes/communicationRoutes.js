const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// CommunicationLogs
router.get('/logs', communicationController.getAllCommunicationLogs);
router.post('/logs', communicationController.createCommunicationLog);
router.post('/send-message', communicationController.sendCommunication);
router.post('/stt', upload.single('file'), communicationController.speechToText);
router.put('/logs/:id', communicationController.updateCommunicationLogStatus);

// Chats
router.get('/chats', communicationController.getAllChats);
router.get('/chats/active', communicationController.getActiveChats);
router.get('/chats/history', communicationController.getCustomerChatHistory);
router.get('/chats/:chatId/messages', communicationController.getChatMessages);
router.post('/chats/messages', communicationController.sendMessage);

module.exports = router;
