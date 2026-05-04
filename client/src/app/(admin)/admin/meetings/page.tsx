'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  Clock, 
  Video, 
  Link as LinkIcon, 
  X, 
  Eye, 
  Edit, 
  Trash2,
  VideoOff,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface Meeting {
  id: number;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  meeting_type: 'Google Meet' | 'Zoom' | 'Other';
  meeting_link: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  participants: string;
  customer_id?: number | null;
  internal_participants?: string; // JSON string of user IDs
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
}

interface User {
  id: number;
  name: string;
  role: string;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionStatus, setConnectionStatus] = useState({ googleConnected: false, zoomConnected: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meetings/status`);
      const data = await response.json();
      setConnectionStatus(data);
    } catch (err) {
      console.error('Error fetching connection status:', err);
    }
  };

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meetings`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setMeetings(data);
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '11:00',
    meeting_type: 'Google Meet' as 'Google Meet' | 'Zoom' | 'Other',
    meeting_link: '',
    status: 'Scheduled' as 'Scheduled' | 'Completed' | 'Cancelled',
    participants: '',
    customer_id: '' as string | number,
    internal_participants: [] as number[]
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers?limit=1000`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCustomers(data);
      } else if (data && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchCustomers();
    fetchUsers();
    fetchConnectionStatus();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '11:00',
      meeting_type: 'Google Meet',
      meeting_link: '',
      status: 'Scheduled',
      participants: '',
      customer_id: '',
      internal_participants: []
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (meeting: Meeting) => {
    setModalMode('edit');
    setEditingId(meeting.id);
    let internalParts: number[] = [];
    try {
      if (meeting.internal_participants) {
        internalParts = JSON.parse(meeting.internal_participants);
      }
    } catch (e) {
      console.error("Error parsing internal_participants", e);
    }

    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      date: meeting.date,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      meeting_type: meeting.meeting_type,
      meeting_link: meeting.meeting_link || '',
      status: meeting.status,
      participants: meeting.participants || '',
      customer_id: meeting.customer_id || '',
      internal_participants: internalParts
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (meeting: Meeting) => {
    setModalMode('view');
    setEditingId(meeting.id);
    let internalParts: number[] = [];
    try {
      if (meeting.internal_participants) {
        internalParts = JSON.parse(meeting.internal_participants);
      }
    } catch (e) {
      console.error("Error parsing internal_participants", e);
    }

    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      date: meeting.date,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      meeting_type: meeting.meeting_type,
      meeting_link: meeting.meeting_link || '',
      status: meeting.status,
      participants: meeting.participants || '',
      customer_id: meeting.customer_id || '',
      internal_participants: internalParts
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meetings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meeting');
      }

      await fetchMeetings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'view') return;
    
    setSubmitting(true);
    setError('');

    try {
      const url = modalMode === 'edit' 
        ? `${process.env.NEXT_PUBLIC_API_URL}/meetings/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/meetings`;
      
      const method = modalMode === 'edit' ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        customer_id: formData.customer_id === '' ? null : Number(formData.customer_id),
        internal_participants: JSON.stringify(formData.internal_participants)
      };

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${modalMode} meeting`);
      }

      await fetchMeetings();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleInternalParticipant = (userId: number) => {
    setFormData(prev => {
      const current = [...prev.internal_participants];
      if (current.includes(userId)) {
        return { ...prev, internal_participants: current.filter(id => id !== userId) };
      } else {
        return { ...prev, internal_participants: [...current, userId] };
      }
    });
  };

  const filteredMeetings = meetings.filter(meeting => 
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    meeting.meeting_link?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meetings</h1>
          <p className="text-slate-500 mt-1">Schedule and manage your Google Meet and Zoom sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href={`${process.env.NEXT_PUBLIC_API_URL}/meetings/google/auth`}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all shadow-sm border ${
              connectionStatus.googleConnected 
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {connectionStatus.googleConnected ? (
              <>
                <CheckCircle2 size={18} className="text-blue-600" />
                Google Connected
              </>
            ) : (
              'Connect Google'
            )}
          </a>
          <a 
            href={`${process.env.NEXT_PUBLIC_API_URL}/meetings/zoom/auth`}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all shadow-sm border ${
              connectionStatus.zoomConnected 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {connectionStatus.zoomConnected ? (
              <>
                <CheckCircle2 size={18} className="text-indigo-600" />
                Zoom Connected
              </>
            ) : (
              'Connect Zoom'
            )}
          </a>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            Schedule Meeting
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Meetings', value: meetings.length.toString(), icon: Calendar, color: 'bg-blue-500' },
          { label: 'Upcoming', value: meetings.filter(m => m.status === 'Scheduled').length.toString(), icon: Clock, color: 'bg-emerald-500' },
          { label: 'Completed', value: meetings.filter(m => m.status === 'Completed').length.toString(), icon: CheckCircle2, color: 'bg-indigo-500' },
          { label: 'Cancelled', value: meetings.filter(m => m.status === 'Cancelled').length.toString(), icon: VideoOff, color: 'bg-rose-500' },
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
              placeholder="Search by title or link..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Meeting</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Participants</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    Loading meetings...
                  </td>
                </tr>
              ) : filteredMeetings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    No meetings found
                  </td>
                </tr>
              ) : (
                filteredMeetings.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{meeting.title}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">{meeting.description || 'No description'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {meeting.customer ? (
                        <div>
                          <p className="text-sm font-medium text-slate-900">{meeting.customer.name}</p>
                          <p className="text-xs text-slate-500">{meeting.customer.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No customer</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {(() => {
                          try {
                            const internalParts = meeting.internal_participants ? JSON.parse(meeting.internal_participants) : [];
                            if (internalParts.length > 0) {
                              return (
                                <div className="flex -space-x-2 overflow-hidden">
                                  {internalParts.map((uid: number) => {
                                    const user = users.find(u => u.id === uid);
                                    return user ? (
                                      <div key={uid} title={user.name} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                                        {user.name.charAt(0)}
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              );
                            }
                          } catch (e) {
                            console.error("Error parsing internal_participants in table", e);
                          }
                          return <span className="text-xs text-slate-400">None</span>;
                        })()}
                        {meeting.participants && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[100px]">{meeting.participants}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{new Date(meeting.date).toLocaleDateString()}</span>
                        <span className="text-xs text-slate-500">{meeting.start_time} - {meeting.end_time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${
                          meeting.meeting_type === 'Google Meet' ? 'bg-blue-100 text-blue-600' :
                          meeting.meeting_type === 'Zoom' ? 'bg-indigo-100 text-indigo-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          <Video size={14} />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{meeting.meeting_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        meeting.status === 'Scheduled' ? 'bg-emerald-100 text-emerald-700' :
                        meeting.status === 'Completed' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {meeting.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {meeting.meeting_link ? (
                        <a 
                          href={meeting.meeting_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm font-medium"
                        >
                          Join <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-sm italic">No link</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenViewModal(meeting)}
                          title="View Details" className="p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-all"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenEditModal(meeting)}
                          title="Edit Meeting" className="p-2 text-slate-400 hover:bg-slate-100 hover:text-amber-600 rounded-lg transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(meeting.id)}
                          title="Delete Meeting" className="p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {modalMode === 'create' ? 'Schedule New Meeting' : modalMode === 'edit' ? 'Edit Meeting' : 'Meeting Details'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting Title</label>
                  <input 
                    type="text" 
                    required
                    disabled={modalMode === 'view'}
                    placeholder="Strategy Discussion"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                  <textarea 
                    rows={3}
                    disabled={modalMode === 'view'}
                    placeholder="Meeting agenda and notes..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                    <input 
                      type="date" 
                      required
                      disabled={modalMode === 'view'}
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Time</label>
                    <input 
                      type="time" 
                      required
                      disabled={modalMode === 'view'}
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">End Time</label>
                    <input 
                      type="time" 
                      required
                      disabled={modalMode === 'view'}
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting Type</label>
                    <select 
                      disabled={modalMode === 'view'}
                      value={formData.meeting_type}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        setFormData({
                          ...formData, 
                          meeting_type: newType,
                          // Clear link if switching to a managed type so backend regenerates it
                          meeting_link: (newType === 'Google Meet' || newType === 'Zoom') ? '' : formData.meeting_link
                        });
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                    <select 
                      disabled={modalMode === 'view'}
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Customer</label>
                  <select 
                    disabled={modalMode === 'view'}
                    value={formData.customer_id}
                    onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name} ({customer.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Internal Participants (Employees/Agents)</label>
                  <div className="space-y-3">
                    {/* Selected Tags */}
                    <div className="flex flex-wrap gap-2">
                      {formData.internal_participants.length > 0 ? (
                        formData.internal_participants.map(userId => {
                          const user = users.find(u => u.id === userId);
                          if (!user) return null;
                          return (
                            <span 
                              key={user.id} 
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200"
                            >
                              {user.name}
                              {modalMode !== 'view' && (
                                <button
                                  type="button"
                                  onClick={() => toggleInternalParticipant(user.id)}
                                  className="hover:text-emerald-900 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </span>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 italic py-1">No internal participants selected</p>
                      )}
                    </div>

                    {/* Select Box */}
                    {modalMode !== 'view' && (
                      <select 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        value=""
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val && !formData.internal_participants.includes(val)) {
                            toggleInternalParticipant(val);
                          }
                          e.target.value = ""; // Reset
                        }}
                      >
                        <option value="">Add Participant...</option>
                        {users
                          .filter(user => !formData.internal_participants.includes(user.id))
                          .map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.role})
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>

                {formData.meeting_type === 'Other' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting Link (Manual)</label>
                    <input 
                      type="url" 
                      disabled={modalMode === 'view'}
                      placeholder="https://your-custom-link.com"
                      value={formData.meeting_link}
                      onChange={(e) => setFormData({...formData, meeting_link: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Participants (Emails)</label>
                  <input 
                    type="text" 
                    disabled={modalMode === 'view'}
                    placeholder="email1@example.com, email2@example.com"
                    value={formData.participants}
                    onChange={(e) => setFormData({...formData, participants: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-70"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
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
                    className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : modalMode === 'create' ? 'Schedule' : 'Update'}
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
