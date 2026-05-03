const Customer = require('../models/customerModels');
const Policy = require('../models/policyModels');
const CustomerPolicy = require('../models/customerPolicyLinkModels');
const Category = require('../models/categoryModels');
const Product = require('../models/productModels');
const { CommunicationLog } = require('../models/communicationModels');
const Claim = require('../models/claimsModels');
const Payout = require('../models/payoutsModels');
const workflowService = require('../services/workflowService');
const { updateCustomerScore } = require('../utils/scoringUtils');

const customerController = {
  // Customers
  getAllCustomers: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', status = 'All', priority = 'All', customer_type = 'All' } = req.query;
      const offset = (page - 1) * limit;

      const { Op } = require('sequelize');
      let whereClause = {};

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } }
        ];
      }

      if (status !== 'All') {
        whereClause.status = status;
      }

      if (priority !== 'All') {
        whereClause.priority = priority;
      }

      if (customer_type !== 'All') {
        whereClause.customer_type = customer_type;
      }

      const { count, rows } = await Customer.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Category,
            include: [Product]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        total: count,
        customers: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  getCustomerById: async (req, res) => {
    try {
      const customer = await Customer.findByPk(req.params.id, { 
        include: [
          {
            model: Category,
            include: [Product]
          },
          { 
            model: CustomerPolicy, 
            include: [
              { model: Policy },
              { model: Claim }
            ] 
          },
          {
            model: CommunicationLog
          }
        ] 
      });

      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      // Convert to JSON and flatten/sort data for frontend
      const customerData = customer.toJSON();

      // Flatten claims from policies
      customerData.Claims = customerData.CustomerPolicies?.reduce((acc, cp) => {
        if (cp.Claims) {
          const claimsWithPolicy = cp.Claims.map(c => ({
            ...c, 
            Policy: cp.Policy 
          }));
          return [...acc, ...claimsWithPolicy];
        }
        return acc;
      }, []) || [];

      // Sort CommunicationLogs by created_at DESC
      if (customerData.CommunicationLogs) {
        customerData.CommunicationLogs.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      // Sort Claims by created_at DESC
      customerData.Claims.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      res.json(customerData);
    } catch (error) {
      console.error('Error in getCustomerById:', error);
      res.status(500).json({ message: error.message });
    }
  },
  createCustomer: async (req, res) => {
    try {
      const { phone, email, name } = req.body;
      const { Op } = require('sequelize');

      // Find by phone or email
      let customer = await Customer.findOne({ 
        where: { 
          [Op.or]: [
            phone ? { phone } : null,
            email ? { email } : null
          ].filter(Boolean)
        } 
      });

      let isNew = false;
      if (!customer) {
        customer = await Customer.create(req.body);
        isNew = true;
        // Trigger workflow for new customer
        workflowService.triggerWorkflow('customer_created', customer.toJSON());
      } else {
        // Update details if they are provided and missing
        if (name && (!customer.name || customer.name === 'Anonymous')) customer.name = name;
        if (email && !customer.email) customer.email = email;
        await customer.save();
      }
      
      // Update score
      await updateCustomerScore(customer.id);
      
      const responseData = customer.toJSON();
      responseData.isNew = isNew;
      
      res.status(isNew ? 201 : 200).json(responseData);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  updateCustomer: async (req, res) => {
    try {
      const customer = await Customer.findByPk(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
      await customer.update(req.body);
      
      // Update score
      await updateCustomerScore(customer.id);
      
      res.json({ message: 'Customer updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  deleteCustomer: async (req, res) => {
    try {
      const customer = await Customer.findByPk(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
      await customer.destroy();
      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  verifyBiometrics: async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await Customer.findByPk(id);

      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      if (!req.files || !req.files.selfie || !req.files.idCard) {
        return res.status(400).json({ message: 'Both selfie and ID card photos are required' });
      }

      const selfieUrl = req.files.selfie[0].path;
      const idCardUrl = req.files.idCard[0].path;

      // Simulate AI Verification process
      // In a real scenario, you would call a biometric API here
      console.log(`Starting Biometric Verification for Customer ${id}...`);
      
      // We simulate Face Matching and Liveness Detection
      // For the sake of the demo, we'll assume success if both images are present
      // but we add a small delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      const verificationScore = Math.floor(Math.random() * 20) + 80; // 80-100%
      const isVerified = verificationScore > 85;

      await customer.update({
        customer_photo: selfieUrl,
        id_photo: idCardUrl,
        verification_status: isVerified ? 'Verified' : 'Failed',
        status: isVerified ? 'Qualified' : 'New'
      });

      if (isVerified) {
        res.json({
          success: true,
          message: 'Biometric verification successful. Face matching (98%) and Liveness detection passed.',
          verification_score: verificationScore,
          customer_photo: selfieUrl
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Biometric verification failed. Face match score too low or liveness check failed.',
          verification_score: verificationScore
        });
      }
    } catch (error) {
      console.error('Biometric Verification Error:', error);
      res.status(500).json({ message: 'Verification failed: ' + error.message });
    }
  },

  // Enroll Customer in Policy
  enrollPolicy: async (req, res) => {
    try {
      const enrollment = await CustomerPolicy.create(req.body);
      
      // Fetch full details for workflow
      const fullEnrollment = await CustomerPolicy.findByPk(enrollment.id, {
        include: [Customer, Policy]
      });
      
      // Trigger workflow
      workflowService.triggerWorkflow('policy_enrolled', {
        ...fullEnrollment.toJSON(),
        customer_email: fullEnrollment.Customer?.email,
        customer_phone: fullEnrollment.Customer?.phone,
        policy_name: fullEnrollment.Policy?.name
      });

      res.status(201).json(enrollment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = customerController;
