'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Upload,
  MoreHorizontal, 
  Mail, 
  Phone, 
  ChevronLeft, 
  ChevronRight,
  User,
  Eye,
  Edit,
  Trash2,
  X,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Category {
  id: number;
  name: string;
  Product?: {
    id: number;
    name: string;
  };
}

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Active' | 'Inactive' | 'Closed' | 'Lost';
  customer_type: 'Hot' | 'Warm' | 'Cold';
  address?: string;
  city?: string;
  dob?: string;
  source?: string;
  created_at: string;
  conversion_score?: number;
  Category?: Category;
  policy_category_id?: number;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLeads, setTotalLeads] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCustomerType, setFilterCustomerType] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'asc' | 'desc' } | null>(null);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Lead>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/customers?page=${currentPage}&limit=${pageSize}&search=${searchTerm}&status=${filterStatus}&customer_type=${filterCustomerType}`);
      const data = await response.json();
      if (data && Array.isArray(data.customers)) {
        setLeads(data.customers);
        setTotalLeads(data.total);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      const data = await response.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [currentPage, pageSize, searchTerm, filterStatus, filterCustomerType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterCustomerType]);

  const totalPages = Math.ceil(totalLeads / pageSize);

  const handleSort = (key: keyof Lead) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete lead');
      }

      await fetchLeads();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleView = (lead: Lead) => {
    setSelectedLead(lead);
    setIsViewModalOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setEditFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      customer_type: lead.customer_type,
      address: lead.address || '',
      city: lead.city || '',
      dob: lead.dob || '',
      policy_category_id: lead.policy_category_id
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`http://localhost:5000/api/customers/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) throw new Error('Failed to update lead');

      await fetchLeads();
      setIsEditModalOpen(false);
      setSelectedLead(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = () => {
    if (leads.length === 0) return;

    const headers = ['Name', 'Email', 'Phone', 'Interest', 'Status', 'Type', 'Address', 'City', 'DOB', 'Created'];
    const rows = leads.map(lead => [
      lead.name,
      lead.email,
      lead.phone,
      lead.Category?.name || 'N/A',
      lead.status,
      lead.customer_type,
      lead.address || '',
      lead.city || '',
      lead.dob || '',
      new Date(lead.created_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSample = () => {
    const headers = ['name', 'email', 'phone', 'address', 'city', 'dob', 'status', 'customer_type'];
    const sampleData = ['John Doe', 'john@example.com', '9876543210', '123 Street', 'Mumbai', '1990-01-01', 'New', 'Warm'];
    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'leads_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdating(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const newLeads = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const lead: any = {};
        headers.forEach((header, index) => {
          lead[header] = values[index];
        });
        return lead;
      });

      let successCount = 0;
      for (const lead of newLeads) {
        try {
          const response = await fetch('http://localhost:5000/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              address: lead.address,
              city: lead.city,
              dob: lead.dob,
              status: lead.status || 'New',
              customer_type: lead.customer_type || 'Cold',
              source: 'Import'
            }),
          });
          if (response.ok) successCount++;
        } catch (err) {
          console.error('Error importing lead:', lead, err);
        }
      }

      alert(`Successfully imported ${successCount} leads`);
      setIsUpdating(false);
      fetchLeads();
      if (e.target) e.target.value = '';
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Leads Management</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-2">Track and manage leads from the chatbot.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-100 transition-colors shrink-0"
          >
            <Upload size={16} className="sm:w-[18px] sm:h-[18px]" />
            Import Leads
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
          >
            <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Upload size={20} className="text-emerald-500" />
                Import Leads via CSV
              </h2>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Instructions:</h3>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
                  <li>Your CSV file should have headers in the first row.</li>
                  <li>Required headers: <span className="font-mono bg-slate-200 px-1 rounded">name</span>, <span className="font-mono bg-slate-200 px-1 rounded">email</span>, <span className="font-mono bg-slate-200 px-1 rounded">phone</span>.</li>
                  <li>Optional headers: <span className="font-mono bg-slate-200 px-1 rounded">address</span>, <span className="font-mono bg-slate-200 px-1 rounded">city</span>, <span className="font-mono bg-slate-200 px-1 rounded">dob</span>, <span className="font-mono bg-slate-200 px-1 rounded">status</span>, <span className="font-mono bg-slate-200 px-1 rounded">customer_type</span>.</li>
                  <li>Status values: New, Contacted, Qualified, etc.</li>
                  <li>Type values: Hot, Warm, Cold.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="text-center sm:text-left">
                  <p className="text-sm font-bold text-slate-700">Need a template?</p>
                  <p className="text-xs text-slate-500">Download our sample CSV to get started.</p>
                </div>
                <button 
                  onClick={handleDownloadSample}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Download size={14} />
                  Download Sample
                </button>
              </div>

              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-emerald-200 rounded-2xl cursor-pointer bg-emerald-50/30 hover:bg-emerald-50 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUpdating ? (
                      <Loader2 className="w-8 h-8 mb-3 text-emerald-500 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 mb-3 text-emerald-400 group-hover:text-emerald-500 transition-colors" />
                    )}
                    <p className="mb-2 text-sm text-slate-700 font-bold">
                      {isUpdating ? 'Processing leads...' : 'Click to upload your CSV'}
                    </p>
                    <p className="text-xs text-slate-500">CSV files only (MAX. 5MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv" 
                    disabled={isUpdating}
                    onChange={(e) => {
                      handleImport(e);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header/Actions */}
        <div className="px-4 sm:px-7 py-4 sm:py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 sm:w-[18px] sm:h-[18px]" size={16} />
            <input 
              type="text" 
              placeholder="Search leads by name, email or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 sm:px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Closed">Closed</option>
              <option value="Lost">Lost</option>
            </select>
            <select 
              value={filterCustomerType}
              onChange={(e) => setFilterCustomerType(e.target.value)}
              className="px-3 sm:px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Types</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
            <div className="h-6 sm:h-8 w-px bg-slate-200 mx-0.5 sm:mx-1"></div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium whitespace-nowrap">
              Showing <span className="text-slate-900 font-bold">{leads.length}</span> results
            </p>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-4 sm:px-7 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Lead</th>
                <th className="px-4 sm:px-7 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-4 sm:px-7 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Potential Score</th>
                <th className="px-4 sm:px-7 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Policy Interest</th>
                <th className="px-4 sm:px-7 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 sm:px-7 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-4 sm:px-7 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 sm:px-7 py-10 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-emerald-500" />
                      Loading leads...
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 sm:px-7 py-10 text-center text-slate-500">
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead, i) => (
                  <motion.tr 
                    key={lead.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-4 sm:px-7 py-4 sm:py-5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px] sm:text-xs border border-emerald-200 shrink-0">
                          {lead.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">{lead.name}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">ID: #L-00{lead.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-7 py-4 sm:py-5">
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider
                        ${lead.customer_type === 'Hot' ? 'bg-rose-100 text-rose-600' : 
                          lead.customer_type === 'Warm' ? 'bg-orange-100 text-orange-600' : 
                          'bg-blue-100 text-blue-600'}
                      `}>
                        {lead.customer_type}
                      </span>
                    </td>
                    <td className="px-4 sm:px-7 py-4 sm:py-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              (lead.conversion_score || 0) >= 75 ? 'bg-emerald-500' : 
                              (lead.conversion_score || 0) >= 40 ? 'bg-amber-500' : 
                              'bg-rose-500'
                            }`}
                            style={{ width: `${lead.conversion_score || 0}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${
                          (lead.conversion_score || 0) >= 75 ? 'text-emerald-600' : 
                          (lead.conversion_score || 0) >= 40 ? 'text-amber-600' : 
                          'text-rose-600'
                        }`}>
                          {lead.conversion_score || 0}/100
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-7 py-4 sm:py-5">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">{lead.Category?.Product?.name || 'General Inquiry'}</p>
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider mt-1 inline-block whitespace-nowrap">
                          {lead.Category?.name || 'General'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-7 py-4 sm:py-5">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer group/item">
                          <Mail size={10} className="sm:w-3 sm:h-3" />
                          <span className="text-[10px] sm:text-xs font-medium truncate">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer group/item">
                          <Phone size={10} className="sm:w-3 sm:h-3" />
                          <span className="text-[10px] sm:text-xs font-medium truncate">{lead.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-7 py-4 sm:py-5 text-center">
                      <span className={`
                        inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap
                        ${lead.status === 'New' ? 'bg-blue-100 text-blue-600' : 
                          lead.status === 'Contacted' ? 'bg-amber-100 text-amber-600' : 
                          lead.status === 'Qualified' ? 'bg-purple-100 text-purple-600' :
                          lead.status === 'Active' ? 'bg-emerald-100 text-emerald-600' :
                          'bg-slate-100 text-slate-600'}
                      `}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-7 py-4 sm:py-5 shrink-0">
                      <p className="text-[10px] sm:text-xs font-bold text-slate-700 whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleView(lead)}
                          title="View Details" 
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleEdit(lead)}
                          title="Edit Lead" 
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(lead.id)}
                          title="Delete Lead" className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalLeads > 0 && (
          <div className="px-4 sm:px-7 py-4 sm:py-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm text-slate-500 font-medium">Show</span>
              <select 
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2 shadow-sm outline-none"
              >
                {[10, 20, 50, 100].map(size => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
              <span className="text-xs sm:text-sm text-slate-500 font-medium whitespace-nowrap">
                of <span className="text-slate-900 font-bold">{totalLeads}</span> leads
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                          currentPage === page 
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 || 
                    page === currentPage + 2
                  ) {
                    return <span key={page} className="px-1 text-slate-400 text-xs sm:text-sm">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Lead Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Name</label>
                  <p className="text-sm font-semibold text-slate-900">{selectedLead.name}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Status</label>
                  <p className="text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      selectedLead.status === 'New' ? 'bg-blue-100 text-blue-600' : 
                      selectedLead.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedLead.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Type</label>
                  <p className="text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      selectedLead.customer_type === 'Hot' ? 'bg-rose-100 text-rose-600' : 
                      selectedLead.customer_type === 'Warm' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {selectedLead.customer_type}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Potential Score</label>
                  <p className={`text-sm font-bold ${
                    (selectedLead.conversion_score || 0) >= 75 ? 'text-emerald-600' : 
                    (selectedLead.conversion_score || 0) >= 40 ? 'text-amber-600' : 
                    'text-rose-600'
                  }`}>
                    {selectedLead.conversion_score || 0}/100
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Email</label>
                  <p className="text-sm font-semibold text-slate-900">{selectedLead.email}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Phone</label>
                  <p className="text-sm font-semibold text-slate-900">{selectedLead.phone}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Product</label>
                  <p className="text-sm font-semibold text-slate-900">{selectedLead.Category?.Product?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Category</label>
                  <p className="text-sm font-semibold text-slate-900">{selectedLead.Category?.name || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 uppercase font-bold">Address</label>
                  <p className="text-sm font-semibold text-slate-900">{selectedLead.address || 'N/A'}, {selectedLead.city || ''}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Date of Birth</label>
                  <p className="text-sm font-semibold text-slate-900">{selectedLead.dob || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Created At</label>
                  <p className="text-sm font-semibold text-slate-900">{new Date(selectedLead.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Edit Lead</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Name</label>
                    <input 
                      type="text" 
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Email</label>
                    <input 
                      type="email" 
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Phone</label>
                    <input 
                      type="text" 
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Status</label>
                    <select 
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({...editFormData, status: e.target.value as any})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Closed">Closed</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Type</label>
                    <select 
                      value={editFormData.customer_type}
                      onChange={(e) => setEditFormData({...editFormData, customer_type: e.target.value as any})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option value="Hot">Hot</option>
                      <option value="Warm">Warm</option>
                      <option value="Cold">Cold</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Category</label>
                    <select 
                      value={editFormData.policy_category_id}
                      onChange={(e) => setEditFormData({...editFormData, policy_category_id: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Address</label>
                    <input 
                      type="text" 
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)} 
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdating && <Loader2 size={16} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
