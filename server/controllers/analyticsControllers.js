const { Chat, CommunicationLog } = require('../models/communicationModels');
const Customer = require('../models/customerModels');
const Category = require('../models/categoryModels');
const Policy = require('../models/policyModels');
const CustomerPolicy = require('../models/customerPolicyLinkModels');
const Payout = require('../models/payoutsModels');
const sequelize = require('../db/db');
const { Op } = require('sequelize');

const analyticsController = {
  getAdminDashboardSummary: async (req, res) => {
    try {
      // 1. Stats Grid
      const totalLeads = await Customer.count();
      const activePoliciesCount = await CustomerPolicy.count({ where: { status: 'Active' } });
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const leadsThisMonth = await Customer.count({
        where: {
          created_at: { [Op.gte]: startOfMonth }
        }
      });

      const totalChats = await Chat.count();
      const convertedLeadsCount = await Customer.count({
        where: { status: { [Op.in]: ['Active', 'Closed'] } }
      });
      const conversionRate = totalChats > 0 ? ((convertedLeadsCount / totalChats) * 100).toFixed(1) : 0;

      // 2. Revenue History (Last 12 months)
      const revenueHistory = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

        const results = await Payout.findAll({
          where: {
            created_at: { [Op.between]: [monthStart, monthEnd] }
          },
          attributes: [
            [sequelize.fn('SUM', sequelize.col('sale_amount')), 'total_sales'],
            [sequelize.fn('SUM', sequelize.col('commission_amount')), 'total_commission']
          ],
          raw: true
        });

        revenueHistory.push({
          month: months[date.getMonth()],
          year: date.getFullYear(),
          sales: parseFloat(results[0].total_sales || 0),
          commission: parseFloat(results[0].total_commission || 0)
        });
      }

      // 3. Recent Leads
      const recentLeads = await Customer.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [{
          model: Category,
          attributes: ['name']
        }]
      });

      // 4. Leads by Category
      const leadsByCategory = await Customer.findAll({
        attributes: [
          [sequelize.col('Category.name'), 'category'],
          [sequelize.fn('COUNT', sequelize.col('Customer.id')), 'count']
        ],
        include: [{
          model: Category,
          attributes: []
        }],
        group: ['Category.name'],
        raw: true
      });

      res.json({
        stats: {
          totalLeads,
          activePolicies: activePoliciesCount,
          conversionRate: `${conversionRate}%`,
          leadsThisMonth
        },
        revenueHistory,
        leadsByCategory,
        recentLeads: recentLeads.map(lead => ({
          id: lead.id,
          name: lead.name,
          status: lead.status,
          policyName: lead.Category?.name || 'Inquiry',
          createdAt: lead.created_at
        }))
      });
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getDashboardStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const dateFilter = {};
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.created_at = { [Op.between]: [start, end] };
      } else if (startDate) {
        dateFilter.created_at = { [Op.gte]: new Date(startDate) };
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.created_at = { [Op.lte]: end };
      }

      // 1. Total Conversations (from Chat model)
      const totalConversations = await Chat.count({ where: dateFilter });

      // 2. Resolution Rate
      const resolvedChats = await Chat.count({
        where: {
          ...dateFilter,
          status: { [Op.in]: ['Closed', 'AI_Handled'] }
        }
      });
      const resolutionRate = totalConversations > 0 
        ? ((resolvedChats / totalConversations) * 100).toFixed(1) 
        : 0;

      // 3. Lead Conversion
      const convertedLeads = await Customer.count({
        where: {
          ...dateFilter,
          status: { [Op.in]: ['Active', 'Closed'] }
        }
      });
      const leadConversion = totalConversations > 0
        ? ((convertedLeads / totalConversations) * 100).toFixed(1)
        : 0;

      // 4. Leads by Category
      const leadsByCategory = await Customer.findAll({
        where: dateFilter,
        attributes: [
          [sequelize.col('Category.name'), 'category'],
          [sequelize.fn('COUNT', sequelize.col('Customer.id')), 'count']
        ],
        include: [{
          model: Category,
          attributes: []
        }],
        group: ['Category.name'],
        raw: true
      });

      // 5. Leads by Status
      const leadsByStatus = await Customer.findAll({
        where: dateFilter,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      res.json({
        totalConversations,
        resolutionRate,
        leadConversion,
        leadsByCategory,
        leadsByStatus
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = analyticsController;
