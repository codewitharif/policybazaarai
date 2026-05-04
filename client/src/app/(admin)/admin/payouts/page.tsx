'use client';

import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Building2,
  Loader2,
  Eye,
  Printer,
  X
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

interface Policy {
  name: string;
  provider: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
}

interface CustomerPolicy {
  id: number;
  Policy: Policy;
  Customer: Customer;
}

interface Payout {
  id: number;
  transaction_id: string;
  sale_amount: string | number;
  commission_amount: string | number;
  status: 'Paid' | 'Pending' | 'Processing';
  payout_date: string;
  CustomerPolicy: CustomerPolicy;
}

const PayoutDetailModal = ({ payout, isOpen, onClose, formatCurrency }: { 
  payout: Payout | null, 
  isOpen: boolean, 
  onClose: () => void,
  formatCurrency: (amount: number) => string
}) => {
  return (
    <AnimatePresence>
      {isOpen && payout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative z-10"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Transaction Details</h3>
                <p className="text-sm text-slate-500 font-medium">ID: {payout.transaction_id}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200 shadow-sm group"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</p>
                  <p className="text-sm font-bold text-slate-900">{payout.CustomerPolicy?.Customer?.name || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provider</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Building2 size={14} />
                    </div>
                    <p className="text-sm font-bold text-slate-900">{payout.CustomerPolicy?.Policy?.provider || 'Unknown'}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Policy Name</p>
                  <p className="text-sm font-bold text-slate-900">{payout.CustomerPolicy?.Policy?.name || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                  <p className="text-sm font-bold text-slate-900">
                    {payout.payout_date ? new Date(payout.payout_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-fit text-[10px] font-bold uppercase tracking-wider ${
                    payout.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                    payout.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {payout.status === 'Paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {payout.status}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sale Amount</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(Number(payout.sale_amount))}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Commission</p>
                  <p className="text-lg font-bold text-emerald-700">{formatCurrency(Number(payout.commission_amount))}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm shadow-sm"
              >
                Close
              </button>
              <button 
                className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all text-sm shadow-lg shadow-emerald-500/20 active:scale-95"
                onClick={() => {
                  alert('Statement downloaded successfully!');
                }}
              >
                Download PDF
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    pendingPayouts: 0,
    pendingCount: 0
  });

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchTerm,
        status: filterStatus,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payouts?${queryParams}`);
      const data = await response.json();
      setPayouts(data.payouts || []);
      setTotalPayouts(data.total || 0);
      
      // Calculate stats based on filters
      const statsParams = new URLSearchParams({
        limit: '1000',
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        status: filterStatus
      });
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payouts?${statsParams}`);
      const statsData = await statsResponse.json();
      const allPayouts = statsData.payouts || [];

      const totalRevenue = allPayouts.reduce((acc: number, curr: Payout) => acc + Number(curr.sale_amount), 0);
      const totalCommission = allPayouts.reduce((acc: number, curr: Payout) => acc + Number(curr.commission_amount), 0);
      const pendingPayouts = allPayouts
        .filter((p: Payout) => p.status === 'Pending')
        .reduce((acc: number, curr: Payout) => acc + Number(curr.commission_amount), 0);
      const pendingCount = allPayouts.filter((p: Payout) => p.status === 'Pending').length;

      setStats({
        totalRevenue,
        totalCommission,
        pendingPayouts,
        pendingCount
      });
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [currentPage, pageSize, searchTerm, filterStatus, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, startDate, endDate]);

  const totalPages = Math.ceil(totalPayouts / pageSize);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handlePrint = (pay: Payout) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups to print the statement');
      return;
    }

    const formattedDate = pay.payout_date ? new Date(pay.payout_date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }) : 'N/A';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payout Statement - ${pay.transaction_id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; padding: 40px; background: #fff; }
            .container { max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; border-bottom: 2px solid #10b981; margin-bottom: 30px; padding-bottom: 20px; }
            .header h1 { color: #10b981; margin: 0; font-size: 28px; letter-spacing: -0.025em; }
            .header p { color: #64748b; margin: 8px 0 0; font-weight: 500; }
            .details { margin-bottom: 30px; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
            .detail-row:last-child { border-bottom: none; }
            .label { font-weight: 500; color: #64748b; }
            .value { font-weight: 700; color: #0f172a; }
            .amount { font-size: 1.4em; color: #059669; }
            .status { padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-processing { background: #dbeafe; color: #1e40af; }
            .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
            @media print {
              body { padding: 0; background: none; }
              .container { border: none; box-shadow: none; max-width: 100%; padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payout Statement</h1>
              <p>Transaction ID: ${pay.transaction_id}</p>
            </div>
            <div class="details">
              <div class="detail-row">
                <span class="label">Customer Name</span>
                <span class="value">${pay.CustomerPolicy?.Customer?.name || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Provider</span>
                <span class="value">${pay.CustomerPolicy?.Policy?.provider || 'Unknown'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Policy Name</span>
                <span class="value">${pay.CustomerPolicy?.Policy?.name || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Transaction Date</span>
                <span class="value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Current Status</span>
                <span class="value status status-${pay.status.toLowerCase()}">${pay.status}</span>
              </div>
              <div class="detail-row" style="margin-top: 24px; border-top: 2px solid #f1f5f9; padding-top: 24px;">
                <span class="label">Sale Amount</span>
                <span class="value">${formatCurrency(Number(pay.sale_amount))}</span>
              </div>
              <div class="detail-row">
                <span class="label" style="font-size: 1.1em; color: #0f172a;">Commission Earned</span>
                <span class="value amount">${formatCurrency(Number(pay.commission_amount))}</span>
              </div>
            </div>
            <div class="footer">
              <p>Generated by PolicyBazaar Admin Portal on ${new Date().toLocaleString('en-IN')}</p>
              <p style="margin-top: 4px;">This is a computer generated document and does not require a physical signature.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
              // Fallback for browsers that don't support onafterprint
              setTimeout(function() { 
                if (!window.closed) {
                   // window.close(); 
                }
              }, 1000);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        limit: '1000',
        search: searchTerm,
        status: filterStatus,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payouts?${queryParams}`);
      const data = await response.json();
      const allFilteredPayouts = data.payouts || [];

      if (allFilteredPayouts.length === 0) {
        alert('No data to export');
        return;
      }

      const headers = ['Transaction ID', 'Customer Name', 'Customer Email', 'Provider', 'Policy Name', 'Sale Amount', 'Commission', 'Status', 'Payout Date'];
      const rows = allFilteredPayouts.map((pay: Payout) => [
        pay.transaction_id,
        pay.CustomerPolicy?.Customer?.name || 'N/A',
        pay.CustomerPolicy?.Customer?.email || 'N/A',
        pay.CustomerPolicy?.Policy?.provider || 'N/A',
        pay.CustomerPolicy?.Policy?.name || 'N/A',
        pay.sale_amount,
        pay.commission_amount,
        pay.status,
        pay.payout_date ? new Date(pay.payout_date).toLocaleDateString() : 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `payouts_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting payouts:', error);
      alert('Failed to export payouts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payouts & Revenue</h1>
          <p className="text-slate-500 mt-1">Track commissions and revenue from policy sales</p>
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
            onClick={handleExport}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            Export Statement
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+12.5%' },
          { label: 'Total Commission', value: formatCurrency(stats.totalCommission), icon: IndianRupee, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Monthly' },
          { label: 'Pending Payouts', value: formatCurrency(stats.pendingPayouts), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', trend: `${stats.pendingCount} Payments` },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                {stat.trend && i === 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <ArrowUpRight size={10} />
                    {stat.trend}
                  </span>
                )}
              </div>
            </div>
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-sm`}>
              <stat.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search customer, provider or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
            </select>
            <button className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-all">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Customer / Policy</th>
                <th className="px-6 py-4">Sale Amount</th>
                <th className="px-6 py-4">Commission</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-emerald-500" />
                      Loading payouts...
                    </div>
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No payouts found matching your search.
                  </td>
                </tr>
              ) : (
                payouts.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{pay.transaction_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{pay.CustomerPolicy?.Customer?.name || 'N/A'}</p>
                          <p className="text-[10px] text-slate-500">{pay.CustomerPolicy?.Policy?.provider} - {pay.CustomerPolicy?.Policy?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {formatCurrency(Number(pay.sale_amount))}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(Number(pay.commission_amount))}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-fit text-[10px] font-bold uppercase tracking-wider ${
                        pay.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                        pay.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {pay.status === 'Paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {pay.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {pay.payout_date ? new Date(pay.payout_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          title="View Details"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          onClick={() => {
                            setSelectedPayout(pay);
                            setIsModalOpen(true);
                          }}
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          title="Print Statement"
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          onClick={() => handlePrint(pay)}
                        >
                          <Printer size={18} />
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
        {!loading && totalPayouts > 0 && (
          <div className="px-7 py-5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 font-medium">Show</span>
              <select 
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2 shadow-sm outline-none"
              >
                {[10, 20, 50, 100].map(size => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
              <span className="text-sm text-slate-500 font-medium">
                of <span className="text-slate-900 font-bold">{totalPayouts}</span> payouts
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
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <PayoutDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        payout={selectedPayout}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
