const Claim = require('../models/claimsModels');
const CustomerPolicy = require('../models/customerPolicyLinkModels');
const Customer = require('../models/customerModels');
const Policy = require('../models/policyModels');
const workflowService = require('../services/workflowService');
const { Groq } = require('groq-sdk');
const fs = require('fs');

const { Op } = require('sequelize');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const claimController = {
  ghostWriteClaim: async (req, res) => {
    try {
      const rawText = req.body.text;
      
      if (!rawText) {
        return res.status(400).json({ message: 'No incident description provided.' });
      }

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert insurance claims writer. Rewrite the user's incident description into a professional, extremely concise claim narrative. The output must be a single paragraph of plain text. Do not use bullet points, asterisks, bolding, or any special characters except periods, commas, and quotes. Ensure the narrative naturally covers the following points: Incident Overview, Description, Circumstances Leading to the Incident, Impact/Damage, and Injuries and Medical Attention. Keep it very short."
          },
          {
            role: "user",
            content: `Please rewrite this incident description into a professional paragraph:\n\n${rawText}`
          }
        ],
        model: "llama-3.3-70b-versatile",
      });

      const professionalNarrative = chatCompletion.choices[0].message.content;

      res.json({
        raw_text: rawText,
        professional_narrative: professionalNarrative
      });
    } catch (error) {
      console.error('Ghost-writer error:', error);
      res.status(500).json({ message: 'Failed to generate professional narrative. ' + error.message });
    }
  },
  getAllClaims: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';
      const status = req.query.status || 'All';

      const whereClause = {
        claim_number: { [Op.like]: `%${search}%` }
      };

      if (status !== 'All') {
        whereClause.status = status;
      }

      const { count, rows } = await Claim.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: CustomerPolicy,
            include: [Customer, Policy]
          }
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      res.json({
        total: count,
        claims: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  getClaimById: async (req, res) => {
    try {
      const claim = await Claim.findByPk(req.params.id, { 
        include: [
          {
            model: CustomerPolicy,
            include: [Customer, Policy]
          }
        ] 
      });
      if (!claim) return res.status(404).json({ message: 'Claim not found' });
      res.json(claim);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  createClaim: async (req, res) => {
    try {
      const claimData = { ...req.body };
      if (req.file) {
        claimData.attachment_url = req.file.path; // Cloudinary URL
      }
      
      const claim = await Claim.create(claimData);
      
      // Fetch details for workflow
      const fullClaim = await Claim.findByPk(claim.id, {
        include: [{ model: CustomerPolicy, include: [Customer, Policy] }]
      });

      workflowService.triggerWorkflow('claim_created', {
        ...fullClaim.toJSON(),
        customer_email: fullClaim.CustomerPolicy?.Customer?.email,
        customer_phone: fullClaim.CustomerPolicy?.Customer?.phone,
        policy_name: fullClaim.CustomerPolicy?.Policy?.name,
        attachment_url: claim.attachment_url
      });

      res.status(201).json(claim);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  updateClaim: async (req, res) => {
    try {
      const claim = await Claim.findByPk(req.params.id);
      if (!claim) return res.status(404).json({ message: 'Claim not found' });
      
      const oldStatus = claim.status;
      await claim.update(req.body);
      
      if (oldStatus !== claim.status) {
        // Fetch details for workflow
        const fullClaim = await Claim.findByPk(claim.id, {
          include: [{ model: CustomerPolicy, include: [Customer, Policy] }]
        });

        workflowService.triggerWorkflow('claim_status_updated', {
          ...fullClaim.toJSON(),
          previous_status: oldStatus,
          customer_email: fullClaim.CustomerPolicy?.Customer?.email,
          customer_phone: fullClaim.CustomerPolicy?.Customer?.phone,
          policy_name: fullClaim.CustomerPolicy?.Policy?.name
        });
      }

      res.json({ message: 'Claim updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  deleteClaim: async (req, res) => {
    try {
      const claim = await Claim.findByPk(req.params.id);
      if (!claim) return res.status(404).json({ message: 'Claim not found' });
      await claim.destroy();
      res.json({ message: 'Claim deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = claimController;
