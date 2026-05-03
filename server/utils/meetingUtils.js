const { google } = require('googleapis');
const axios = require('axios');
const { Setting } = require('../models');

const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
};

const ZOOM_CONFIG = {
  clientId: process.env.ZOOM_CLIENT_ID,
  clientSecret: process.env.ZOOM_CLIENT_SECRET,
  redirectUri: process.env.ZOOM_REDIRECT_URI,
};

const getGoogleAuthClient = () => {
  return new google.auth.OAuth2(
    GOOGLE_CONFIG.clientId,
    GOOGLE_CONFIG.clientSecret,
    GOOGLE_CONFIG.redirectUri
  );
};

const saveTokens = async (provider, tokens) => {
  const key = `${provider}_tokens`;
  const [setting, created] = await Setting.findOrCreate({
    where: { setting_key: key },
    defaults: { setting_value: JSON.stringify(tokens) }
  });

  if (!created) {
    await setting.update({ setting_value: JSON.stringify(tokens) });
  }
};

const getTokens = async (provider) => {
  const key = `${provider}_tokens`;
  const setting = await Setting.findOne({ where: { setting_key: key } });
  return setting ? JSON.parse(setting.setting_value) : null;
};

const createGoogleMeet = async (meeting) => {
  const tokens = await getTokens('google');
  if (!tokens) throw new Error('Google OAuth not connected');

  const auth = getGoogleAuthClient();
  auth.setCredentials(tokens);

  // Refresh token if expired
  auth.on('tokens', (newTokens) => {
    saveTokens('google', { ...tokens, ...newTokens });
  });

  const calendar = google.calendar({ version: 'v3', auth });
  
  const startDateTime = `${meeting.date}T${meeting.start_time}:00Z`;
  const endDateTime = `${meeting.date}T${meeting.end_time}:00Z`;

  const event = {
    summary: meeting.title,
    description: meeting.description,
    start: { dateTime: startDateTime, timeZone: 'UTC' },
    end: { dateTime: endDateTime, timeZone: 'UTC' },
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    attendees: meeting.participants ? meeting.participants.split(',').map(email => ({ email: email.trim() })) : [],
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
  });

  return response.data.hangoutLink;
};

const refreshZoomToken = async (tokens) => {
  const auth = Buffer.from(`${ZOOM_CONFIG.clientId}:${ZOOM_CONFIG.clientSecret}`).toString('base64');
  
  try {
    const response = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token
      },
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    
    const newTokens = response.data;
    await saveTokens('zoom', newTokens);
    return newTokens;
  } catch (error) {
    console.error('Error refreshing Zoom token:', error.response?.data || error.message);
    throw new Error('Zoom connection expired. Please reconnect your Zoom account.');
  }
};

const createZoomMeeting = async (meeting) => {
  let tokens = await getTokens('zoom');
  if (!tokens) throw new Error('Zoom OAuth not connected');

  // Simple expiration check (Zoom tokens usually last 1 hour)
  // In a real app, you'd store the 'expires_at' timestamp.
  // Here we'll try the request and refresh if it fails with 401.
  
  const startDateTime = `${meeting.date}T${meeting.start_time}:00Z`;
  
  try {
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: meeting.title,
        type: 2,
        start_time: startDateTime,
        duration: 60,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          mute_upon_entry: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );
    return response.data.join_url;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token likely expired, try refreshing
      tokens = await refreshZoomToken(tokens);
      const retryResponse = await axios.post(
        'https://api.zoom.us/v2/users/me/meetings',
        {
          topic: meeting.title,
          type: 2,
          start_time: startDateTime,
          duration: 60,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            mute_upon_entry: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      );
      return retryResponse.data.join_url;
    }
    throw error;
  }
};

module.exports = {
  getGoogleAuthClient,
  saveTokens,
  getTokens,
  createGoogleMeet,
  createZoomMeeting,
  GOOGLE_CONFIG,
  ZOOM_CONFIG,
};
