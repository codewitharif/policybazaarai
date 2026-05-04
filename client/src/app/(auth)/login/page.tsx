'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Login successful
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-center mb-6">
        <div className="w-12 h-12 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-lg rotate-3">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      </div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Welcome Back</h1>
        <p className="text-[var(--foreground-muted)] mt-2">Log in to your account</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] transition-all"
            placeholder="example@mail.com"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Password
            </label>
            <Link 
              href="/forgot-password" 
              className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] transition-all"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold py-3 px-4 rounded-[var(--radius-lg)] transition-all transform active:scale-[0.98] shadow-md shadow-[rgba(5,150,105,0.2)] disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-8 text-center pt-6 border-t border-[var(--border)]">
        <p className="text-[var(--foreground-muted)]">
          Don't have an account?{' '}
          <Link 
            href="/register" 
            className="text-[var(--primary)] font-semibold hover:text-[var(--primary-hover)] transition-colors"
          >
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}
