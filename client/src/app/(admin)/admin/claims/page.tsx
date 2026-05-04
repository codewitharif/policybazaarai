'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  MoreHorizontal, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  ArrowUpDown,
  User,
  ShieldCheck,
  Plus,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Edit,
  Trash2,
  X
} from 'lucide-react';

interface ClaimData {
  id: number;
  claim_number: string;
  amount_claimed: string;
  type: string;
  status: string;
  claim_date: string;
  description: string;
  attachment_url?: string;
  CustomerPolicy: {
    policy_number: string;
    Customer: {
      name: string;
      email: string;
      phone: string;
    };
    Policy: {
      name: string;
      provider: string;
    };
  };
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<ClaimData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [totalClaims, setTotalClaims] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [formData, setFormData] = useState({
    claim_number: '',
    amount_claimed: '',
    type: '',
    status: '',
    claim_date: '',
    description: ''
  });
  const [selectedClaim, setSelectedClaim] = useState<ClaimData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/claims?page=${currentPage}&limit=${pageSize}&search=${searchTerm}&status=${filterStatus}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch claims: ${response.statusText}`);
      }
      const data = await response.json();
      setClaims(data.claims);
      setTotalClaims(data.total);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [currentPage, pageSize, searchTerm, filterStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const totalPages = Math.ceil(totalClaims / pageSize);

  const handleOpenModal = (mode: 'view' | 'edit' | 'create', claim?: ClaimData) => {
    setModalMode(mode);
    if (claim) {
      setSelectedClaim(claim);
      setFormData({
        claim_number: claim.claim_number || '',
        amount_claimed: claim.amount_claimed || '',
        type: claim.type || '',
        status: claim.status || '',
        claim_date: claim.claim_date || '',
        description: claim.description || ''
      });
    } else {
      setSelectedClaim(null);
      setFormData({
        claim_number: `CLM-${Math.floor(10000 + Math.random() * 90000)}`,
        amount_claimed: '',
        type: 'Medical',
        status: 'Submitted',
        claim_date: new Date().toISOString().split('T')[0],
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'view') {
      setIsModalOpen(false);
      return;
    }

    setSubmitting(true);
    try {
      const url = modalMode === 'edit' 
        ? `${process.env.NEXT_PUBLIC_API_URL}/claims/${selectedClaim?.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/claims`;
      
      const response = await fetch(url, {
        method: modalMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Action failed');
      
      setIsModalOpen(false);
      fetchClaims();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClaim = async (id: number) => {
    if (!confirm('Are you sure you want to delete this claim? This action cannot be undone.')) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/claims/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Delete failed');
      fetchClaims();
    } catch (err) {
      alert('Error deleting claim: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleExport = () => {
    if (claims.length === 0) return;

    const headers = ['Claim Number', 'Customer Name', 'Customer Email', 'Provider', 'Policy Name', 'Amount', 'Type', 'Status', 'Date'];
    const rows = claims.map(claim => [
      claim.claim_number,
      claim.CustomerPolicy?.Customer?.name || 'N/A',
      claim.CustomerPolicy?.Customer?.email || 'N/A',
      claim.CustomerPolicy?.Policy?.provider || 'N/A',
      claim.CustomerPolicy?.Policy?.name || 'N/A',
      claim.amount_claimed,
      claim.type,
      claim.status,
      new Date(claim.claim_date).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `claims_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = [
    { label: 'Total Claims', value: (totalClaims || 0).toString(), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'In Review', value: (claims || []).filter(c => c?.status === 'In Review').length.toString(), icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Approved', value: (claims || []).filter(c => c?.status === 'Approved').length.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Rejected', value: (claims || []).filter(c => c?.status === 'Rejected').length.toString(), icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Claims Management</h1>
          <p className="text-slate-500 mt-1">Monitor, review, and process insurance claims</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={18} />
            Reports
          </button>
          <button 
            onClick={() => handleOpenModal('create')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            New Claim
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-sm`}>
              <stat.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Claims Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative w-full lg:max-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Claim ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 sm:px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Status</option>
              <option value="Submitted">Submitted</option>
              <option value="In Review">In Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                <th className="px-6 py-4">Claim Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Provider / Policy</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && claims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-emerald-500" />
                      Loading claims...
                    </div>
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    {searchTerm ? 'No claims found matching your search.' : 'No claims data available.'}
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-white transition-colors">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{claim.claim_number}</p>
                          <p className="text-[10px] font-medium text-slate-400">
                            {new Date(claim.claim_date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {claim.CustomerPolicy?.Customer?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">
                          {claim.CustomerPolicy?.Policy?.provider || 'N/A'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {claim.CustomerPolicy?.Policy?.name || 'N/A'} • {claim.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">
                        ₹{Number(claim.amount_claimed).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        claim.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        claim.status === 'In Review' ? 'bg-amber-100 text-amber-700' :
                        claim.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleOpenModal('view', claim)}
                          title="View Details" 
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleOpenModal('edit', claim)}
                          title="Edit Claim" 
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClaim(claim.id)}
                          title="Delete Claim" 
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalClaims > 0 && (
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
                of <span className="text-slate-900 font-bold">{totalClaims}</span> claims
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

      {/* Claim Modal (View/Edit/Create) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {modalMode === 'create' ? 'Record New Claim' : modalMode === 'edit' ? 'Edit Claim' : 'Claim Details'}
                </h2>
                {selectedClaim && (
                  <p className="text-xs text-slate-500 mt-1">Ref: {selectedClaim.claim_number}</p>
                )}
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Claim Number</label>
                    <input 
                      type="text" 
                      required
                      disabled={modalMode === 'view' || modalMode === 'edit'}
                      value={formData.claim_number}
                      onChange={(e) => setFormData({...formData, claim_number: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Claim Type</label>
                    <select 
                      disabled={modalMode === 'view'}
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                    >
                      <option value="Medical">Medical</option>
                      <option value="Accident">Accident</option>
                      <option value="Death">Death</option>
                      <option value="Travel">Travel</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Claim Date</label>
                    <input 
                      type="date" 
                      required
                      disabled={modalMode === 'view'}
                      value={formData.claim_date}
                      onChange={(e) => setFormData({...formData, claim_date: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                    />
                  </div>
                </div>

                {/* Status & Amount */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Financials & Status</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount Claimed (₹)</label>
                    <input 
                      type="number" 
                      required
                      disabled={modalMode === 'view'}
                      placeholder="0.00"
                      value={formData.amount_claimed}
                      onChange={(e) => setFormData({...formData, amount_claimed: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Processing Status</label>
                    <select 
                      disabled={modalMode === 'view'}
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="In Review">In Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                    <textarea 
                      rows={3}
                      disabled={modalMode === 'view'}
                      placeholder="Detailed reason for claim..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70 resize-none"
                    />
                  </div>
                </div>
              </div>

              {modalMode === 'view' && selectedClaim && (
                <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                   <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Customer Info</p>
                      <p className="text-sm font-bold text-slate-900">{selectedClaim.CustomerPolicy?.Customer?.name}</p>
                      <p className="text-xs text-slate-500">{selectedClaim.CustomerPolicy?.Customer?.email}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Policy Details</p>
                      <p className="text-sm font-bold text-slate-900">{selectedClaim.CustomerPolicy?.Policy?.name}</p>
                      <p className="text-xs text-slate-500">{selectedClaim.CustomerPolicy?.Policy?.provider} • {selectedClaim.CustomerPolicy?.policy_number}</p>
                   </div>
                   {selectedClaim.attachment_url && (
                    <div className="col-span-2 pt-2 mt-2 border-t border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Supporting Documents</p>
                      <a 
                        href={selectedClaim.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-all shadow-sm"
                      >
                        <Download size={14} />
                        View Attachment
                      </a>
                    </div>
                   )}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                >
                  {modalMode === 'view' ? 'Close' : 'Cancel'}
                </button>
                {modalMode !== 'view' && (
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-2 px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        Saving...
                      </div>
                    ) : modalMode === 'create' ? 'Record Claim' : 'Update Claim'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
