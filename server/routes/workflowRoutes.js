const express = require('express');
const router = express.Router();
const workflowControllers = require('../controllers/workflowControllers');

router.get('/', workflowControllers.getAllWorkflows);
router.get('/:id', workflowControllers.getWorkflowById);
router.post('/', workflowControllers.createWorkflow);
router.put('/:id', workflowControllers.updateWorkflow);
router.delete('/:id', workflowControllers.deleteWorkflow);

module.exports = router;
