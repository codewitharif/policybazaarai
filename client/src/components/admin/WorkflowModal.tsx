'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Play, Filter } from 'lucide-react';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workflow: any) => void;
  editingWorkflow?: any;
}

const TRIGGER_TYPES = [
  { value: 'customer_created', label: 'Customer Created' },
  { value: 'policy_enrolled', label: 'Policy Enrolled' },
  { value: 'claim_created', label: 'Claim Created' },
  { value: 'claim_status_updated', label: 'Claim Status Updated' },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
];

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'contains', label: 'Contains' },
];

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'send_sms', label: 'Send SMS' },
  { value: 'send_whatsapp', label: 'Send WhatsApp' },
  { value: 'update_status', label: 'Set Lead Stage' },
  { value: 'assign_lead', label: 'Assign Lead' },
];

const CONDITION_FIELDS = [
  { value: 'city', label: 'City', type: 'text' },
  { value: 'source', label: 'Source', type: 'text' },
  { value: 'conversion_score', label: 'Score', type: 'number' },
  { value: 'customer_type', label: 'Customer Type', type: 'select', options: ['Hot', 'Warm', 'Cold'] },
  { value: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
  { value: 'status', label: 'Status', type: 'select', options: ['New', 'Contacted', 'Qualified', 'Active', 'Inactive', 'Closed', 'Lost'] },
];

const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Active', 'Inactive', 'Closed', 'Lost'];

export default function WorkflowModal({ isOpen, onClose, onSave, editingWorkflow }: WorkflowModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Draft');
  const [trigger, setTrigger] = useState({ type: 'customer_created', config: {} });
  const [conditions, setConditions] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (editingWorkflow) {
      setName(editingWorkflow.name || '');
      setDescription(editingWorkflow.description || '');
      setStatus(editingWorkflow.status || 'Draft');
      setTrigger(editingWorkflow.trigger || { type: 'customer_created', config: {} });
      setConditions(editingWorkflow.conditions || []);
      setActions(editingWorkflow.actions || []);
    } else {
      setName('');
      setDescription('');
      setStatus('Draft');
      setTrigger({ type: 'customer_created', config: {} });
      setConditions([]);
      setActions([]);
    }
  }, [editingWorkflow, isOpen]);

  if (!isOpen) return null;

  const handleAddCondition = () => {
    setConditions([...conditions, { field: 'status', operator: 'equals', value: 'New' }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index: number, field: string, value: any) => {
    const newConditions = [...conditions];
    newConditions[index][field] = value;
    
    // If field changes, reset value to a sensible default based on the field type
    if (field === 'field') {
      const fieldConfig = CONDITION_FIELDS.find(f => f.value === value);
      if (fieldConfig?.type === 'select' && fieldConfig.options) {
        newConditions[index].value = fieldConfig.options[0];
      } else if (fieldConfig?.type === 'number') {
        newConditions[index].value = 0;
      } else {
        newConditions[index].value = '';
      }
    }
    
    setConditions(newConditions);
  };

  const handleAddAction = () => {
    setActions([...actions, { type: 'send_email', config: { to: '{{customer_email}}', subject: '', body: '' } }]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleActionChange = (index: number, type: string) => {
    const newActions = [...actions];
    newActions[index].type = type;
    // Reset config based on type
    if (type === 'send_email') {
      newActions[index].config = { to: '{{customer_email}}', subject: '', body: '' };
    } else if (type === 'send_sms' || type === 'send_whatsapp') {
      newActions[index].config = { to: '{{customer_phone}}', message: '' };
    } else if (type === 'update_status') {
      newActions[index].config = { status: 'New' };
    } else if (type === 'assign_lead') {
      newActions[index].config = { user_id: '' };
    }
    setActions(newActions);
  };

  const handleActionConfigChange = (index: number, field: string, value: any) => {
    const newActions = [...actions];
    newActions[index].config[field] = value;
    setActions(newActions);
  };

  const renderConditionValue = (condition: any, index: number) => {
    const fieldConfig = CONDITION_FIELDS.find(f => f.value === condition.field);

    if (fieldConfig?.type === 'select') {
      return (
        <select
          value={condition.value}
          onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
        >
          {fieldConfig.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={fieldConfig?.type || 'text'}
        placeholder={`e.g., ${fieldConfig?.label || 'Value'}`}
        value={condition.value}
        onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
      />
    );
  };

  const renderActionConfig = (action: any, index: number) => {
    switch (action.type) {
      case 'send_email':
        return (
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">To</label>
              <input
                value={action.config.to}
                onChange={(e) => handleActionConfigChange(index, 'to', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
              <input
                value={action.config.subject}
                onChange={(e) => handleActionConfigChange(index, 'subject', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Body (use {"{{field}}"} for placeholders)</label>
              <textarea
                rows={3}
                value={action.config.body}
                onChange={(e) => handleActionConfigChange(index, 'body', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        );
      case 'send_sms':
      case 'send_whatsapp':
        return (
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">To</label>
              <input
                value={action.config.to}
                onChange={(e) => handleActionConfigChange(index, 'to', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Message</label>
              <textarea
                rows={2}
                value={action.config.message}
                onChange={(e) => handleActionConfigChange(index, 'message', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        );
      case 'update_status':
        return (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Select Stage</label>
            <select
              value={action.config.status}
              onChange={(e) => handleActionConfigChange(index, 'status', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            >
              {LEAD_STAGES.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
        );
      case 'assign_lead':
        return (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Assign To</label>
            <select
              value={action.config.user_id}
              onChange={(e) => handleActionConfigChange(index, 'user_id', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
              ))}
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: editingWorkflow?.id,
      name,
      description,
      status,
      trigger,
      conditions,
      actions
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-900">
            {editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Workflow Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Welcome Email for New Customers"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this workflow do?"
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Trigger */}
          <div className="space-y-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-700">
              <Play size={18} className="fill-current" />
              <h3 className="font-bold">1. Trigger</h3>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">When this happens:</label>
              <select
                value={trigger.type}
                onChange={(e) => setTrigger({ ...trigger, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                {TRIGGER_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-4 p-5 bg-amber-50/50 rounded-2xl border border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700">
                <Filter size={18} />
                <h3 className="font-bold">2. Conditions (Optional)</h3>
              </div>
              <button
                type="button"
                onClick={handleAddCondition}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <Plus size={14} /> Add Condition
              </button>
            </div>
            {conditions.length === 0 && (
              <p className="text-sm text-amber-600/70 italic">No conditions. Actions will always run when triggered.</p>
            )}
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-white p-3 rounded-xl border border-amber-200">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Field</label>
                    <select
                      value={condition.field}
                      onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">Select Field</option>
                      {CONDITION_FIELDS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-40 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Operator</label>
                    <select
                      value={condition.operator}
                      onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    >
                      {OPERATORS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Value</label>
                    {renderConditionValue(condition, index)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(index)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700">
                <Plus size={18} className="bg-emerald-700 text-white rounded-full p-0.5" />
                <h3 className="font-bold">3. Actions</h3>
              </div>
              <button
                type="button"
                onClick={handleAddAction}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus size={14} /> Add Action
              </button>
            </div>
            {actions.length === 0 && (
              <p className="text-sm text-emerald-600/70 italic">Add at least one action to execute.</p>
            )}
            <div className="space-y-4">
              {actions.map((action, index) => (
                <div key={index} className="bg-white p-4 rounded-xl border border-emerald-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-48 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Action Type</label>
                      <select
                        value={action.type}
                        onChange={(e) => handleActionChange(index, e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      >
                        {ACTION_TYPES.map(a => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(index)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {renderActionConfig(action, index)}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 sticky bottom-0 bg-white z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Save size={18} />
              Save Workflow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
