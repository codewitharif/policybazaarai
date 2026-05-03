const { Workflow, Customer, User } = require('../models');
const messagingService = require('./messagingService');

const workflowService = {
  triggerWorkflow: async (triggerType, data) => {
    try {
      console.log(`[WORKFLOW] Triggered: ${triggerType}`);
      
      const workflows = await Workflow.findAll({
        where: {
          status: 'Active'
        }
      });

      for (const workflow of workflows) {
        if (workflow.trigger.type === triggerType) {
          console.log(`[WORKFLOW] Checking workflow: ${workflow.name}`);
          
          const conditionsMet = workflowService.evaluateConditions(workflow.conditions, data);
          
          if (conditionsMet) {
            console.log(`[WORKFLOW] Conditions met for: ${workflow.name}. Executing actions.`);
            await workflowService.executeActions(workflow.actions, data);
            
            // Update last_run
            await workflow.update({ last_run: new Date() });
          } else {
            console.log(`[WORKFLOW] Conditions NOT met for: ${workflow.name}`);
          }
        }
      }
    } catch (error) {
      console.error('[WORKFLOW ERROR]', error);
    }
  },

  evaluateConditions: (conditions, data) => {
    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
      return true; // No conditions means always met
    }

    return conditions.every(condition => {
      const { field, operator, value } = condition;
      const dataValue = data[field];

      switch (operator) {
        case 'equals':
          return dataValue == value;
        case 'not_equals':
          return dataValue != value;
        case 'greater_than':
          return dataValue > value;
        case 'less_than':
          return dataValue < value;
        case 'contains':
          return String(dataValue).toLowerCase().includes(String(value).toLowerCase());
        default:
          return false;
      }
    });
  },

  executeActions: async (actions, data) => {
    for (const action of actions) {
      const { type, config } = action;
      console.log(`[WORKFLOW] Executing action: ${type}`);

      try {
        switch (type) {
          case 'send_email':
            const emailTo = config.to === '{{customer_email}}' ? data.email : config.to;
            const emailSubject = workflowService.replacePlaceholders(config.subject, data);
            const emailBody = workflowService.replacePlaceholders(config.body, data);
            await messagingService.sendEmail(emailTo, emailSubject, emailBody);
            break;

          case 'send_sms':
            const smsTo = config.to === '{{customer_phone}}' ? data.phone : config.to;
            const smsMessage = workflowService.replacePlaceholders(config.message, data);
            await messagingService.sendSMS(smsTo, smsMessage);
            break;

          case 'send_whatsapp':
            const waTo = config.to === '{{customer_phone}}' ? data.phone : config.to;
            const waMessage = workflowService.replacePlaceholders(config.message, data);
            await messagingService.sendWhatsApp(waTo, waMessage);
            break;

          case 'update_status':
            if (data.id) {
              const customer = await Customer.findByPk(data.id);
              if (customer) {
                await customer.update({ status: config.status });
                console.log(`[WORKFLOW] Updated status for customer ${data.id} to ${config.status}`);
              }
            }
            break;

          case 'assign_lead':
            if (data.id) {
              const customer = await Customer.findByPk(data.id);
              if (customer) {
                await customer.update({ assigned_to: config.user_id });
                console.log(`[WORKFLOW] Assigned lead ${data.id} to user ${config.user_id}`);
              }
            }
            break;

          default:
            console.warn(`[WORKFLOW] Unknown action type: ${type}`);
        }
      } catch (actionError) {
        console.error(`[WORKFLOW ACTION ERROR] Action: ${type}`, actionError);
      }
    }
  },

  replacePlaceholders: (text, data) => {
    if (!text) return text;
    return text.replace(/\{\{(.*?)\}\}/g, (match, p1) => {
      const value = data[p1.trim()];
      return value !== undefined ? value : match;
    });
  }
};

module.exports = workflowService;
