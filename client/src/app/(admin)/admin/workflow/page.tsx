'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ArrowRight, 
  Clock, 
  Play, 
  Pause, 
  Settings2, 
  Trash2 
} from 'lucide-react';
import WorkflowModal from '@/components/admin/WorkflowModal';

interface Workflow {
  id: number;
  name: string;
  description: string;
  status: 'Active' | 'Paused' | 'Draft';
  last_run: string;
  trigger: any;
  conditions: any[];
  actions: any[];
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/workflows`);
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkflow = () => {
    setEditingWorkflow(null);
    setIsModalOpen(true);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setIsModalOpen(true);
  };

  const handleSaveWorkflow = async (workflowData: any) => {
    try {
      const url = workflowData.id 
        ? `${API_BASE_URL}/workflows/${workflowData.id}` 
        : `${API_BASE_URL}/workflows`;
      
      const method = workflowData.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) throw new Error('Failed to save workflow');
      
      setIsModalOpen(false);
      fetchWorkflows();
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (id: number) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete workflow');
      fetchWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflows</h1>
          <p className="text-slate-500 mt-1">Design and automate your business processes</p>
        </div>
        <button 
          onClick={handleCreateWorkflow}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          <Plus size={18} />
          Create Workflow
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Workflows', value: workflows.length.toString(), icon: TrendingUp, color: 'bg-blue-500' },
          { label: 'Active Now', value: workflows.filter(w => w.status === 'Active').length.toString(), icon: Play, color: 'bg-emerald-500' },
          { label: 'Paused', value: workflows.filter(w => w.status === 'Paused').length.toString(), icon: Pause, color: 'bg-amber-500' },
          { label: 'Drafts', value: workflows.filter(w => w.status === 'Draft').length.toString(), icon: Clock, color: 'bg-slate-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg shadow-current/10`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Workflow Name</th>
                <th className="px-6 py-4">Trigger</th>
                <th className="px-6 py-4">Actions</th>
                <th className="px-6 py-4">Last Run</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">Loading workflows...</td>
                </tr>
              ) : filteredWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">No workflows found.</td>
                </tr>
              ) : filteredWorkflows.map((workflow) => (
                <tr key={workflow.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-bold text-slate-900">{workflow.name}</p>
                      <p className="text-xs text-slate-500 truncate">{workflow.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                      {workflow.trigger?.type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                      <Settings2 size={14} className="text-slate-400" />
                      {workflow.actions?.length || 0} Actions
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Clock size={14} className="text-slate-400" />
                      {workflow.last_run ? new Date(workflow.last_run).toLocaleString() : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      workflow.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      workflow.status === 'Paused' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        workflow.status === 'Active' ? 'bg-emerald-500' :
                        workflow.status === 'Paused' ? 'bg-amber-500' :
                        'bg-slate-500'
                      }`} />
                      {workflow.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditWorkflow(workflow)}
                        title="Edit" 
                        className="p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-all"
                      >
                        <ArrowRight size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        title="Delete" 
                        className="p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button title="More" className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-all">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <WorkflowModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveWorkflow}
        editingWorkflow={editingWorkflow}
      />
    </div>
  );
}
