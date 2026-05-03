const { Op } = require('sequelize');
const Category = require('../models/categoryModels');
const Policy = require('../models/policyModels');

const policyController = {
  // Policies
  getAllPolicies: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';
      const category = req.query.category || 'All';

      const where = {};
      
      // Add search filter
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { provider: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add category filter
      const include = [{ model: Category }];
      if (category !== 'All') {
        const baseTerms = [category];
        
        // Add synonyms for common product types
        if (category === 'Life') {
          baseTerms.push('Term', 'Saving', 'Investment', 'Pension', 'Endowment');
        } else if (category === 'Motor') {
          baseTerms.push('Car', 'Bike', 'Vehicle', 'Two Wheeler', 'Four Wheeler', 'Auto');
        } else if (category === 'Health') {
          baseTerms.push('Medical', 'Mediclaim', 'Care', 'Wellness', 'Hospital', 'Illness', 'Floater', 'Disease');
        }

        // Create a broad set of terms (original, lowercase, uppercase) to handle different DB behaviors
        const searchTerms = [];
        baseTerms.forEach(term => {
          searchTerms.push(term);
          searchTerms.push(term.toLowerCase());
          searchTerms.push(term.toUpperCase());
        });

        // Use a Set to unique terms
        const uniqueTerms = [...new Set(searchTerms)];

        include[0].where = { 
          [Op.or]: uniqueTerms.map(term => ({
            name: { [Op.like]: `%${term}%` }
          }))
        };
      }

      const { count, rows } = await Policy.findAndCountAll({
        where,
        include,
        limit: limit,
        offset: offset,
        order: [['created_at', 'DESC']]
      });

      res.json({
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: page,
        policies: rows
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  getPolicyById: async (req, res) => {
    try {
      const policy = await Policy.findByPk(req.params.id, { include: [Category] });
      if (!policy) return res.status(404).json({ message: 'Policy not found' });
      res.json(policy);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  createPolicy: async (req, res) => {
    try {
      const policy = await Policy.create(req.body);
      res.status(201).json(policy);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  updatePolicy: async (req, res) => {
    try {
      const policy = await Policy.findByPk(req.params.id);
      if (!policy) return res.status(404).json({ message: 'Policy not found' });
      await policy.update(req.body);
      res.json({ message: 'Policy updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  deletePolicy: async (req, res) => {
    try {
      const policy = await Policy.findByPk(req.params.id);
      if (!policy) return res.status(404).json({ message: 'Policy not found' });
      await policy.destroy();
      res.json({ message: 'Policy deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = policyController;
