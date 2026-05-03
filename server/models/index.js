const User = require('./userModels');
const Customer = require('./customerModels');
const Product = require('./productModels');
const Category = require('./categoryModels');
const Policy = require('./policyModels');
const CustomerPolicy = require('./customerPolicyLinkModels');
const Claim = require('./claimsModels');
const Payout = require('./payoutsModels');
const Question = require('./questionModels');
const QuestionAnswer = require('./questionAnswerModels');
const Setting = require('./settingModels');
const { CommunicationLog, Chat, Message } = require('./communicationModels');

const Meeting = require('./meetingModels');
const Workflow = require('./workflowModels');

module.exports = {
  User,
  Customer,
  Product,
  Category,
  Policy,
  CustomerPolicy,
  Claim,
  Payout,
  Question,
  QuestionAnswer,
  Setting,
  CommunicationLog,
  Chat,
  Message,
  Meeting,
  Workflow
};
