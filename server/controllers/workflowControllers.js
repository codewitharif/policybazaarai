const { Workflow } = require('../models');

const workflowControllers = {
  getAllWorkflows: async (req, res) => {
    try {
      const workflows = await Workflow.findAll({
        order: [['created_at', 'DESC']]
      });
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getWorkflowById: async (req, res) => {
    try {
      const workflow = await Workflow.findByPk(req.params.id);
      if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  createWorkflow: async (req, res) => {
    try {
      const workflow = await Workflow.create(req.body);
      res.status(201).json(workflow);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  updateWorkflow: async (req, res) => {
    try {
      const workflow = await Workflow.findByPk(req.params.id);
      if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
      
      await workflow.update(req.body);
      res.json(workflow);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  deleteWorkflow: async (req, res) => {
    try {
      const workflow = await Workflow.findByPk(req.params.id);
      if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
      
      await workflow.destroy();
      res.json({ message: 'Workflow deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = workflowControllers;
