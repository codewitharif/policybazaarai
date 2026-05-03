const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/ask', upload.single('image'), aiController.askAI);

module.exports = router;
