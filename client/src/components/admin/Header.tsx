'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, Menu, LogOut, Settings, UserCircle, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUser = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };

    loadUser();

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    window.addEventListener('storage', loadUser);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('storage', loadUser);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <header className="h-[72px] flex-shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-10 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 sm:gap-5 flex-1">
        <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg shrink-0">
          <Menu size={20} />
        </button>
        <div className="relative max-w-lg w-full hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search leads, policies..."
            className="w-full pl-11 pr-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <button className="p-2 sm:p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl relative transition-colors shrink-0">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-9 w-px bg-slate-200 mx-1 hidden sm:block"></div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 sm:gap-4 pl-0 sm:pl-2 cursor-pointer group focus:outline-none"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-slate-900 leading-none group-hover:text-emerald-600 transition-colors">
                {user?.name || 'Super Admin'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1.5">
                {user?.role || 'Management'}
              </p>
            </div>
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-100 border flex items-center justify-center text-slate-600 overflow-hidden transition-all shrink-0 ${isProfileOpen ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-200 hover:border-emerald-500 group-hover:bg-slate-50'}`}>
              <User size={20} />
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 origin-top-right overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-100 mb-1 bg-slate-50/50">
                  <p className="text-sm font-semibold text-slate-900">{user?.name || 'Super Admin'}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || 'admin@policybazaar.ai'}</p>
                </div>
                
                <div className="px-2">
                  <Link 
                    href="/admin/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-3 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                      <UserCircle size={18} />
                    </div>
                    <span className="font-medium">My Profile</span>
                  </Link>
                  
                  <Link 
                    href="/admin/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-3 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 transition-colors">
                      <Settings size={18} />
                    </div>
                    <span className="font-medium">Account Settings</span>
                  </Link>
                </div>
                
                <div className="h-px bg-slate-100 my-2 mx-4"></div>
                
                <div className="px-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-3 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-100 transition-colors">
                      <LogOut size={18} />
                    </div>
                    <span className="font-semibold">Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
