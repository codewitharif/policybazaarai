const Payout = require('../models/payoutsModels');
const CustomerPolicy = require('../models/customerPolicyLinkModels');
const Policy = require('../models/policyModels');
const Customer = require('../models/customerModels');
const { Op } = require('sequelize');

const payoutController = {
  getAllPayouts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';
      const status = req.query.status || 'All';
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;

      const whereClause = {
        [Op.or]: [
          { transaction_id: { [Op.like]: `%${search}%` } },
          { '$CustomerPolicy.Customer.name$': { [Op.like]: `%${search}%` } },
          { '$CustomerPolicy.Policy.name$': { [Op.like]: `%${search}%` } },
          { '$CustomerPolicy.Policy.provider$': { [Op.like]: `%${search}%` } }
        ]
      };

      if (status !== 'All') {
        whereClause.status = status;
      }

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.payout_date = {
          [Op.between]: [start, end]
        };
      } else if (startDate) {
        whereClause.payout_date = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.payout_date = {
          [Op.lte]: end
        };
      }

      const { count, rows } = await Payout.findAndCountAll({ 
        where: whereClause,
        include: [{
          model: CustomerPolicy,
          include: [Policy, Customer]
        }],
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      res.json({
        total: count,
        payouts: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  getPayoutById: async (req, res) => {
    try {
      const payout = await Payout.findByPk(req.params.id, { 
        include: [{
          model: CustomerPolicy,
          include: [Policy, Customer]
        }] 
      });
      if (!payout) return res.status(404).json({ message: 'Payout not found' });
      res.json(payout);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  createPayout: async (req, res) => {
    try {
      const payout = await Payout.create(req.body);
      res.status(201).json(payout);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  updatePayoutStatus: async (req, res) => {
    try {
      const payout = await Payout.findByPk(req.params.id);
      if (!payout) return res.status(404).json({ message: 'Payout not found' });
      await payout.update(req.body);
      res.json({ message: 'Payout updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  deletePayout: async (req, res) => {
    try {
      const payout = await Payout.findByPk(req.params.id);
      if (!payout) return res.status(404).json({ message: 'Payout not found' });
      await payout.destroy();
      res.json({ message: 'Payout deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = payoutController;
