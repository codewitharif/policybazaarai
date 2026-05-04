'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  CheckCircle2,
  PhoneCall,
  UserPlus,
  Loader2,
  IndianRupee,
  Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardSummary {
  stats: {
    totalLeads: number;
    activePolicies: number;
    conversionRate: string;
    leadsThisMonth: number;
  };
  leadsByCategory: Array<{ category: string; count: number }>;
  recentLeads: Array<{
    id: number;
    name: string;
    status: string;
    policyName: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/dashboard-summary`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardSummary();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading dashboard insights...</p>
      </div>
    );
  }

  const stats = [
    { label: 'Total Leads', value: data.stats.totalLeads, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-500/10', trend: '+12.5%', isUp: true },
    { label: 'Active Policies', value: data.stats.activePolicies, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-500/10', trend: '+4.2%', isUp: true },
    { label: 'Conversion Rate', value: data.stats.conversionRate, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-500/10', trend: '-2.1%', isUp: false },
    { label: 'This Month', value: data.stats.leadsThisMonth, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-500/10', trend: '+18.3%', isUp: true },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 pb-16">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-2 sm:mt-3">Welcome back! Here's what's happening with your insurance portal today.</p>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
      >
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            variants={item}
            className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={16} className="sm:w-4 sm:h-4" />
              </div>
              <div className={`flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold ${stat.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.trend}
                {stat.isUp ? <ArrowUpRight size={10} className="sm:w-3 sm:h-3" /> : <ArrowDownRight size={10} className="sm:w-3 sm:h-3" />}
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 truncate">{stat.label}</p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Leads by Category Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="xl:col-span-2 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Leads by Category</h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Distribution of potential clients across policy types</p>
            </div>
            <div className="bg-emerald-50 px-3 py-1 rounded-full">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Total: {data.stats.totalLeads} Leads</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-5 sm:space-y-6">
            {data.leadsByCategory.map((cat, i) => {
              const totalLeads = data.leadsByCategory.reduce((sum, c) => sum + (c.count || 0), 0);
              const percentage = totalLeads > 0 ? ((cat.count || 0) / totalLeads) * 100 : 0;
              
              // Define vibrant gradients for each category
              const gradients = [
                'from-emerald-400 to-emerald-600',
                'from-blue-400 to-blue-600',
                'from-purple-400 to-purple-600',
                'from-orange-400 to-orange-600',
                'from-rose-400 to-rose-600',
                'from-amber-400 to-amber-600',
                'from-cyan-400 to-cyan-600',
                'from-indigo-400 to-indigo-600'
              ];
              const gradientClass = gradients[i % gradients.length];
              
              return (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${gradientClass}`} />
                      <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                        {cat.category || 'General Inquiry'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400">{cat.count} Leads</span>
                      <span className="text-xs font-black text-slate-900">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="relative h-2.5 sm:h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.1 }}
                      className={`absolute top-0 left-0 h-full bg-gradient-to-r ${gradientClass} rounded-full shadow-sm`}
                    >
                      {/* Glossy overlay effect */}
                      <div className="absolute inset-0 bg-white/20 w-full h-1/2 rounded-full" />
                    </motion.div>
                  </div>
                </div>
              );
            })}

            {data.leadsByCategory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="p-4 bg-slate-50 rounded-full">
                  <Users className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">No Category Data Available</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Avg per Cat</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{(data.stats.totalLeads / (data.leadsByCategory.length || 1)).toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Top Category</p>
              <p className="text-sm font-bold text-emerald-600 mt-1 truncate px-2">
                {data.leadsByCategory.length > 0 ? 
                  data.leadsByCategory.sort((a,b) => b.count - a.count)[0].category : 'N/A'
                }
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Categories</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{data.leadsByCategory.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Lead Health</p>
              <p className="text-sm font-bold text-blue-600 mt-1">Optimal</p>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h3 className="text-base font-bold text-slate-900">Recent Leads</h3>
            <button className="text-emerald-500 hover:text-emerald-600 font-bold text-[10px] uppercase tracking-wider">View All</button>
          </div>
          <div className="space-y-2.5 sm:space-y-3">
            {data.recentLeads.map((lead, i) => (
              <div key={lead.id} className="flex items-center gap-3 relative p-1.5 rounded-lg hover:bg-slate-50 transition-colors min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  lead.status === 'New' ? 'bg-blue-50 text-blue-500' :
                  lead.status === 'Contacted' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                }`}>
                  {lead.status === 'New' ? <UserPlus size={14} /> :
                   lead.status === 'Contacted' ? <PhoneCall size={14} /> : <CheckCircle2 size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">{lead.name}</h4>
                  <p className="text-[9px] text-slate-500 truncate">{lead.policyName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                    {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
            {data.recentLeads.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">No recent leads found.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
