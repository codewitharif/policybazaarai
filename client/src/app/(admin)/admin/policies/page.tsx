'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Shield, 
  Heart, 
  Car, 
  Plane, 
  CheckCircle2, 
  MoreVertical,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  id: number;
  name: string;
}

interface Policy {
  id: number;
  category_id: number;
  name: string;
  provider: string;
  premium_base: string | number;
  coverage_amount: string;
  description: string;
  features: string[] | any;
  Category?: Category;
}

export default function PoliciesPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPolicies, setTotalPolicies] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/policies?page=${currentPage}&limit=${pageSize}&search=${searchTerm}&category=${filterCategory}`);
      const data = await response.json();
      if (data && Array.isArray(data.policies)) {
        setPolicies(data.policies);
        setTotalPolicies(data.total);
      }
    } catch (err) {
      console.error('Error fetching policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [currentPage, pageSize, searchTerm, filterCategory]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/policies/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete policy');
      }

      await fetchPolicies();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getIcon = (category: string = '') => {
    const cat = category.toLowerCase();
    if (cat.includes('health') || cat.includes('medical') || cat.includes('care') || cat.includes('wellness') || cat.includes('illness') || cat.includes('floater')) return Heart;
    if (cat.includes('life') || cat.includes('term') || cat.includes('saving') || cat.includes('investment')) return Shield;
    if (cat.includes('car') || cat.includes('bike') || cat.includes('vehicle') || cat.includes('motor')) return Car;
    return Shield;
  };

  const getCategoryStyles = (category: string = '') => {
    const cat = category.toLowerCase();
    if (cat.includes('health') || cat.includes('medical') || cat.includes('care') || cat.includes('wellness') || cat.includes('illness') || cat.includes('floater')) return { color: 'text-emerald-600', bg: 'bg-emerald-500/10', badge: 'bg-emerald-50 text-emerald-600', icon: 'text-emerald-500' };
    if (cat.includes('life') || cat.includes('term') || cat.includes('saving') || cat.includes('investment') || cat.includes('pension')) return { color: 'text-blue-600', bg: 'bg-blue-500/10', badge: 'bg-blue-50 text-blue-600', icon: 'text-blue-500' };
    if (cat.includes('car') || cat.includes('bike') || cat.includes('vehicle') || cat.includes('motor')) return { color: 'text-orange-600', bg: 'bg-orange-500/10', badge: 'bg-orange-50 text-orange-600', icon: 'text-orange-500' };
    return { color: 'text-slate-600', bg: 'bg-slate-500/10', badge: 'bg-slate-50 text-slate-600', icon: 'text-slate-500' };
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory]);

  const totalPages = Math.ceil(totalPolicies / pageSize);

  return (
    <div className="flex flex-col gap-4 sm:gap-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Policies Directory</h2>
          <p className="text-slate-500 text-sm mt-2">Manage the insurance products available in the chatbot knowledge base.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all">
          <Plus size={18} />
          Add New Policy
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search policies by name or provider..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {['All', 'Health', 'Life', 'Motor'].map((cat) => (
              <button 
                key={cat}
                onClick={() => setFilterStatus(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filterCategory === cat 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 size={40} className="animate-spin mb-4 text-emerald-500" />
            <p className="font-medium">Loading policies...</p>
          </div>
        ) : policies.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
            <p className="text-slate-500 font-medium">No policies found matching your criteria.</p>
          </div>
        ) : view === 'grid' ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {policies.map((policy, i) => {
              const catName = policy.Category?.name || 'General';
              const Icon = getIcon(catName);
              const styles = getCategoryStyles(catName);
              
              // Improved feature parsing
              let features: string[] = [];
              try {
                if (Array.isArray(policy.features)) {
                  features = policy.features;
                } else if (typeof policy.features === 'string') {
                  // Try to parse if it's a JSON string
                  const parsed = JSON.parse(policy.features);
                  features = Array.isArray(parsed) ? parsed : [policy.features];
                } else if (policy.features) {
                  // Fallback for other truthy values
                  features = [String(policy.features)];
                }
              } catch (e) {
                // If JSON.parse fails, it might be a comma-separated string
                if (typeof policy.features === 'string') {
                  features = policy.features.split(',').map(f => f.trim()).filter(f => f !== '');
                }
              }
              
              return (
                <motion.div 
                  key={policy.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2 rounded-xl ${styles.bg} ${styles.color}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(policy.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className={`text-[9px] font-bold ${styles.badge} px-2 py-0.5 rounded uppercase tracking-wider`}>
                        {catName}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2 line-clamp-1">{policy.name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{policy.provider}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Premium (Base)</p>
                        <p className="text-xs font-bold text-slate-900">₹{policy.premium_base}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Coverage</p>
                        <p className="text-xs font-bold text-slate-900 truncate">{policy.coverage_amount}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Key Features</p>
                      {features.slice(0, 3).map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600">
                          <CheckCircle2 size={12} className={styles.icon} />
                          <span className="truncate">{feature}</span>
                        </div>
                      ))}
                      {features.length === 0 && <p className="text-[11px] text-slate-400 italic">No features listed</p>}
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl">
                    <button className="w-full text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-colors py-0.5 uppercase tracking-widest">
                      View Full Details
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Policy Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Provider</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Premium</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Coverage</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policies.map((policy, i) => {
                    const catName = policy.Category?.name || 'General';
                    const styles = getCategoryStyles(catName);
                    const Icon = getIcon(catName);
                    return (
                      <motion.tr 
                        key={policy.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${styles.bg} ${styles.color}`}>
                              <Icon size={18} />
                            </div>
                            <span className="text-sm font-bold text-slate-900">{policy.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold ${styles.badge} px-2 py-0.5 rounded uppercase tracking-wider`}>
                            {catName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{policy.provider}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{policy.premium_base}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{policy.coverage_amount}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(policy.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Controls */}
      {!loading && totalPolicies > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
          <div className="flex items-center gap-3 order-2 sm:order-1">
            <span className="text-sm text-slate-500 font-medium">Show</span>
            <select 
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2 shadow-sm outline-none"
            >
              {[8, 12, 20, 50].map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
            <span className="text-sm text-slate-500 font-medium">
              of <span className="text-slate-900 font-bold">{totalPolicies}</span> policies
            </span>
          </div>

          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRight className="rotate-180" size={18} />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Only show current page, 1, last page, and neighbors
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
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
                  return <span key={page} className="px-1 text-slate-400">...</span>;
                }
                return null;
              })}
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
