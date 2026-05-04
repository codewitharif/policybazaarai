'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  PieChart, 
  Activity, 
  Users, 
  MessageSquare, 
  TrendingUp,
  ArrowUpRight,
  Filter,
  Loader2,
  Calendar,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsData {
  totalConversations: number;
  resolutionRate: string | number;
  leadConversion: string | number;
  leadsByCategory: Array<{ category: string; count: number }>;
  leadsByStatus: Array<{ status: string; count: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/dashboard-stats?${queryParams}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  const categoryColors = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899'];
  const statusColors: Record<string, string> = {
    'New': '#3b82f6',
    'Contacted': '#f59e0b',
    'Qualified': '#8b5cf6',
    'Active': '#10b981',
    'Inactive': '#94a3b8',
    'Closed': '#0f172a',
    'Lost': '#ef4444'
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">Analyzing real-time data...</p>
      </div>
    );
  }

  if (!data) return null;

  const totalLeads = data.leadsByCategory.reduce((acc, curr) => acc + Number(curr.count), 0);
  const totalLeadsByStatus = data.leadsByStatus.reduce((acc, curr) => acc + Number(curr.count), 0);

  return (
    <div className="flex flex-col gap-4 sm:gap-5 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics & Insights</h2>
          <p className="text-slate-500 text-sm mt-2">Deep dive into chatbot performance and user behavior.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar size={18} className="text-slate-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none border-none focus:ring-0 p-0"
            />
            <span className="text-slate-400 text-xs font-medium px-1">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none border-none focus:ring-0 p-0"
            />
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="ml-1 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button 
            onClick={fetchAnalytics}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Filter size={18} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm group">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
              <MessageSquare size={16} />
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Conversations</p>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{data.totalConversations}</h3>
          <p className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> Live from database
          </p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm group">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
              <Activity size={16} />
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Resolution Rate</p>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{data.resolutionRate}%</h3>
          <p className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> AI & Closed handled
          </p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm group">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
              <Users size={16} />
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Conversion</p>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{data.leadConversion}%</h3>
          <p className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> Converted / Total Chats
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Leads by Category */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6">Leads by Category</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            <div className="relative w-36 h-36 shrink-0">
              <div className="w-full h-full rounded-full border-[12px] border-slate-100 relative">
                <div className="absolute inset-0 rounded-full border-[12px] border-emerald-500 border-t-transparent border-l-transparent rotate-45"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-bold text-slate-900 leading-none">{totalLeads}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Total</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-3.5 w-full">
              {data.leadsByCategory.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[i % categoryColors.length] }}></div>
                      <span className="text-slate-700 uppercase tracking-tight">{item.category || 'Uncategorized'}</span>
                    </div>
                    <span className="text-slate-900">{item.count} ({totalLeads > 0 ? Math.round((item.count/totalLeads)*100) : 0}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${totalLeads > 0 ? (item.count/totalLeads)*100 : 0}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full rounded-full" 
                      style={{ backgroundColor: categoryColors[i % categoryColors.length] }}
                    ></motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lead Status Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6">Conversion Status</h3>
          <div className="space-y-5">
            {data.leadsByStatus.map((item, i) => (
              <div key={i} className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg`} style={{ backgroundColor: `${statusColors[item.status] || '#94a3b8'}15`, color: statusColors[item.status] || '#94a3b8' }}>
                      <Activity size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.status}</p>
                      <p className="text-[9px] text-slate-500 font-medium">Customer Pipeline Stage</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{item.count}</p>
                  </div>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${totalLeadsByStatus > 0 ? (item.count/totalLeadsByStatus)*100 : 0}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full rounded-full" 
                    style={{ backgroundColor: statusColors[item.status] || '#94a3b8' }}
                  ></motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
