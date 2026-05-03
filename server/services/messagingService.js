const nodemailer = require('nodemailer');
const twilio = require('twilio');

/**
 * Messaging Service to handle Email, SMS, and WhatsApp communications.
 */

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Configure Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const messagingService = {
  sendEmail: async (to, subject, body, attachment = null) => {
    try {
      console.log(`[DEBUG] messagingService.sendEmail called for: ${to}`);
      const mailOptions = {
        from: `"PolicyBazaar CRM" <${process.env.SMTP_USER}>`,
        to: to,
        subject: subject,
        text: body,
        attachments: []
      };

      if (attachment && attachment.content) {
        console.log(`[DEBUG] Adding attachment to email: ${attachment.filename}`);
        mailOptions.attachments.push({
          filename: attachment.filename || 'voice_message.wav',
          content: attachment.content,
        });
      }

      console.log(`[DEBUG] Final attachment count: ${mailOptions.attachments.length}`);
      const info = await transporter.sendMail(mailOptions);

      console.log(`[EMAIL SENT] Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[EMAIL ERROR]', error);
      throw error;
    }
  },

  sendSMS: async (to, message) => {
    try {
      console.log(`[DEBUG] messagingService.sendSMS called for: ${to}`);
      const response = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_SMS_NUMBER,
        to: to
      });
      console.log(`[SMS SENT] SID: ${response.sid}`);
      return { success: true, sid: response.sid };
    } catch (error) {
      console.error('[SMS ERROR]', error);
      throw error;
    }
  },

  sendWhatsApp: async (to, message) => {
    try {
      console.log(`[DEBUG] messagingService.sendWhatsApp called for: ${to}`);
      
      // Ensure 'whatsapp:' prefix is present as required by Twilio
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const formattedFrom = process.env.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:') 
        ? process.env.TWILIO_WHATSAPP_NUMBER 
        : `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

      const response = await twilioClient.messages.create({
        body: message,
        from: formattedFrom,
        to: formattedTo
      });
      console.log(`[WHATSAPP SENT] SID: ${response.sid}`);
      return { success: true, sid: response.sid };
    } catch (error) {
      console.error('[WHATSAPP ERROR]', error);
      throw error;
    }
  }
};

module.exports = messagingService;
