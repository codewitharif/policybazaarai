'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Phone, Mail, MessageSquare, MessageCircle, Users, Activity, Loader2, Save, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Customer {
  id: number;
  name: string;
}

interface CommunicationLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function CommunicationLogModal({ isOpen, onClose, customer }: CommunicationLogModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Call',
    direction: 'Outgoing',
    duration: '',
    subject: '',
    summary: '',
    status: 'Completed',
    scheduled_at: new Date().toISOString().slice(0, 16),
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setLoading(true);
    try {
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : { id: 1 };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communication/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customer_id: customer.id,
          assigned_to: user.id,
          duration: formData.duration ? parseInt(formData.duration) : null,
          scheduled_at: new Date(formData.scheduled_at).toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to create communication log');

      // Success
      setLoading(false);
      onClose();
      // Reset form
      setFormData({
        type: 'Call',
        direction: 'Outgoing',
        duration: '',
        subject: '',
        summary: '',
        status: 'Completed',
        scheduled_at: new Date().toISOString().slice(0, 16),
        notes: ''
      });
    } catch (error) {
      console.error('Error creating log:', error);
      setLoading(false);
      alert('Failed to save communication log. Please try again.');
    }
  };

  if (!customer) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
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
            className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Communication Log</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Log interaction for: <span className="text-slate-900 font-semibold">{customer.name}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm border border-transparent hover:border-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Interaction Type */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Type</label>
                  <div className="relative">
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium appearance-none"
                    >
                      <option value="Call">Call</option>
                      <option value="Email">Email</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="SMS">SMS</option>
                      <option value="Meeting">Meeting</option>
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      {formData.type === 'Call' && <Phone size={18} />}
                      {formData.type === 'Email' && <Mail size={18} />}
                      {formData.type === 'WhatsApp' && <MessageCircle size={18} />}
                      {formData.type === 'SMS' && <MessageSquare size={18} />}
                      {formData.type === 'Meeting' && <Users size={18} />}
                    </div>
                  </div>
                </div>

                {/* Direction */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Direction</label>
                  <select
                    name="direction"
                    value={formData.direction}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  >
                    <option value="Outgoing">Outgoing</option>
                    <option value="Incoming">Incoming</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Duration (min)</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="E.g. 15"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Date & Time</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      name="scheduled_at"
                      value={formData.scheduled_at}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Subject</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Summary of interaction (e.g., Initial follow-up call)"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    />
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Summary / Discussion</label>
                  <textarea
                    name="summary"
                    rows={3}
                    value={formData.summary}
                    onChange={handleChange}
                    placeholder="Key points discussed during the interaction..."
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none font-medium"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Internal Notes</label>
                  <textarea
                    name="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Private notes for team members..."
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[1.5] flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Save size={18} />
                      <span className="tracking-wide">Save Interaction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
