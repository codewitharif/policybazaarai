const { Meeting, Customer } = require('../models');
const { 
  createGoogleMeet, 
  createZoomMeeting, 
  getGoogleAuthClient, 
  saveTokens, 
  GOOGLE_CONFIG, 
  ZOOM_CONFIG 
} = require('../utils/meetingUtils');
const axios = require('axios');
const { Setting } = require('../models');
const workflowService = require('../services/workflowService');
const { updateCustomerScore } = require('../utils/scoringUtils');

const getConnectionStatus = async (req, res) => {
  try {
    const googleTokens = await Setting.findOne({ where: { setting_key: 'google_tokens' } });
    const zoomTokens = await Setting.findOne({ where: { setting_key: 'zoom_tokens' } });

    res.json({
      googleConnected: !!googleTokens,
      zoomConnected: !!zoomTokens
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.findAll({
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] }
      ],
      order: [['date', 'DESC'], ['start_time', 'DESC']]
    });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] }
      ]
    });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMeeting = async (req, res) => {
  try {
    let meetingData = { ...req.body };
    
    // Automatic Link Generation
    try {
      if (meetingData.meeting_type === 'Google Meet') {
        meetingData.meeting_link = await createGoogleMeet(meetingData);
      } else if (meetingData.meeting_type === 'Zoom') {
        meetingData.meeting_link = await createZoomMeeting(meetingData);
      }
    } catch (meetingError) {
      console.error('Failed to generate meeting link:', meetingError);
    }

    const meeting = await Meeting.create(meetingData);

    // Update score
    if (meeting.customer_id) await updateCustomerScore(meeting.customer_id);

    // Fetch details for workflow
    const fullMeeting = await Meeting.findByPk(meeting.id, {
      include: [{ model: Customer, as: 'customer' }]
    });

    workflowService.triggerWorkflow('meeting_scheduled', {
      ...fullMeeting.toJSON(),
      customer_email: fullMeeting.customer?.email,
      customer_phone: fullMeeting.customer?.phone
    });

    res.status(201).json(meeting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    let updateData = { ...req.body };

    // Automatic Link Regeneration
    const typeChanged = updateData.meeting_type && updateData.meeting_type !== meeting.meeting_type;
    const linkMissing = (updateData.meeting_type === 'Google Meet' || updateData.meeting_type === 'Zoom') && !updateData.meeting_link;

    if (typeChanged || linkMissing) {
      try {
        if (updateData.meeting_type === 'Google Meet') {
          updateData.meeting_link = await createGoogleMeet({ ...meeting.toJSON(), ...updateData });
        } else if (updateData.meeting_type === 'Zoom') {
          updateData.meeting_link = await createZoomMeeting({ ...meeting.toJSON(), ...updateData });
        }
      } catch (meetingError) {
        console.error('Failed to regenerate meeting link:', meetingError);
        if (updateData.meeting_type === 'Google Meet' || updateData.meeting_type === 'Zoom') {
          updateData.meeting_link = '';
        }
      }
    }

    await meeting.update(updateData);

    // Update score
    if (meeting.customer_id) await updateCustomerScore(meeting.customer_id);

    res.json(meeting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    
    const customerId = meeting.customer_id;
    await meeting.destroy();

    // Update score
    if (customerId) await updateCustomerScore(customerId);

    return res.json({ message: 'Meeting deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// OAuth Handlers
const googleAuth = (req, res) => {
  const auth = getGoogleAuthClient();
  const url = auth.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent'
  });
  res.redirect(url);
};

const googleCallback = async (req, res) => {
  const { code } = req.query;
  const auth = getGoogleAuthClient();
  const { tokens } = await auth.getToken(code);
  await saveTokens('google', tokens);
  res.send('Google Calendar connected successfully! You can close this tab.');
};

const zoomAuth = (req, res) => {
  const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${ZOOM_CONFIG.clientId}&redirect_uri=${encodeURIComponent(ZOOM_CONFIG.redirectUri)}`;
  res.redirect(url);
};

const zoomCallback = async (req, res) => {
  const { code } = req.query;
  const auth = Buffer.from(`${ZOOM_CONFIG.clientId}:${ZOOM_CONFIG.clientSecret}`).toString('base64');
  
  try {
    const response = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: ZOOM_CONFIG.redirectUri
      },
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    
    await saveTokens('zoom', response.data);
    res.send('Zoom connected successfully! You can close this tab.');
  } catch (error) {
    res.status(500).send(`Zoom Auth Error: ${error.message}`);
  }
};

module.exports = {
  getConnectionStatus,
  getAllMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  googleAuth,
  googleCallback,
  zoomAuth,
  zoomCallback
};
