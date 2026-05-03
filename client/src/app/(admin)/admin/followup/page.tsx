'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  MoreVertical,
  Search,
  Filter,
  CalendarCheck,
  User,
  MessageSquare,
  MessageCircle,
  Tag
} from 'lucide-react';
import MessageModal from '@/components/admin/MessageModal';
import Lead360Modal from '@/components/admin/Lead360Modal';
import CommunicationLogModal from '@/components/admin/CommunicationLogModal';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  priority: string;
  customer_type: 'Hot' | 'Warm' | 'Cold';
  source: string;
  conversion_score: number;
  created_at: string;
  Category?: {
    id: number;
    name: string;
  };
}

export default function CommunicationLogPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [messageType, setMessageType] = useState<'email' | 'sms' | 'whatsapp'>('email');

  // Lead 360 Modal State
  const [isLead360Open, setIsLead360Open] = useState(false);
  const [lead360Id, setLead360Id] = useState<number | null>(null);
  const [lead360Tab, setLead360Tab] = useState<'overview' | 'policies' | 'communications' | 'claims' | 'timeline'>('overview');

  // Communication Log Modal State
  const [isCommLogOpen, setIsCommLogOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    fetchCustomers();

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.dropdown-container')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [currentPage, pageSize, searchQuery, activeTab, priorityFilter, typeFilter]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const statusFilter = activeTab === 'all' ? 'All' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      const response = await fetch(`http://localhost:5000/api/customers?page=${currentPage}&limit=${pageSize}&search=${searchQuery}&status=${statusFilter}&priority=${priorityFilter}&customer_type=${typeFilter}`);
      const data = await response.json();
      setCustomers(data.customers || []);
      setTotalCustomers(data.total || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCustomers / pageSize);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleOpenModal = (customer: Customer, type: 'email' | 'sms' | 'whatsapp') => {
    setSelectedCustomer(customer);
    setMessageType(type);
    setIsModalOpen(true);
  };

  const handleOpenLead360 = (id: number, tab: 'overview' | 'policies' | 'communications' | 'claims' | 'timeline' = 'overview') => {
    setLead360Id(id);
    setLead360Tab(tab);
    setIsLead360Open(true);
    setOpenMenuId(null);
  };

  const handleOpenCommLog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCommLogOpen(true);
    setOpenMenuId(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Follow-up Management</h1>
          <p className="text-slate-500 mt-1">Track and manage your client interactions</p>
        </div>
        
        <div className="flex items-center gap-3 min-w-[200px]">
          <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">Filter Status:</span>
          <select 
            value={activeTab}
            onChange={(e) => {
              setActiveTab(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 shadow-sm outline-none transition-all"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="closed">Closed</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search and Priority Filter */}
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-6 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 min-w-[200px]">
              <Filter className="text-slate-400" size={18} />
              <select 
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 outline-none transition-all"
              >
                <option value="All">All Priority</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div className="flex items-center gap-2 min-w-[200px]">
              <Tag className="text-slate-400" size={18} />
              <select 
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 outline-none transition-all"
              >
                <option value="All">All Types</option>
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cold">Cold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Joined Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin text-emerald-500" />
                      Loading customers...
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">No customers found.</td>
                </tr>
              ) : (
                customers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* Customer Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          <User size={20} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 truncate">{item.name}</h3>
                          <p className="text-xs text-slate-500 truncate">{item.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.customer_type === 'Hot' ? 'bg-rose-100 text-rose-700' :
                        item.customer_type === 'Warm' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {item.customer_type}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                        item.status === 'New' ? 'bg-blue-100 text-blue-700' :
                        item.status === 'Contacted' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${
                          item.conversion_score >= 70 ? 'text-emerald-600' :
                          item.conversion_score >= 40 ? 'text-amber-600' :
                          'text-rose-600'
                        }`}>
                          {item.conversion_score || 0}%
                        </span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full rounded-full ${
                              item.conversion_score >= 70 ? 'bg-emerald-500' :
                              item.conversion_score >= 40 ? 'bg-amber-500' :
                              'bg-rose-500'
                            }`}
                            style={{ width: `${item.conversion_score || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                        item.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {item.priority || 'Medium'}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-slate-700 font-medium">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </td>

                    {/* Source */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Tag size={12} className="text-slate-400" />
                        {item.source || 'Direct'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-3 justify-end relative">
                        <button 
                          onClick={() => handleOpenModal(item, 'sms')}
                          title="SMS Client" 
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(item, 'email')}
                          title="Email Client" 
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <Mail size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(item, 'whatsapp')}
                          title="WhatsApp Client" 
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                        >
                          <MessageCircle size={16} />
                        </button>
                        
                        <div className="relative dropdown-container">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === item.id ? null : item.id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${openMenuId === item.id ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                          >
                            <MoreVertical size={18} />
                          </button>

                          {openMenuId === item.id && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                              <button 
                                onClick={() => handleOpenCommLog(item)}
                                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                              >
                                <Clock size={16} className="text-slate-400" />
                                Communication Log
                              </button>
                              <button 
                                onClick={() => handleOpenLead360(item.id, 'timeline')}
                                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                              >
                                <Calendar size={16} className="text-slate-400" />
                                Activity Timeline
                              </button>
                              <div className="h-px bg-slate-100 my-1"></div>
                              <button 
                                onClick={() => handleOpenLead360(item.id, 'overview')}
                                className="w-full px-4 py-2.5 text-left text-sm font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 transition-colors"
                              >
                                <User size={16} />
                                Lead 360 View
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalCustomers > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
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
                of <span className="text-slate-900 font-bold">{totalCustomers}</span> customers
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
      
      <MessageModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        type={messageType}
      />

      <Lead360Modal 
        isOpen={isLead360Open}
        onClose={() => setIsLead360Open(false)}
        customerId={lead360Id}
        initialTab={lead360Tab}
      />

      <CommunicationLogModal 
        isOpen={isCommLogOpen}
        onClose={() => setIsCommLogOpen(false)}
        customer={selectedCustomer}
      />
    </div>
  );
}
