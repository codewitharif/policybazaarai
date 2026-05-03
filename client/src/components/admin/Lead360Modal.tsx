'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Shield, 
  MessageSquare, 
  FileText, 
  Activity,
  Loader2,
  Clock,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Scan,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Lead360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number | null;
  initialTab?: 'overview' | 'policies' | 'communications' | 'claims' | 'timeline';
}

export default function Lead360Modal({ isOpen, onClose, customerId, initialTab = 'overview' }: Lead360ModalProps) {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'communications' | 'claims' | 'timeline'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetails();
    }
  }, [isOpen, customerId]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/customers/${customerId}`);
      const data = await response.json();
      setCustomer(data);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl h-full max-h-[90vh] bg-slate-50 rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-white/20"
        >
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 size={40} className="animate-spin text-emerald-600" />
                <p className="text-slate-500 font-medium">Gathering lead intelligence...</p>
              </div>
            </div>
          ) : !customer ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-500">Customer not found.</p>
            </div>
          ) : (
            <>
              {/* Header Profile Section */}
              <div className="bg-white px-8 pt-8 pb-6 border-b border-slate-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-200 shrink-0">
                      <User size={36} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{customer.name}</h2>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          customer.customer_type === 'Hot' ? 'bg-rose-100 text-rose-700' :
                          customer.customer_type === 'Warm' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {customer.customer_type} Lead
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          customer.conversion_score >= 70 ? 'bg-emerald-100 text-emerald-700' :
                          customer.conversion_score >= 40 ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          Score: {customer.conversion_score || 0}%
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-500">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <Phone size={14} className="text-emerald-500" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <Mail size={14} className="text-emerald-500" />
                          {customer.email}
                        </div>
                        {customer.city && (
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <MapPin size={14} className="text-emerald-500" />
                            {customer.city}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98]">
                      Create Action
                    </button>
                    <button 
                      onClick={onClose}
                      className="p-3 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-8 mt-8 border-b border-slate-100">
                  {[
                    { id: 'overview', label: 'Overview', icon: Activity },
                    { id: 'policies', label: 'Policies', icon: Shield },
                    { id: 'communications', label: 'History', icon: MessageSquare },
                    { id: 'claims', label: 'Claims', icon: AlertCircle },
                    { id: 'timeline', label: 'Timeline', icon: Clock },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all relative ${
                        activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-full" 
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Quick Stats */}
                    <div className="lg:col-span-2 space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Current Status</p>
                          <div className="flex items-center justify-between">
                            <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase ${
                              customer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                              customer.status === 'New' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {customer.status}
                            </span>
                            <TrendingUp className="text-emerald-500" size={20} />
                          </div>
                        </div>
                        <div className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Conversion Score</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-2xl font-black ${
                                customer.conversion_score >= 70 ? 'text-emerald-600' :
                                customer.conversion_score >= 40 ? 'text-amber-600' :
                                'text-rose-600'
                              }`}>
                                {customer.conversion_score || 0}%
                              </span>
                              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    customer.conversion_score >= 70 ? 'bg-emerald-500' :
                                    customer.conversion_score >= 40 ? 'bg-amber-500' :
                                    'bg-rose-500'
                                  }`}
                                  style={{ width: `${customer.conversion_score || 0}%` }}
                                />
                              </div>
                            </div>
                            <Activity className="text-blue-500" size={20} />
                          </div>
                        </div>
                        <div className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Biometric Status</p>
                          <div className="flex items-center justify-between">
                            <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase ${
                              customer.verification_status === 'Verified' ? 'bg-emerald-100 text-emerald-700' :
                              customer.verification_status === 'Failed' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {customer.verification_status || 'Pending'}
                            </span>
                            {customer.verification_status === 'Verified' ? <ShieldCheck className="text-emerald-500" size={20} /> : <Scan className="text-amber-500" size={20} />}
                          </div>
                        </div>
                        <div className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Lead Priority</p>
                          <div className="flex items-center justify-between">
                            <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase ${
                              customer.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                              customer.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {customer.priority || 'Medium'}
                            </span>
                            <Shield className="text-blue-500" size={20} />
                          </div>
                        </div>
                      </div>

                      {/* Biometric Photos (If available) */}
                      {customer.customer_photo && (
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                            <h4 className="text-sm font-bold text-slate-900">Identity Verification Photos</h4>
                          </div>
                          <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selfie Capture</p>
                              <div className="aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                                <img src={customer.customer_photo} alt="Customer Selfie" className="w-full h-full object-cover" />
                              </div>
                            </div>
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Government ID</p>
                              <div className="aspect-[3/2] rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                                <img src={customer.id_photo} alt="ID Document" className="w-full h-full object-cover" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lead Bio/Details */}
                      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                          <h4 className="text-sm font-bold text-slate-900">Lead Intelligence</h4>
                        </div>
                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Source</p>
                            <p className="text-sm font-semibold text-slate-700">{customer.source || 'Website Lead'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interest Category</p>
                            <p className="text-sm font-semibold text-slate-700">{customer.Category?.name || 'Not Specified'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Joined Date</p>
                            <p className="text-sm font-semibold text-slate-700">
                              {new Date(customer.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date of Birth</p>
                            <p className="text-sm font-semibold text-slate-700">
                              {customer.dob ? new Date(customer.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Not provided'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <MapPin size={24} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Residential Address</p>
                            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                              {customer.address || 'No address information available for this lead.'}
                              {customer.city && `, ${customer.city}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Mini Timeline / Activity */}
                    <div className="space-y-8">
                      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden h-full">
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900">Recent Activity</h4>
                          <button onClick={() => setActiveTab('communications')} className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline">View All</button>
                        </div>
                        <div className="p-6 space-y-6">
                          {customer.CommunicationLogs?.slice(0, 5).map((log: any, idx: number) => (
                            <div key={log.id} className="flex gap-4 relative group">
                              {idx !== 4 && (
                                <div className="absolute left-4 top-10 bottom-[-1.5rem] w-px bg-slate-100 group-last:hidden" />
                              )}
                              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                                log.type === 'Call' ? 'bg-blue-50 text-blue-600' :
                                log.type === 'Email' ? 'bg-amber-50 text-amber-600' :
                                log.type === 'WhatsApp' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-slate-50 text-slate-600'
                              }`}>
                                {log.type === 'Call' ? <Phone size={14} /> : 
                                 log.type === 'Email' ? <Mail size={14} /> : 
                                 log.type === 'WhatsApp' ? <MessageSquare size={14} /> : 
                                 <Activity size={14} />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900">{log.subject}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {new Date(log.created_at).toLocaleDateString()} • {log.type}
                                </p>
                              </div>
                            </div>
                          ))}
                          {(!customer.CommunicationLogs || customer.CommunicationLogs.length === 0) && (
                            <div className="text-center py-8">
                              <p className="text-xs text-slate-400 font-medium italic text-balance px-4">No recent communication history found for this lead.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'policies' && (
                  <div className="space-y-6">
                    {customer.CustomerPolicies?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {customer.CustomerPolicies.map((cp: any) => (
                          <div key={cp.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all">
                            <div className="flex items-center justify-between mb-6">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Shield size={24} />
                              </div>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                cp.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {cp.status}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-1">{cp.Policy?.name}</h4>
                            <p className="text-xs text-slate-500 font-medium mb-4">Policy No: <span className="text-slate-900">#POL-{cp.id.toString().padStart(5, '0')}</span></p>
                            
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Start Date</p>
                                <p className="text-xs font-bold text-slate-700">{new Date(cp.start_date).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">End Date</p>
                                <p className="text-xs font-bold text-slate-700">{new Date(cp.end_date).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-[40px] border border-dashed border-slate-200 p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                          <Shield size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Policies Found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">This lead hasn't been enrolled in any insurance policies yet.</p>
                        <button className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all">
                          Enroll in Policy
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'communications' && (
                  <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customer.CommunicationLogs?.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    log.type === 'Call' ? 'bg-blue-50 text-blue-600' :
                                    log.type === 'Email' ? 'bg-amber-50 text-amber-600' :
                                    log.type === 'WhatsApp' ? 'bg-emerald-50 text-emerald-600' :
                                    'bg-slate-50 text-slate-600'
                                  }`}>
                                    {log.type === 'Call' ? <Phone size={14} /> : 
                                     log.type === 'Email' ? <Mail size={14} /> : 
                                     log.type === 'WhatsApp' ? <MessageSquare size={14} /> : 
                                     <Activity size={14} />}
                                  </div>
                                  <span className="text-xs font-bold text-slate-700">{log.type}</span>
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <p className="text-xs font-bold text-slate-900">{log.subject}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{log.summary || log.notes}</p>
                              </td>
                              <td className="px-8 py-4">
                                <span className="text-xs font-medium text-slate-600">{new Date(log.created_at).toLocaleDateString()}</span>
                              </td>
                              <td className="px-8 py-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  log.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-8 py-4 text-right">
                                <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                                  <ChevronRight size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'claims' && (
                  <div className="space-y-6">
                    {customer.Claims?.length > 0 ? (
                      <div className="grid grid-cols-1 gap-6">
                        {customer.Claims.map((claim: any) => (
                          <div key={claim.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-8">
                            <div className="w-16 h-16 rounded-[24px] bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                              <AlertCircle size={32} />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h4 className="text-lg font-bold text-slate-900">Claim #{claim.id.toString().padStart(6, '0')}</h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  claim.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                  claim.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                  'bg-rose-100 text-rose-700'
                                }`}>
                                  {claim.status}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-slate-600 mb-2">{claim.Policy?.name}</p>
                              <p className="text-xs text-slate-500">{claim.claim_description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Claim Amount</p>
                              <p className="text-xl font-black text-slate-900">₹{claim.claim_amount?.toLocaleString()}</p>
                              <p className="text-[10px] font-medium text-slate-500 mt-1">{new Date(claim.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-[40px] border border-dashed border-slate-200 p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                          <AlertCircle size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Claims Record</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">This lead has not filed any insurance claims at this moment.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="max-w-3xl mx-auto py-10">
                    <div className="relative">
                      {/* Vertical Line */}
                      <div className="absolute left-[23px] top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500/20 via-slate-100 to-transparent rounded-full" />
                      
                      <div className="space-y-12">
                        {(() => {
                          const timelineEvents = [
                            {
                              id: 'creation',
                              type: 'Creation',
                              date: new Date(customer.created_at),
                              title: 'Lead Created',
                              description: `Lead was registered in the system via ${customer.source || 'Direct Source'}.`,
                              icon: User,
                              color: 'bg-emerald-600 shadow-emerald-200'
                            },
                            ...(customer.CommunicationLogs || []).map((log: any) => ({
                              id: `log-${log.id}`,
                              type: 'Communication',
                              date: new Date(log.created_at),
                              title: log.subject,
                              description: log.summary || log.notes || `Interaction via ${log.type}`,
                              logType: log.type,
                              status: log.status,
                              icon: log.type === 'Call' ? Phone : log.type === 'Email' ? Mail : log.type === 'WhatsApp' ? MessageCircle : MessageSquare,
                              color: log.type === 'Call' ? 'bg-blue-500 shadow-blue-200' : 
                                     log.type === 'Email' ? 'bg-amber-500 shadow-amber-200' : 
                                     log.type === 'WhatsApp' ? 'bg-emerald-500 shadow-emerald-200' : 
                                     'bg-slate-500 shadow-slate-200'
                            })),
                            ...(customer.Claims || []).map((claim: any) => ({
                              id: `claim-${claim.id}`,
                              type: 'Claim',
                              date: new Date(claim.created_at),
                              title: 'Claim Filed',
                              description: `Claim #${claim.id.toString().padStart(6, '0')} for policy ${claim.Policy?.name} was submitted.`,
                              amount: claim.claim_amount,
                              icon: AlertCircle,
                              color: 'bg-rose-500 shadow-rose-200'
                            }))
                          ].sort((a, b) => b.date.getTime() - a.date.getTime());

                          return timelineEvents.map((event: any) => (
                            <div key={event.id} className="relative flex gap-8 group">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg z-10 text-white ${event.color}`}>
                                <event.icon size={20} />
                              </div>
                              <div className="flex-1 pt-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="text-lg font-bold text-slate-900">{event.title}</h4>
                                  <span className="text-xs font-bold text-slate-400">
                                    {event.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-slate-500 text-sm">{event.description}</p>
                                
                                {event.amount && (
                                  <p className="text-sm font-bold text-slate-900 mt-2">Amount: ₹{event.amount.toLocaleString()}</p>
                                )}
                                
                                {event.status && (
                                  <div className="mt-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      event.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {event.status}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
