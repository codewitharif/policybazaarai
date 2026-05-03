const { CommunicationLog } = require('../models/communicationModels');
const Meeting = require('../models/meetingModels');
const Customer = require('../models/customerModels');

/**
 * Calculates the Potential Conversion Score (0-100) for a customer
 * @param {Object} customer - Customer object with associations (CommunicationLogs, Meetings)
 * @returns {number} - Score from 0 to 100
 */
const calculateScore = (customer) => {
  let score = 0;

  // 1. Interaction Intensity (Max 40 Points)
  let interactionScore = 0;
  
  // Meetings (Max 20)
  const completedMeetings = customer.Meetings ? customer.Meetings.filter(m => m.status === 'Completed').length : 0;
  interactionScore += Math.min(completedMeetings * 10, 20);

  // Calls (Max 15)
  const longCalls = customer.CommunicationLogs ? customer.CommunicationLogs.filter(log => 
    log.type === 'Call' && log.direction === 'Outgoing' && (log.duration || 0) >= 2
  ).length : 0;
  interactionScore += Math.min(longCalls * 5, 15);

  // Other interactions (Max 5)
  const others = customer.CommunicationLogs ? customer.CommunicationLogs.filter(log => 
    ['WhatsApp', 'Email', 'SMS'].includes(log.type)
  ).length : 0;
  interactionScore += Math.min(others * 1, 5);
  
  score += interactionScore;

  // 2. Lead Classification (Max 30 Points)
  // Customer Type (20 pts)
  if (customer.customer_type === 'Hot') score += 20;
  else if (customer.customer_type === 'Warm') score += 10;

  // Status (10 pts)
  if (customer.status === 'Qualified') score += 10;
  else if (customer.status === 'Contacted') score += 5;
  else if (customer.status === 'New') score += 2;

  // 3. Profile & Data Depth (Max 20 Points)
  // Contact Basics (10 pts)
  if (customer.email) score += 5;
  if (customer.phone) score += 5;

  // Demographics (10 pts)
  if (customer.dob) score += 2;
  if (customer.address) score += 2;
  if (customer.city) score += 2;
  if (customer.policy_category_id) score += 2;
  if (customer.source) score += 2;

  // 4. Recency Bonus/Penalty (Max 10 Points)
  const allInteractions = [
    ...(customer.CommunicationLogs || []),
    ...(customer.Meetings || [])
  ].map(i => new Date(i.created_at || i.scheduled_at));

  if (allInteractions.length > 0) {
    const lastInteraction = new Date(Math.max(...allInteractions));
    const now = new Date();
    const diffHours = (now - lastInteraction) / (1000 * 60 * 60);

    if (diffHours <= 48) score += 10;
    else if (diffHours <= 168) score += 5; // 7 days
  }

  return Math.min(Math.round(score), 100);
};

/**
 * Updates a customer's score in the database
 * @param {number} customerId 
 */
const updateCustomerScore = async (customerId) => {
  try {
    const customer = await Customer.findByPk(customerId, {
      include: [
        { model: CommunicationLog },
        { model: Meeting }
      ]
    });

    if (customer) {
      const newScore = calculateScore(customer);
      await customer.update({ conversion_score: newScore });
      return newScore;
    }
  } catch (error) {
    console.error(`Error updating score for customer ${customerId}:`, error);
  }
};

module.exports = {
  calculateScore,
  updateCustomerScore
};
