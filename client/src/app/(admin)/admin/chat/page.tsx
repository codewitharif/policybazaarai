'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Send, 
  User, 
  CheckCheck,
  Paperclip,
  Smile,
  Image as ImageIcon,
  Clock,
  Zap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Shield,
  MessageSquare,
  Bot,
  Activity,
  MoreVertical,
  ChevronRight,
  UserPlus,
  XCircle
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface ChatRequest {
  socketId: string;
  id: number;
  name: string;
  phone: string;
  isNew: boolean;
}

interface Message {
  id: string | number;
  text: string;
  sender: 'user' | 'admin';
  time: string;
  date?: string;
  senderName?: string;
}

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingRequests, setPendingRequests] = useState<ChatRequest[]>([]);
  const [activeChats, setActiveChats] = useState<Record<string, { customer: ChatRequest, messages: Message[] }>>({});
  const [aiChats, setAiChats] = useState<Record<string, { customer: ChatRequest, messages: Message[] }>>({});
  const [selectedChatSocketId, setSelectedChatSocketId] = useState<string | null>(null);
  const [selectedAiChatSocketId, setSelectedAiChatSocketId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [user, setUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchChatHistory = async (phone: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communication/chats/history?phone=${phone}`);
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  };

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    let currentUser = null;
    if (userData) {
      try {
        currentUser = JSON.parse(userData);
        setUser(currentUser);
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }

    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

    if (currentUser) {
      socketRef.current.emit('identify', { type: 'agent', id: currentUser.id });
    }

    socketRef.current.emit('request_active_ai_chats');

    const loadActiveChats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communication/chats/active${currentUser ? `?agent_id=${currentUser.id}` : ''}`);
        if (res.ok) {
          const active = await res.json();
          const chatsMap: Record<string, { customer: ChatRequest, messages: Message[] }> = {};
          
          for (const chat of active) {
            const history = await fetchChatHistory(chat.Customer.phone);
            chatsMap[chat.Customer.phone] = { // Using phone as temporary key if socketId unknown
              customer: {
                socketId: '', // Will be updated on message or identity
                id: chat.Customer.id,
                name: chat.Customer.name,
                phone: chat.Customer.phone,
                isNew: chat.Customer.status === 'New'
              },
              messages: history
            };
          }
          setActiveChats(prev => ({ ...prev, ...chatsMap }));
        }
      } catch (e) {
        console.error('Error loading active chats', e);
      }
    };

    loadActiveChats();

    socketRef.current.on('new_chat_request', (data: ChatRequest) => {
      setPendingRequests(prev => {
        // Avoid duplicates
        if (prev.find(r => r.socketId === data.socketId)) return prev;
        return [...prev, data];
      });
    });

    socketRef.current.on('chat_accepted', (data: { customerSocketId: string }) => {
      setPendingRequests(prev => prev.filter(r => r.socketId !== data.customerSocketId));
    });

    socketRef.current.on('chat_joined', async (data: { customerData: ChatRequest }) => {
      const history = await fetchChatHistory(data.customerData.phone);
      
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-IN');
      const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setActiveChats(prev => ({
        ...prev,
        [data.customerData.socketId]: {
          customer: data.customerData,
          messages: [
            ...history,
            { 
              id: 'init', 
              text: `You joined the chat with ${data.customerData.name}`, 
              sender: 'admin', 
              time: currentTime,
              date: currentDate,
              senderName: user?.name || 'Admin'
            }
          ]
        }
      }));
      setSelectedChatSocketId(data.customerData.socketId);
      setActiveTab('active');
    });

    socketRef.current.on('receive_message', (data: { text: string, from: string, fromName: string, time: string, customerSocketId?: string }) => {
      setActiveChats(prev => {
        // Use customerSocketId from server if available, otherwise use 'from'
        const chatIdKey = data.customerSocketId || data.from;
        const chat = prev[chatIdKey];
        
        const newMessage: Message = { 
          id: Date.now(), 
          text: data.text, 
          sender: 'user', 
          time: data.time,
          date: new Date().toLocaleDateString('en-IN'),
          senderName: data.fromName
        };

        if (chat) {
          return {
            ...prev,
            [chatIdKey]: {
              ...chat,
              messages: [...chat.messages, newMessage]
            }
          };
        } else {
          // Fallback: search for chat by customer socket ID or phone inside the objects
          const foundKey = Object.keys(prev).find(key => 
            prev[key].customer.socketId === chatIdKey || 
            prev[key].customer.socketId === data.from ||
            prev[key].customer.phone === data.customerSocketId || // Handle case where key might be phone
            key === data.customerSocketId // Handle case where key IS phone
          );
          
          if (foundKey) {
            const updatedChat = {
              ...prev[foundKey],
              messages: [...prev[foundKey].messages, newMessage],
              customer: { ...prev[foundKey].customer, socketId: chatIdKey } // Update socketId if we found it
            };
            
            const newChats = { ...prev };
            delete newChats[foundKey];
            newChats[chatIdKey] = updatedChat;
            return newChats;
          }
        }
        return prev;
      });
    });

    socketRef.current.on('partner_disconnected', () => {
      console.log('Customer disconnected');
    });

    socketRef.current.on('customer_reconnected', (data: { oldSocketId: string, newSocketId: string, customerData: ChatRequest }) => {
      console.log('Customer reconnected', data);
      setActiveChats(prev => {
        const newChats = { ...prev };
        const chat = newChats[data.oldSocketId] || Object.values(prev).find(c => c.customer.id === data.customerData.id);
        
        if (chat) {
          if (data.oldSocketId && newChats[data.oldSocketId]) {
            delete newChats[data.oldSocketId];
          }
          newChats[data.newSocketId] = {
            ...chat,
            customer: { ...chat.customer, socketId: data.newSocketId }
          };
        }
        return newChats;
      });

      setSelectedChatSocketId(prevId => {
        if (prevId === data.oldSocketId) return data.newSocketId;
        // Also check if we have a chat with same customer ID but no socketId
        return prevId;
      });
    });

    socketRef.current.on('chat_ended', (data: { customerSocketId?: string, message: string }) => {
      if (data.customerSocketId) {
        setActiveChats(prev => {
          const newChats = { ...prev };
          delete newChats[data.customerSocketId!];
          return newChats;
        });
        setSelectedChatSocketId(prevId => prevId === data.customerSocketId ? null : prevId);
      }
    });

    socketRef.current.on('new_ai_chat', (data: ChatRequest & { messages?: any[] }) => {
      setAiChats(prev => ({
        ...prev,
        [data.socketId]: { 
          customer: data, 
          messages: data.messages ? data.messages.map((m: any, i: number) => ({
            id: `hist-${i}`,
            text: m.text,
            sender: m.sender === 'user' ? 'user' : 'admin',
            time: m.time,
            date: new Date().toLocaleDateString('en-IN'),
            senderName: m.sender === 'user' ? 'Customer' : 'AI Bot'
          })) : [] 
        }
      }));
    });

    socketRef.current.on('ai_chat_update', (data: { customerSocketId: string, message: { text: string, sender: 'user' | 'bot', time: string } }) => {
      setAiChats(prev => {
        const chat = prev[data.customerSocketId];
        if (chat) {
          return {
            ...prev,
            [data.customerSocketId]: {
              ...chat,
              messages: [...chat.messages, {
                id: Date.now(),
                text: data.message.text,
                sender: data.message.sender === 'user' ? 'user' : 'admin', // mapping bot to admin for simplicity in UI
                time: data.message.time,
                date: new Date().toLocaleDateString('en-IN'),
                senderName: data.message.sender === 'user' ? 'Customer' : 'AI Bot'
              }]
            }
          };
        }
        return prev;
      });
    });

    socketRef.current.on('ai_chat_taken_over', (data: { customerSocketId: string }) => {
      setAiChats(prev => {
        const newChats = { ...prev };
        delete newChats[data.customerSocketId];
        return newChats;
      });
      setSelectedAiChatSocketId(prevId => prevId === data.customerSocketId ? null : prevId);
    });

    socketRef.current.on('ai_chat_history', (data: { customerSocketId: string, messages: any[] }) => {
      setAiChats(prev => {
        const chat = prev[data.customerSocketId];
        if (chat) {
          return {
            ...prev,
            [data.customerSocketId]: {
              ...chat,
              messages: data.messages.map((m, i) => ({
                id: i,
                text: m.text,
                sender: m.sender === 'user' ? 'user' : 'admin',
                time: m.time,
                date: new Date().toLocaleDateString('en-IN'),
                senderName: m.sender === 'user' ? 'Customer' : 'AI Bot'
              }))
            }
          };
        }
        return prev;
      });
    });

    socketRef.current.on('active_ai_chats', (data: any[]) => {
      const chatsMap: Record<string, { customer: ChatRequest, messages: Message[] }> = {};
      data.forEach(chat => {
        chatsMap[chat.socketId] = {
          customer: {
            socketId: chat.socketId,
            id: chat.id,
            name: chat.name,
            phone: chat.phone,
            isNew: chat.isNew
          },
          messages: chat.messages.map((m: any, i: number) => ({
            id: i,
            text: m.text,
            sender: m.sender === 'user' ? 'user' : 'admin',
            time: m.time,
            date: new Date().toLocaleDateString('en-IN'),
            senderName: m.sender === 'user' ? 'Customer' : 'AI Bot'
          }))
        };
      });
      setAiChats(prev => ({ ...prev, ...chatsMap }));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedChatSocketId, activeChats]);

  const handleEndChat = () => {
    if (!selectedChatSocketId) return;
    if (window.confirm('Are you sure you want to end this chat?')) {
      socketRef.current?.emit('end_chat', { customerSocketId: selectedChatSocketId });
    }
  };

  const handleJoinChat = (request: ChatRequest) => {
    socketRef.current?.emit('join_chat', {
      customerSocketId: request.socketId,
      agentId: user?.id || 1, 
      agentName: user?.name || 'Admin' 
    });
    setPendingRequests(prev => prev.filter(r => r.socketId !== request.socketId));
  };

  const handleSend = () => {
    if (!inputValue.trim() || !selectedChatSocketId) return;
    
    const text = inputValue.trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    socketRef.current?.emit('send_message', {
      text,
      to: selectedChatSocketId,
      fromName: user?.name || 'Admin'
    });

    setActiveChats(prev => {
      const chat = prev[selectedChatSocketId];
      if (chat) {
        return {
          ...prev,
          [selectedChatSocketId]: {
            ...chat,
            messages: [...chat.messages, { 
              id: Date.now(), 
              text, 
              sender: 'admin', 
              time,
              date: new Date().toLocaleDateString('en-IN'),
              senderName: user?.name || 'Admin'
            }]
          }
        };
      }
      return prev;
    });

    setInputValue('');
  };

  const handleTakeover = (socketId: string) => {
    socketRef.current?.emit('takeover_chat', {
      customerSocketId: socketId,
      agentId: user?.id || 1,
      agentName: user?.name || 'Admin'
    });
  };

  const selectedChat = selectedChatSocketId 
    ? activeChats[selectedChatSocketId] 
    : (selectedAiChatSocketId ? aiChats[selectedAiChatSocketId] : null);

  const isViewingAi = !!selectedAiChatSocketId && !selectedChatSocketId;

  return (
    <div className="h-[calc(100vh-160px)] flex gap-6 overflow-hidden">
      
      {/* First Card: Stats & Tabs */}
      <div className="w-[320px] flex flex-col gap-6 h-full">
        {/* Quick Stats Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 grid grid-cols-3 gap-2">
          <div className="text-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[20px] font-bold text-amber-500 leading-none">{pendingRequests.length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Waiting</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[20px] font-bold text-emerald-500 leading-none">{Object.keys(activeChats).length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Active</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[20px] font-bold text-blue-500 leading-none">0</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Today</p>
          </div>
        </div>

        {/* Tabs Card */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-2 bg-slate-50/80 border-b border-slate-100 flex gap-1">
            {[
              { id: 'pending', label: 'Pending Request', icon: Clock, count: pendingRequests.length },
              { id: 'active', label: 'Active Chats', icon: MessageSquare, count: Object.keys(activeChats).length },
              {id: 'ai', label: 'Monitor AI', icon: Bot, count: Object.keys(aiChats).length },
              ].map((tab) => (

              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl transition-all relative ${
                  activeTab === tab.id 
                  ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
              >
                <tab.icon size={18} />
                <span className="text-[9px] font-bold uppercase tracking-tight text-center leading-tight">
                  {tab.label.split(' ')[0]}<br/>{tab.label.split(' ')[1]}
                </span>
                {tab.count > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'pending' && (
              <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 opacity-40">
                    <Clock size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-900">No pending requests</p>
                  </div>
                ) : (
                  pendingRequests.map(req => (
                    <div key={req.socketId} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-slate-900">{req.name}</p>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${req.isNew ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {req.isNew ? 'NEW' : 'RETURNING'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{req.phone}</p>
                      <button 
                        onClick={() => handleJoinChat(req)}
                        className="w-full py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-sm"
                      >
                        <UserPlus size={14} /> Join Chat
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'active' && (
              <div className="space-y-2">
                {Object.keys(activeChats).length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 opacity-40">
                    <MessageSquare size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-900">No active chats</p>
                  </div>
                ) : (
                  Object.values(activeChats).map(chat => (
                    <button 
                      key={chat.customer.socketId}
                      onClick={() => setSelectedChatSocketId(chat.customer.socketId)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        selectedChatSocketId === chat.customer.socketId 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                          {chat.customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-900 truncate">{chat.customer.name}</p>
                            <span className="text-[10px] text-slate-400">{chat.messages[chat.messages.length-1]?.time}</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{chat.messages[chat.messages.length-1]?.text}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
            {activeTab === 'ai' && (
              <div className="space-y-3">
                {Object.keys(aiChats).length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 opacity-40">
                    <Bot size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-900">No active AI chats</p>
                  </div>
                ) : (
                  Object.values(aiChats).map(chat => (
                    <div key={chat.customer.socketId} className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 transition-all shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-slate-900">{chat.customer.name}</p>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                          AI ACTIVE
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{chat.customer.phone}</p>
                      <button 
                        onClick={() => {
                          setSelectedAiChatSocketId(chat.customer.socketId);
                          setSelectedChatSocketId(null);
                          socketRef.current?.emit('request_ai_chat_history', { customerSocketId: chat.customer.socketId });
                        }}
                        className="w-full py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                      >
                        <Search size={14} /> View Chat
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Card: User Context */}
      <div className="w-[340px] bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {selectedChat ? (
          <>
            <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/50 relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-400 mb-4 relative">
                  <User size={40} />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{selectedChat.customer.name}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">{selectedChat.customer.isNew ? 'New Customer' : 'Returning User'}</p>
                <div className="flex gap-2 mt-4">
                  <button className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm">
                    <Phone size={18} />
                  </button>
                  <button className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                    <Mail size={18} />
                  </button>
                  <button className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <section>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Customer Details</h4>
                <div className="space-y-4">
                  {[
                    { icon: Phone, label: 'Phone', value: selectedChat.customer.phone },
                    { icon: Zap, label: 'Status', value: selectedChat.customer.isNew ? 'Lead' : 'Registered' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <item.icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">{item.label}</p>
                        <p className="text-xs font-bold text-slate-800 truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-40">
            <User size={48} className="text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-900">Select a chat to see customer info</p>
          </div>
        )}
      </div>

      {/* Third Card: Chat Window */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                  {selectedChat.customer.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Conversation with {selectedChat.customer.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    <p className="text-[10px] text-slate-500 font-medium">Real-time Session Active</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-lg">ID: #CUST-{selectedChat.customer.id}</span> */}
                <button 
                  onClick={handleEndChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[11px] font-bold transition-all border border-red-100"
                >
                  <XCircle size={14} /> End Chat
                </button>
              </div>
            </div>

            {isViewingAi && (
              <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={16} className="text-emerald-600" />
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Viewing AI Conversation</p>
                </div>
                <button 
                  onClick={() => handleTakeover(selectedAiChatSocketId!)}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-[11px] font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm"
                >
                  <UserPlus size={14} /> Join & Takeover
                </button>
              </div>
            )}

            {/* Messages List */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30"
            >
              {selectedChat.messages.map((msg, index) => {
                const showDate = index === 0 || msg.date !== selectedChat.messages[index - 1].date;
                
                // Find the agent who handled this date's conversation
                let dateAgent = null;
                if (showDate && msg.date) {
                  const dayMessages = selectedChat.messages.slice(index);
                  const firstStaffMsg = dayMessages.find(m => 
                    m.sender === 'admin' && 
                    m.date === msg.date && 
                    m.senderName && 
                    m.senderName !== 'Admin'
                  );
                  dateAgent = firstStaffMsg ? firstStaffMsg.senderName : null;
                }

                return (
                  <React.Fragment key={msg.id}>
                    {showDate && msg.date && msg.id !== 'init' && (
                      <div className="flex justify-center my-4">
                        <span className="px-4 py-1.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm border border-slate-300">
                          {msg.date} {dateAgent ? ` - Agent ${dateAgent} joined` : ''}
                        </span>
                      </div>
                    )}
                    
                    {msg.id !== 'init' && (
                      <div 
                        className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] group ${msg.sender === 'admin' ? 'order-1' : ''}`}>
                          <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                            msg.sender === 'admin' 
                            ? 'bg-emerald-500 text-white rounded-tr-none shadow-emerald-500/10' 
                            : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                          }`}>
                            {msg.text}
                          </div>
                          <div className={`flex items-center gap-1.5 mt-1.5 ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] text-slate-400 font-medium">{msg.time}</span>
                            {msg.sender === 'admin' && <CheckCheck size={12} className="text-emerald-500" />}
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Message Input */}
            <div className="p-5 bg-white border-t border-slate-100">
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-emerald-500/50 focus-within:ring-4 focus-within:ring-emerald-500/5 focus-within:bg-white transition-all">
                <div className="flex items-center gap-1 pl-1">
                  <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"><Paperclip size={20} /></button>
                  <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"><ImageIcon size={20} /></button>
                </div>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message here..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-1 text-slate-800 placeholder:text-slate-400"
                />
                <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"><Smile size={20} /></button>
                <button 
                  onClick={handleSend}
                  className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-40">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Activity size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-900">Select a chat to start messaging</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-medium">System Idle</p>
          </div>
        )}
      </div>
    </div>
  );
}
