'use client';

import React, { useState, useRef } from 'react';
import { X, Send, Mail, MessageSquare, MessageCircle, Loader2, Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  type: 'email' | 'sms' | 'whatsapp';
}

export default function MessageModal({ isOpen, onClose, customer, type }: MessageModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachVoice, setAttachVoice] = useState(false);
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleTranscription(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communication/stt`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Transcription failed');

      const data = await response.json();
      if (data.text) {
        setMessage(prev => prev + (prev ? ' ' : '') + data.text);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      alert('Failed to transcribe audio. Please try again.');
    } finally {
      setTranscribing(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setLoading(true);
    
    try {
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : { id: 1 };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communication/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          customer_id: customer.id,
          type: type.toUpperCase(),
          subject: type === 'email' ? subject : `${type.toUpperCase()} Message`,
          content: message,
          attachVoice: type === 'email' ? attachVoice : false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setTimeout(() => {
        setLoading(false);
        onClose();
        setSubject('');
        setMessage('');
        setAttachVoice(false);
      }, 800);
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
      alert('Failed to send message. Please try again.');
    }
  };

  if (!customer) return null;

  const config = {
    email: {
      title: 'Compose Email',
      icon: Mail,
      themeColor: 'blue',
      placeholder: 'Write your email content here...',
      showSubject: true,
      buttonColor: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20',
      iconBg: 'bg-blue-50 text-blue-600',
      headerBg: 'bg-blue-50/50'
    },
    sms: {
      title: 'Send SMS',
      icon: MessageSquare,
      themeColor: 'emerald',
      placeholder: 'Write your SMS message here...',
      showSubject: false,
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
      iconBg: 'bg-emerald-50 text-emerald-600',
      headerBg: 'bg-emerald-50/50'
    },
    whatsapp: {
      title: 'Send WhatsApp',
      icon: MessageCircle,
      themeColor: 'emerald',
      placeholder: 'Write your WhatsApp message here...',
      showSubject: false,
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
      iconBg: 'bg-emerald-50 text-emerald-600',
      headerBg: 'bg-emerald-50/50'
    },
  }[type];

  const Icon = config.icon;

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
            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${config.headerBg}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${config.iconBg} rounded-2xl flex items-center justify-center shadow-sm`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{config.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    To: <span className="text-slate-900 font-semibold">{customer.name}</span>
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
            <form onSubmit={handleSend} className="p-8 space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Recipient Info</p>
                <p className="text-sm font-semibold text-slate-700">
                  {type === 'email' ? customer.email : customer.phone}
                </p>
              </div>

              {config.showSubject && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                  />
                </div>
              )}

              <div className="space-y-2 relative">
                <div className="flex items-center justify-between mb-1 ml-1">
                  <label className="text-sm font-bold text-slate-700">Message</label>
                  <div className="flex items-center gap-2">
                    {type === 'email' && (
                      <button
                        type="button"
                        onClick={() => setAttachVoice(!attachVoice)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          attachVoice 
                          ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent'
                        }`}
                      >
                        <Volume2 size={14} />
                        Attach Voice (TTS)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isRecording 
                        ? 'bg-rose-100 text-rose-600 animate-pulse border border-rose-200' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent'
                      }`}
                    >
                      {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                      {isRecording ? 'Stop' : 'Voice Pitch (STT)'}
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <textarea
                    required
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={config.placeholder}
                    className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-${config.themeColor}-500/10 focus:border-${config.themeColor}-500 transition-all resize-none font-medium placeholder:text-slate-400 shadow-sm`}
                  />
                  {transcribing && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                        <Loader2 size={16} className="animate-spin" />
                        Transcribing...
                      </div>
                    </div>
                  )}
                </div>
                
                <AnimatePresence>
                  {attachVoice && type === 'email' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="flex items-center gap-2.5 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-xs font-bold overflow-hidden"
                    >
                      <Volume2 size={14} className="shrink-0" />
                      <span>AI voice version of this text will be attached to the email</span>
                    </motion.div>
                  )}
                  {type === 'sms' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="flex items-center gap-2.5 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-xs font-bold overflow-hidden"
                    >
                      <MessageSquare size={14} className="shrink-0" />
                      <span>This message will be sent as a standard SMS</span>
                    </motion.div>
                  )}
                  {type === 'whatsapp' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="flex items-center gap-2.5 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-xs font-bold overflow-hidden"
                    >
                      <MessageCircle size={14} className="shrink-0" />
                      <span>This message will be sent via WhatsApp Business</span>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  disabled={loading || isRecording || transcribing}
                  className={`flex-[1.5] flex items-center justify-center gap-3 px-6 py-4 ${config.buttonColor} text-white rounded-2xl font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100`}
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      <span className="tracking-wide">Send {type.charAt(0).toUpperCase() + type.slice(1)}</span>
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
