import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--primary-light)] overflow-y-auto">
      {/* Background orbs for visual interest */}
      <div className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-20 bg-[radial-gradient(circle,var(--orb-blue),transparent_70%)] pointer-events-none" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-20 bg-[radial-gradient(circle,var(--orb-emerald),transparent_70%)] pointer-events-none" />
      
      <div className="w-full max-w-md p-6 relative z-10">
        <div className="bg-white rounded-[var(--radius-2xl)] shadow-xl border border-[var(--border)] overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
