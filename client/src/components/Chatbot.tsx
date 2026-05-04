'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, ChevronRight, Sparkles, Star, CheckCircle, Paperclip, Camera, Scan, ShieldCheck, Loader2 } from 'lucide-react';
import { POLICIES, Policy } from '@/lib/mockData';
import { io, Socket } from 'socket.io-client';
import * as faceapi from 'face-api.js';

interface Message {
  id: string;
  type: 'bot' | 'user' | 'agent';
  text: string;
  options?: string[];
  policyCard?: Policy;
  showForm?: boolean;
  showAgentForm?: boolean;
  showBiometric?: boolean;
}

const CAT_COLORS: Record<string, { gradient: string; text: string }> = {
  Health: { gradient: 'linear-gradient(135deg, var(--health-start), var(--health-end))', text: 'var(--health-start)' },
  Life:   { gradient: 'linear-gradient(135deg, var(--life-start), var(--life-end))', text: 'var(--life-start)' },
  Motor:  { gradient: 'linear-gradient(135deg, var(--motor-start), var(--motor-end))', text: 'var(--motor-start)' },
  Travel: { gradient: 'linear-gradient(135deg, var(--travel-start), var(--travel-end))', text: 'var(--travel-start)' },
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: "Hi! I'm your PolicyBazaar Assistant. How can I help you today?",
      options: ['Check Policies', 'Claim Insurance', 'Track Claims', 'Track New Applications', 'Ask AI', 'Talk with Human Agent'],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [agentFormData, setAgentFormData] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentAction, setCurrentAction] = useState<'MENU' | 'TRACK_CLAIM' | 'TRACK_APPLICATION' | 'SELECT_PRODUCT' | 'SELECT_CATEGORY' | 'ASKING_QUESTIONS' | 'HUMAN_AGENT' | 'GHOST_WRITE_CLAIM' | 'SUBMIT_CLAIM_POLICY' | 'ASK_AI'>('MENU');
  const [selectedProduct, setSelectedProduct] = useState<{ id: number, name: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{ id: number, name: string } | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [createdCustomerId, setCreatedCustomerId] = useState<number | null>(null);
  const [biometricStep, setBiometricStep] = useState<'selfie' | 'id' | 'verifying' | 'success'>('selfie');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [claimNarrative, setClaimNarrative] = useState('');
  
  // Real-time chat state
  const socketRef = useRef<Socket | null>(null);
  const [agentSocketId, setAgentSocketId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (selectedFile) {
      push({ type: 'user', text: `📎 Attached file: ${selectedFile.name}` });
      
      botReply({
        type: 'bot',
        text: `File "${selectedFile.name}" attached! You can now ask me any questions about this document (like "Will I get a claim?") or click below to start a formal claim.`,
        options: ['Yes, Submit Claim', 'Main Menu']
      });
    }
  }, [selectedFile]);

  useEffect(() => {
    // Check for existing session
    const savedCustomerId = localStorage.getItem('chat_customer_id');
    const savedAgentName = localStorage.getItem('chat_agent_name');
    if (savedCustomerId) {
      setCreatedCustomerId(parseInt(savedCustomerId));
      setAgentName(savedAgentName);
      setCurrentAction('HUMAN_AGENT');
    }

    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

    if (savedCustomerId) {
      socketRef.current.emit('identify', { type: 'customer', id: parseInt(savedCustomerId) });
    }

    socketRef.current.on('request_received', (data) => {
      botReply({ type: 'bot', text: data.message });
      setIsWaitingForAgent(true);
      if (data.customer && data.customer.id) {
        setCreatedCustomerId(data.customer.id);
        localStorage.setItem('chat_customer_id', data.customer.id.toString());
      }
    });

    socketRef.current.on('agent_joined', (data) => {
      setAgentSocketId(data.agentSocketId);
      setAgentName(data.agentName);
      localStorage.setItem('chat_agent_name', data.agentName);
      setIsWaitingForAgent(false);
      setCurrentAction('HUMAN_AGENT'); // Switch to human agent mode
      botReply({ type: 'bot', text: `Agent ${data.agentName} has joined the chat. AI is now disabled for this session. How can they help you?` });
    });

    socketRef.current.on('agent_reconnected', (data) => {
      console.log('Agent reconnected', data);
      setAgentSocketId(data.agentSocketId);
    });

    socketRef.current.on('receive_message', (data) => {
      push({ type: 'agent', text: data.text });
    });

    socketRef.current.on('chat_ended', (data) => {
      botReply({ type: 'bot', text: data.message || 'The agent has ended the chat session.', options: ['Main Menu'] });
      setAgentSocketId(null);
      setAgentName(null);
      setIsWaitingForAgent(false);
      localStorage.removeItem('chat_customer_id');
      localStorage.removeItem('chat_agent_name');
    });

    socketRef.current.on('partner_disconnected', () => {
      botReply({ type: 'bot', text: 'Agent has disconnected. How else can I help you?', options: ['Main Menu'] });
      setAgentSocketId(null);
      setAgentName(null);
      localStorage.removeItem('chat_agent_name');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const push = (msg: Omit<Message, 'id'>) =>
    setMessages(prev => [...prev, { ...msg, id: crypto.randomUUID() }]);

  const botReply = (msg: Omit<Message, 'id'>, delay = 700) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      push(msg);
    }, delay);
  };

  const handleAskAI = async (query: string) => {
    setIsTyping(true);
    
    // Notify server about user's AI message
    socketRef.current?.emit('ai_message', { 
      text: query,
      customerData: {
        id: createdCustomerId,
        name: agentFormData.name || formData.name || 'Anonymous'
      }
    });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('query', query);
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/ask`, {
        body: formDataToSend,
      });
      const data = await res.json();
      
      if (res.ok) {
        // Notify server about AI's response
        socketRef.current?.emit('ai_response', { 
          text: data.response, 
          customerSocketId: socketRef.current.id 
        });

        botReply({
          type: 'bot',
          text: data.response,
          options: ['Ask Another Question', 'Main Menu']
        });
        setSelectedFile(null); // Clear file after processing
      } else {
        botReply({ type: 'bot', text: data.message || 'I am having some trouble thinking right now. Could you try asking again later?' });
      }
    } catch (error) {
      botReply({ type: 'bot', text: 'Connection lost. Please check your internet and try again.' });
    } finally {
      setIsTyping(false);
    }
  };

  const handleGhostWriteText = async (text: string) => {
    setIsTyping(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/claims/ghost-write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setClaimNarrative(data.professional_narrative);
        botReply({
          type: 'bot',
          text: `${data.professional_narrative}\n\nWould you like to proceed with this claim? You can also attach supporting documents (photos/PDFs) by clicking the paperclip icon below.`,
          options: ['Yes, Submit Claim', 'Edit Narrative', 'Main Menu']
        });
        setCurrentAction('GHOST_WRITE_CLAIM');
      } else {
        botReply({ type: 'bot', text: 'I had trouble rewriting that. Could you provide more details?' });
      }
    } catch (error) {
      botReply({ type: 'bot', text: 'Something went wrong. Please try again.' });
    } finally {
      setIsTyping(false);
    }
  };

  const handleClaimSubmit = async (policyNumber: string) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('claim_number', `CLM-${Math.floor(1000 + Math.random() * 9000)}`);
      formData.append('customer_policy_id', '1'); // Mock ID
      formData.append('amount_claimed', '0'); 
      formData.append('claim_date', new Date().toISOString().split('T')[0]);
      
      const description = claimNarrative || ('Policy: ' + policyNumber);
      
      formData.append('description', description);
      formData.append('type', 'Standard');
      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      console.log('Attempting to upload file:', selectedFile?.name);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/claims`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await res.json();

      if (res.ok) {
        botReply({
          type: 'bot',
          text: `Successfully submitted! Your claim number is ${result.claim_number}. Our team will review your narrative and attachments and contact you soon.`,
          options: ['Main Menu']
        });
        setSelectedFile(null);
      } else {
        console.error('Submission error:', result);
        botReply({ type: 'bot', text: `Error: ${result.message || 'Failed to submit claim'}` });
      }
    } catch (e) {
      console.error('Network error:', e);
      botReply({ type: 'bot', text: 'Failed to connect to the server. Please check if the backend is running and Cloudinary credentials are set.' });
    } finally {
      setIsSubmitting(false);
      setCurrentAction('MENU');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
      const data = await res.json();
      if (data && data.length > 0) {
        botReply({
          type: 'bot',
          text: 'Which insurance product are you looking for?',
          options: data.map((p: any) => p.name)
        });
        setCurrentAction('SELECT_PRODUCT');
      } else {
        botReply({
          type: 'bot',
          text: 'Which insurance product are you looking for?',
          options: ['Health Insurance', 'Life Insurance', 'Motor Insurance']
        });
        setCurrentAction('SELECT_PRODUCT');
      }
    } catch (error) {
      botReply({
        type: 'bot',
        text: 'Which insurance product are you looking for?',
        options: ['Health Insurance', 'Life Insurance', 'Motor Insurance']
      });
      setCurrentAction('SELECT_PRODUCT');
    }
  };

  const fetchCategories = async (productName: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
      const data = await res.json();
      const product = data.find((p: any) => p.name === productName);

      if (product && product.Categories && product.Categories.length > 0) {
        setSelectedProduct({ id: product.id, name: product.name });
        botReply({
          type: 'bot',
          text: `Great! Which category of ${product.name} are you interested in?`,
          options: product.Categories.map((c: any) => c.name)
        });
        setCurrentAction('SELECT_CATEGORY');
      } else {
        botReply({
          type: 'bot',
          text: `I couldn't find specific categories for ${productName}. Would you like to proceed with general registration?`,
          options: ['Yes, proceed', 'No, go back']
        });
      }
    } catch (error) {
      botReply({
        type: 'bot',
        text: 'Something went wrong. Let\'s try again.',
        options: ['Main Menu']
      });
    }
  };

  const handleTrackClaim = async (claimId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/claims?search=${claimId}`);
      const data = await res.json();
      const claim = data.claims?.find((c: any) => c.claim_number.toLowerCase() === claimId.toLowerCase());
      
      if (claim) {
        botReply({
          type: 'bot',
          text: `Found it! Here is the status of claim ${claim.claim_number}:
• Status: ${claim.status}
• Amount: ₹${Number(claim.amount_claimed).toLocaleString('en-IN')}
• Date: ${new Date(claim.claim_date).toLocaleDateString('en-IN')}

Anything else I can help you with?`,
          options: ['Check Policies', 'Ask AI', 'Track New Applications']
        });
        setCurrentAction('MENU');
      } else {
        botReply({
          type: 'bot',
          text: `Sorry, I couldn't find any claim with ID "${claimId}". Please check the ID and try again, or return to the main menu.`,
          options: ['Try Again', 'Main Menu']
        });
      }
    } catch (error) {
      botReply({
        type: 'bot',
        text: "I'm having trouble connecting to our systems right now. Please try again later.",
        options: ['Main Menu']
      });
    }
  };

  const handleTrackApplication = async (query: string) => {
    try {
      let searchQuery = query;
      if (query.toUpperCase().startsWith('#L-')) {
        const parts = query.split('-');
        searchQuery = parts[parts.length - 1];
        searchQuery = parseInt(searchQuery).toString();
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers?search=${searchQuery}`);
      const data = await res.json();
      const lead = data.customers?.[0];
      
      if (lead) {
        botReply({
          type: 'bot',
          text: `I've found your application!
• Reference: #L-00${lead.id}
• Status: ${lead.status}
• Name: ${lead.name}
• Interest: ${lead.Category?.name || 'General Inquiry'}

An agent will contact you shortly if they haven't already.`,
          options: ['Check Policies', 'Track Claims', 'Ask AI']
        });
        setCurrentAction('MENU');
      } else {
        botReply({
          type: 'bot',
          text: `I couldn't find any application for "${query}". Please ensure you've provided the correct mobile number or reference ID.`,
          options: ['Try Again', 'Main Menu']
        });
      }
    } catch (error) {
      botReply({
        type: 'bot',
        text: "System is busy. Please try again in a moment.",
        options: ['Main Menu']
      });
    }
  };

  const fetchPolicies = async (category: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/policies?category=${category}&limit=3`);
      const data = await res.json();
      
      if (data.policies && data.policies.length > 0) {
        const label = category === 'Health' ? 'top-rated health' : category === 'Life' ? 'trusted life' : 'best car';
        botReply({ type: 'bot', text: `Great choice! Here are our ${label} insurance plans:` });
        
        data.policies.forEach((p: any, i: number) => {
          const mappedPolicy: Policy = {
            id: p.id.toString(),
            name: p.name,
            provider: p.provider,
            category: category as any,
            premium: `₹${Number(p.premium_base).toLocaleString('en-IN')}/year`,
            coverage: p.coverage_amount,
            features: Array.isArray(p.features) ? p.features : [],
            description: p.description || ''
          };
          
          setTimeout(() => push({ type: 'bot', text: '', policyCard: mappedPolicy }), 800 + i * 300);
        });
      } else {
        botReply({ 
          type: 'bot', 
          text: `I couldn't find any ${category} plans at the moment. Would you like to check another category?`,
          options: ['Health Insurance', 'Life Insurance', 'Motor Insurance']
        });
      }
    } catch (error) {
      botReply({ type: 'bot', text: "I'm having trouble fetching plans. Please try again later." });
    }
  };

  const handleOption = async (option: string) => {
    push({ type: 'user', text: option });
    
    if (option === 'Check Policies') {
      await fetchProducts();
    } else if (option === 'Claim Insurance') {
      setCurrentAction('GHOST_WRITE_CLAIM');
      botReply({
        type: 'bot',
        text: "I'm sorry to hear you need to make a claim. I can help you write a professional narrative to increase your approval chances. Please describe what happened below:"
      });
    } else if (option === 'Yes, Submit Claim') {
      botReply({
        type: 'bot',
        text: "Great! Please provide your Policy Number to link this narrative and start the formal process.",
      });
      setCurrentAction('SUBMIT_CLAIM_POLICY');
    } else if (option === 'Edit Narrative') {
      botReply({
        type: 'bot',
        text: "No problem. Please provide more details or correct the previous description.",
      });
      setCurrentAction('GHOST_WRITE_CLAIM');
    } else if (currentAction === 'ASKING_QUESTIONS') {
      await handleAnswer(option);
    } else if (currentAction === 'SELECT_PRODUCT') {
      await fetchCategories(option);
    } else if (currentAction === 'SELECT_CATEGORY') {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
        const data = await res.json();
        const category = data.find((c: any) => c.name === option);
        if (category) {
          setSelectedCategory({ id: category.id, name: category.name });
        } else {
          setSelectedCategory({ id: 11, name: option });
        }
      } catch (e) {
        setSelectedCategory({ id: 11, name: option });
      }

      botReply({
        type: 'bot',
        text: `Excellent! To proceed with ${option}, please share your details and our expert will reach out with personalised quotes.`,
        showForm: true,
      });
      setCurrentAction('MENU');
    } else if (option === 'Track Claims') {
      setCurrentAction('TRACK_CLAIM');
      botReply({ 
        type: 'bot', 
        text: 'Please enter your Claim ID to track the status (e.g., CLM-9021):' 
      });
    } else if (option === 'Main Menu') {
      setCurrentAction('MENU');
      setSelectedFile(null);
      setClaimNarrative('');
      botReply({
        type: 'bot',
        text: 'How can I help you today?',
        options: ['Check Policies', 'Claim Insurance', 'Track Claims', 'Track New Applications', 'Ask AI', 'Talk with Human Agent'],
      });
    } else if (option === 'Try Again') {
       const prompt = currentAction === 'TRACK_CLAIM' 
        ? 'Please enter your Claim ID again:' 
        : 'Please enter your mobile number or reference ID again:';
       botReply({ type: 'bot', text: prompt });
    } else if (option === 'Track New Applications') {
      setCurrentAction('TRACK_APPLICATION');
      botReply({ 
        type: 'bot', 
        text: 'Please provide your application reference number or registered mobile number:' 
      });
    } else if (option === 'Ask AI' || option === 'Ask Another Question') {
      const aiGreeting = 'I am your AI Insurance Advisor. Ask me anything about eligibility, benefits, waiting periods, or exclusions for Health, Life, Motor, or Travel insurance!';
      
      setCurrentAction('ASK_AI');
      
      botReply({ 
        type: 'bot', 
        text: aiGreeting 
      });

      setTimeout(() => {
        botReply({
          type: 'bot',
          text: "I'd love to help you with your insurance questions! Please share your details first so I can provide personalized advice and keep track of our conversation.",
          showForm: true
        });
      }, 1200);
    } else if (option === 'Talk with Human Agent') {
      setCurrentAction('HUMAN_AGENT');
      botReply({
        type: 'bot',
        text: 'To connect you with an expert, please provide your name and mobile number.',
        showAgentForm: true
      });
    } else if (option.includes('Insurance') && currentAction === 'MENU') {
      const cat = option.includes('Health') ? 'Health' : option.includes('Life') ? 'Life' : 'Motor';
      fetchPolicies(cat);
    }
  };

  const handleInterested = (policy: Policy) => {
    setSelectedPolicy(policy);
    push({ type: 'user', text: `I'm interested in ${policy.name}` });
    botReply({
      type: 'bot',
      text: 'Please share your details and our expert will reach out with personalised quotes.',
      showForm: true,
    });
  };

  const handleAgentFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentFormData.name || !agentFormData.phone) return;
    
    push({ type: 'user', text: `Name: ${agentFormData.name}, Mobile: ${agentFormData.phone}` });
    socketRef.current?.emit('request_chat', { name: agentFormData.name, phone: agentFormData.phone });
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const userName = formData.name;
    const userPhone = formData.phone;
    
    try {
      const categoryId = selectedCategory ? selectedCategory.id : (selectedPolicy ? 11 : null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: formData.email,
          phone: userPhone,
          status: 'New',
          customer_type: 'Warm',
          source: 'Chatbot',
          policy_category_id: categoryId
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setCreatedCustomerId(data.id);
        localStorage.setItem('chat_customer_id', data.id.toString());
        
        if (currentAction === 'ASK_AI') {
          const isReturning = data.isNew === false;
          const welcomeMsg = isReturning 
            ? `Welcome back, ${userName}! Great to see you again. I've retrieved our conversation context. How can I help you today?`
            : `Thanks, ${userName}! I've created your account. How can I help you today?`;

          botReply({
            type: 'bot',
            text: welcomeMsg,
          });

          // Notify server about AI chat start
          socketRef.current?.emit('start_ai_chat', { 
            customerData: { id: data.id, name: userName, phone: userPhone, isNew: data.isNew } 
          });
          
          return;
        }

        botReply({
          type: 'bot',
          text: `Thanks, ${userName}! To eliminate identity theft and ensure a secure onboarding, we need to verify your identity instantly.`,
        });

        setTimeout(() => {
          botReply({
            type: 'bot',
            text: "Please take a selfie and upload a photo of your ID. Our AI will perform Face Matching and Liveness Detection.",
            showBiometric: true
          });
        }, 1500);

        return;
      } else {
        throw new Error(data.message || 'Failed to submit');
      }
    } catch (error) {
      botReply({
        type: 'bot',
        text: `Thanks ${userName}, we've received your interest. An agent will call you soon!`,
      });
    } finally {
      setIsSubmitting(false);
      setFormData({ name: '', email: '', phone: '' });
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    push({ type: 'user', text });
    setInputValue('');

    if (agentSocketId) {
      socketRef.current?.emit('send_message', { text, to: agentSocketId, fromName: agentFormData.name || 'Customer' });
    } else if (currentAction === 'TRACK_CLAIM') {
      await handleTrackClaim(text);
    } else if (currentAction === 'TRACK_APPLICATION') {
      await handleTrackApplication(text);
    } else if (currentAction === 'ASKING_QUESTIONS') {
      await handleAnswer(text);
    } else if (currentAction === 'GHOST_WRITE_CLAIM') {
      await handleGhostWriteText(text);
    } else if (currentAction === 'SUBMIT_CLAIM_POLICY') {
      await handleClaimSubmit(text);
    } else {
      // Default fallback: Use AI for any natural language input (like questions about images)
      await handleAskAI(text);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (currentQuestionIndex === -1 || !questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/question-answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: createdCustomerId,
          question_id: currentQuestion.id,
          answer_text: answer
        }),
      });
    } catch (e) {
      console.error('Failed to save answer', e);
    }

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      botReply({
        type: 'bot',
        text: questions[nextIndex].question_text,
        options: questions[nextIndex].options ? questions[nextIndex].options : undefined
      });
    } else {
      const refId = `#L-00${createdCustomerId}`;
      botReply({
        type: 'bot',
        text: `Thank you for providing those details! Your application for ${selectedCategory?.name || 'Insurance'} is complete. Your application number is ${refId}.`,
      });

      if (selectedCategory) {
        setTimeout(() => {
          fetchPolicies(selectedCategory.name.split(' ')[0]);
        }, 1000);
      }

      setTimeout(() => {
        botReply({
          type: 'bot',
          text: "An expert will contact you shortly to discuss these plans in detail. Anything else I can help with?",
          options: ['Main Menu', 'Track Claims', 'Ask AI']
        });
      }, 2500);

      setCurrentAction('MENU');
      setCurrentQuestionIndex(-1);
      setQuestions([]);
      setTimeout(() => {
        setSelectedCategory(null);
        setSelectedPolicy(null);
      }, 3000);
    }
  };

  const handleBiometricSubmit = async () => {
    if (!selfieFile || !idFile || !createdCustomerId) return;
    
    // The 'verifying' state is already set by BiometricVerification component
    
    const formData = new FormData();
    formData.append('selfie', selfieFile);
    formData.append('idCard', idFile);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers/verify-biometrics/${createdCustomerId}`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setVerificationResult(data);
        setBiometricStep('success');
        
        botReply({
          type: 'bot',
          text: `Identity Verified Successfully! AI Match score: ${data.verification_score}%`,
        });

        // Proceed to questions if applicable
        const categoryId = selectedCategory ? selectedCategory.id : (selectedPolicy ? 11 : null);
        if (categoryId) {
          const qRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/category/${categoryId}`);
          const qData = await qRes.json();
          
          if (qData && qData.length > 0) {
            setQuestions(qData);
            setCurrentQuestionIndex(0);
            setCurrentAction('ASKING_QUESTIONS');
            
            setTimeout(() => {
              botReply({
                type: 'bot',
                text: `Great! Now let's customize your ${selectedCategory?.name || 'insurance'} plan.`,
              });
              
              setTimeout(() => {
                botReply({
                  type: 'bot',
                  text: qData[0].question_text,
                  options: qData[0].options ? qData[0].options : undefined
                });
              }, 1500);
            }, 1000);
          }
        } else {
          const refId = `#L-00${createdCustomerId}`;
          botReply({
            type: 'bot',
            text: `Verification complete. Your reference ID is ${refId}. We'll call you shortly.`,
          });
        }
      } else {
        setBiometricStep('id'); // Go back to allow retry
        alert(data.message || 'Verification failed on server. Please try again.');
      }
    } catch (error) {
      setBiometricStep('id');
      alert('Upload failed. Please check your connection.');
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={styles.headerAvatar}>
            <Bot size={20} color="var(--white)" />
            <span style={styles.onlineDot} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--white)' }}>Policy Assistant</div>
            <div style={{ fontSize: 11, color: 'var(--ai-subtitle)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={10} color="var(--ai-sparkle)" /> AI-Powered
            </div>
          </div>
        </div>
      </div>

      <div style={styles.messages}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ display: 'flex', gap: 8, maxWidth: '85%', flexDirection: msg.type === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{
                ...styles.avatar,
                background: msg.type === 'user'
                  ? 'linear-gradient(135deg, var(--slate-600), var(--slate-800))'
                  : msg.type === 'agent' 
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, var(--health-start), var(--health-end))',
              }}>
                {msg.type === 'user' ? <User size={14} color="var(--white)" /> : <Bot size={14} color="var(--white)" />}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {msg.text && (
                  <div style={{
                    ...styles.bubble,
                    ...(msg.type === 'user' ? styles.userBubble : msg.type === 'agent' ? styles.agentBubble : styles.botBubble),
                  }}>
                    {msg.text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {msg.policyCard && <PolicyCard policy={msg.policyCard} onInterested={handleInterested} />}

                {Array.isArray(msg.options) && msg.options.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 2 }}>
                    {msg.options.map(opt => (
                      <button key={opt} onClick={() => handleOption(opt)} style={styles.quickBtn}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {msg.showForm && (
                  <LeadForm
                    formData={formData}
                    setFormData={setFormData}
                    isSubmitting={isSubmitting}
                    onSubmit={handleFormSubmit}
                  />
                )}

                {msg.showBiometric && (
                  <BiometricVerification
                    step={biometricStep}
                    setStep={setBiometricStep}
                    selfie={selfieFile}
                    setSelfie={setSelfieFile}
                    idPhoto={idFile}
                    setIdPhoto={setIdFile}
                    onSubmit={handleBiometricSubmit}
                  />
                )}

                {msg.showAgentForm && (
                  <div style={styles.card}>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={12} color="var(--white)" />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--slate-700)' }}>Human Agent Request</span>
                      </div>
                      <form onSubmit={handleAgentFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--slate-400)', marginBottom: 4, display: 'block' }}>Name</label>
                          <input
                            required type="text" placeholder="Your Name"
                            value={agentFormData.name}
                            onChange={e => setAgentFormData({ ...agentFormData, name: e.target.value })}
                            style={styles.formInput}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--slate-400)', marginBottom: 4, display: 'block' }}>Mobile Number</label>
                          <input
                            required type="tel" placeholder="+91 98765 43210"
                            value={agentFormData.phone}
                            onChange={e => setAgentFormData({ ...agentFormData, phone: e.target.value })}
                            style={styles.formInput}
                          />
                        </div>
                        <button type="submit" disabled={isSubmitting} style={{
                          ...styles.cardBtn,
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          opacity: isSubmitting ? 0.6 : 1,
                        }}>
                          {isSubmitting ? 'Connecting...' : 'Connect to Agent'}
                          {!isSubmitting && <ChevronRight size={14} />}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isWaitingForAgent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ ...styles.avatar, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <User size={14} color="var(--white)" />
            </div>
            <div style={{ ...styles.bubble, ...styles.agentBubble, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Connecting to Agent</span>
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ ...styles.avatar, background: 'linear-gradient(135deg, var(--health-start), var(--health-end))' }}>
              <Bot size={14} color="var(--white)" />
            </div>
            <div style={{ ...styles.bubble, ...styles.botBubble }}>
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={styles.inputBar}>
        <input
          type="text"
          placeholder={isWaitingForAgent ? "Waiting for agent to join..." : "Type a message..."}
          value={inputValue}
          disabled={isWaitingForAgent}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          style={styles.input}
        />
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={e => setSelectedFile(e.target.files?.[0] || null)}
          style={{ display: 'none' }}
        />

        <button 
          style={{
            ...styles.attachBtn,
            background: selectedFile ? 'var(--health-start)' : 'var(--slate-100)',
          }} 
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={14} color={selectedFile ? 'var(--white)' : 'var(--slate-500)'} />
        </button>
        <button onClick={handleSend} disabled={!inputValue.trim() || isWaitingForAgent} style={{
          ...styles.sendBtn,
          background: inputValue.trim() && !isWaitingForAgent ? 'linear-gradient(135deg, var(--health-start), var(--health-end))' : 'var(--slate-200)',
        }}>
          <Send size={14} color={inputValue.trim() && !isWaitingForAgent ? 'var(--white)' : 'var(--slate-400)'} />
        </button>
      </div>
    </div>
  );
}

function BiometricVerification({ 
  step, setStep, selfie, setSelfie, idPhoto, setIdPhoto, onSubmit 
}: {
  step: 'selfie' | 'id' | 'verifying' | 'success';
  setStep: (s: 'selfie' | 'id' | 'verifying' | 'success') => void;
  selfie: File | null;
  setSelfie: (f: File | null) => void;
  idPhoto: File | null;
  setIdPhoto: (f: File | null) => void;
  onSubmit: () => void;
}) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [livenessStatus, setLivenessStatus] = useState<'looking' | 'blink_detected' | 'failed'>('looking');
  const [hasBlinked, setHasBlinked] = useState(false);
  const hasBlinkedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const livenessInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setIsModelLoading(false);
      } catch (err) {
        console.error("Failed to load face-api models", err);
      }
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: step === 'selfie' ? 'user' : 'environment' } 
      });
      setStream(s);
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          if (step === 'selfie') startLivenessCheck();
        }
      }, 100);
    } catch (err) {
      alert("Camera access denied or not available.");
    }
  };

  const startLivenessCheck = () => {
    if (livenessInterval.current) clearInterval(livenessInterval.current);

    setHasBlinked(false);
    hasBlinkedRef.current = false;
    setLivenessStatus('looking');

    livenessInterval.current = setInterval(async () => {
      if (videoRef.current && !hasBlinkedRef.current) {
        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
          .withFaceLandmarks(true);

        if (detections) {
          const landmarks = detections.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          // Eye Aspect Ratio (EAR) calculation
          const getEAR = (eye: any) => {
            const h1 = Math.sqrt(Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2));
            const h2 = Math.sqrt(Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2));
            const w = Math.sqrt(Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2));
            return (h1 + h2) / (2 * w);
          };

          const leftEAR = getEAR(leftEye);
          const rightEAR = getEAR(rightEye);
          const avgEAR = (leftEAR + rightEAR) / 2;

          // Typical EAR threshold for blink is ~0.2
          if (avgEAR < 0.22) {
            hasBlinkedRef.current = true;
            setHasBlinked(true);
            setLivenessStatus('blink_detected');
            if (livenessInterval.current) clearInterval(livenessInterval.current);
          }
        }
      }
    }, 100);
  };
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (livenessInterval.current) clearInterval(livenessInterval.current);
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `${step}_${Date.now()}.jpg`, { type: 'image/jpeg' });
          if (step === 'selfie') setSelfie(file);
          else setIdPhoto(file);
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const performRealVerification = async () => {
    if (!selfie || !idPhoto) return;
    setStep('verifying');
    try {
      const selfieImg = await faceapi.bufferToImage(selfie);
      const idImg = await faceapi.bufferToImage(idPhoto);

      const selfieResult = await faceapi.detectSingleFace(selfieImg, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(true).withFaceDescriptor();
      const idResult = await faceapi.detectSingleFace(idImg, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(true).withFaceDescriptor();

      if (!selfieResult || !idResult) {
        setStep('id');
        alert("Face not found. Please ensure photos are clear and well-lit.");
        return;
      }

      const distance = faceapi.euclideanDistance(selfieResult.descriptor, idResult.descriptor);
      const confidence = Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));
      setMatchScore(confidence);

      if (confidence > 45) {
        onSubmit();
      } else {
        setStep('id');
        alert(`Match Failed (${confidence}%). Please retry with clearer photos.`);
      }
    } catch (err) {
      setStep('id');
      alert("Analysis error. Please retry.");
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  if (step === 'success') {
    return (
      <div style={styles.card}>
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <ShieldCheck size={28} color="#10b981" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#065f46', marginBottom: 4 }}>Identity Verified</div>
          <p style={{ fontSize: 11, color: '#047857' }}>AI Match: {matchScore || 98}% | Liveness: PASSED</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, var(--health-start), var(--health-end))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scan size={14} color="var(--white)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--slate-700)' }}>Biometric Check</span>
        </div>

        {step !== 'verifying' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '100%', height: 180, background: 'var(--slate-50)', borderRadius: 12, border: '2px dashed var(--slate-200)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden', position: 'relative' }}>
              {isModelLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={24} className="animate-spin text-emerald-500" />
                  <span style={{ fontSize: 10, color: 'var(--slate-400)' }}>Loading Tiny AI...</span>
                </div>
              ) : isCameraOpen ? (
                <>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {step === 'selfie' && (
                    <div style={{ position: 'absolute', top: 10, left: 10, right: 10, padding: '4px 8px', borderRadius: 8, background: hasBlinked ? 'rgba(16,185,129,0.9)' : 'rgba(245,158,11,0.9)', color: 'white', fontSize: 10, fontWeight: 700 }}>
                      {hasBlinked ? '✓ Liveness Verified' : 'Action: Please Blink your eyes'}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {(step === 'selfie' ? selfie : idPhoto) ? (
                    <img src={URL.createObjectURL((step === 'selfie' ? selfie : idPhoto)!)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      {step === 'selfie' ? <Camera size={32} color="var(--slate-300)" /> : <Scan size={32} color="var(--slate-300)" />}
                      <span style={{ fontSize: 10, color: 'var(--slate-400)', marginTop: 8 }}>
                        {step === 'selfie' ? 'Selfie Verification' : 'ID Document Capture'}
                      </span>
                    </>
                  )}
                </>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {!isModelLoading && (
              <>
                {isCameraOpen ? (
                  <button 
                    disabled={step === 'selfie' && !hasBlinked}
                    onClick={capturePhoto} 
                    style={{ 
                      ...styles.cardBtn, 
                      background: (step === 'selfie' && !hasBlinked) ? 'var(--slate-300)' : 'var(--health-start)', 
                      color: 'var(--white)', 
                      marginBottom: 8 
                    }}
                  >
                    {step === 'selfie' && !hasBlinked ? 'Waiting for Blink...' : 'Capture Photo'}
                  </button>
                ) : (
                  <button onClick={startCamera} style={{ ...styles.cardBtn, background: 'var(--slate-100)', color: 'var(--slate-600)', marginBottom: 8 }}>
                    {(step === 'selfie' ? selfie : idPhoto) ? 'Retake Photo' : 'Start Camera'}
                  </button>
                )}

                {step === 'selfie' && !isCameraOpen && (
                  <button disabled={!selfie} onClick={() => setStep('id')} style={{ ...styles.cardBtn, background: 'linear-gradient(135deg, var(--health-start), var(--health-end))', opacity: selfie ? 1 : 0.5 }}>
                    Next: ID Document <ChevronRight size={14} />
                  </button>
                )}

                {step === 'id' && !isCameraOpen && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setStep('selfie')} style={{ ...styles.cardBtn, background: 'var(--slate-50)', color: 'var(--slate-500)', flex: 1 }}>
                      Back
                    </button>
                    <button disabled={!idPhoto} onClick={performRealVerification} style={{ ...styles.cardBtn, background: 'linear-gradient(135deg, var(--health-start), var(--health-end))', flex: 2, opacity: idPhoto ? 1 : 0.5 }}>
                      Verify & Match
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Loader2 size={32} className="animate-spin" color="var(--health-start)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--slate-700)', marginBottom: 4 }}>Analyzing Biometrics</div>
            <p style={{ fontSize: 11, color: 'var(--slate-400)' }}>Tiny AI processing Face Matching...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PolicyCard({ policy, onInterested }: { policy: Policy; onInterested: (p: Policy) => void }) {
  const c = CAT_COLORS[policy.category] ?? CAT_COLORS.Health;
  return (
    <div style={styles.card}>
      <div style={{ ...styles.cardHeader, background: c.gradient }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--white)' }}>{policy.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{policy.provider}</div>
        </div>
        <Star size={16} color="var(--white)" />
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={styles.statBox}>
            <div style={{ fontSize: 9, color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Premium</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: c.text }}>{policy.premium}</div>
          </div>
          <div style={styles.statBox}>
            <div style={{ fontSize: 9, color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Coverage</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-700)' }}>{policy.coverage}</div>
          </div>
        </div>
        {policy.features.slice(0, 2).map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--slate-500)' }}>
            <CheckCircle size={12} color={c.text} /> {f}
          </div>
        ))}
        <button onClick={() => onInterested(policy)} style={{ ...styles.cardBtn, background: c.gradient }}>
          Get This Plan <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

function LeadForm({ formData, setFormData, isSubmitting, onSubmit }: {
  formData: { name: string; email: string; phone: string };
  setFormData: (d: { name: string; email: string; phone: string }) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const fields = [
    { key: 'name', label: 'Full Name', placeholder: 'Rahul Sharma', type: 'text' },
    { key: 'email', label: 'Email', placeholder: 'rahul@email.com', type: 'email' },
    { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210', type: 'tel' },
  ] as const;

  return (
    <div style={styles.card}>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, var(--health-start), var(--health-end))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={12} color="var(--white)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--slate-700)' }}>Your Details</span>
        </div>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fields.map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--slate-400)', marginBottom: 4, display: 'block' }}>{label}</label>
              <input
                required type={type} placeholder={placeholder}
                value={(formData as Record<string, string>)[key]}
                onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                style={styles.formInput}
              />
            </div>
          ))}
          <button type="submit" disabled={isSubmitting} style={{
            ...styles.cardBtn,
            background: 'linear-gradient(135deg, var(--health-start), var(--health-end))',
            opacity: isSubmitting ? 0.6 : 1,
            marginTop: 4,
          }}>
            {isSubmitting ? 'Submitting...' : 'Get Free Quotes'}
            {!isSubmitting && <Send size={12} />}
          </button>
        </form>
      </div>
    </div>
  );
}


const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: '60%',
    minWidth: 340,
    maxWidth: 900,
    height: '85vh',
    maxHeight: 680,
    borderRadius: 24,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--white)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  header: {
    flexShrink: 0,
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(135deg, var(--life-start) 0%, var(--life-end) 100%)',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    background: 'rgba(255,255,255,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    border: '1px solid rgba(255,255,255,0.25)',
  },
  onlineDot: {
    position: 'absolute' as const,
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: 'var(--online-green)',
    border: '2px solid var(--life-start)',
  },
  messages: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '18px 14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
    background: 'linear-gradient(180deg, var(--slate-50), var(--slate-100))',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    padding: '10px 14px',
    fontSize: 13,
    lineHeight: 1.55,
  },
  userBubble: {
    background: 'linear-gradient(135deg, var(--health-start), var(--health-end))',
    color: 'var(--white)',
    borderRadius: '18px 4px 18px 18px',
  },
  botBubble: {
    background: 'var(--white)',
    color: 'var(--slate-700)',
    borderRadius: '4px 18px 18px 18px',
    border: '1px solid var(--slate-100)',
  },
  agentBubble: {
    background: '#ecfdf5',
    color: '#065f46',
    borderRadius: '4px 18px 18px 18px',
    border: '1px solid #a7f3d0',
  },
  quickBtn: {
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 12,
    border: '2px solid var(--health-start)',
    background: 'var(--white)',
    color: 'var(--health-start)',
    cursor: 'pointer',
  },
  inputBar: {
    flexShrink: 0,
    padding: '10px 14px 14px',
    background: 'var(--white)',
    borderTop: '1px solid var(--slate-100)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    fontSize: 13,
    border: '2px solid var(--slate-200)',
    borderRadius: 14,
    outline: 'none',
    background: 'var(--slate-50)',
    color: 'var(--slate-700)',
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: 'none',
    background: 'var(--slate-100)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    background: 'var(--white)',
    border: '1px solid var(--slate-100)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    maxWidth: 320,
  },
  cardHeader: {
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    background: 'var(--slate-50)',
    borderRadius: 10,
    padding: '8px 10px',
  },
  cardBtn: {
    width: '100%',
    padding: '10px 0',
    border: 'none',
    borderRadius: 12,
    color: 'var(--white)',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  formInput: {
    width: '100%',
    padding: '8px 12px',
    fontSize: 13,
    border: '2px solid var(--slate-200)',
    borderRadius: 10,
    outline: 'none',
    background: 'var(--slate-50)',
    color: 'var(--slate-700)',
  },
};
