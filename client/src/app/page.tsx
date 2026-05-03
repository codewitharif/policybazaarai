import Chatbot from '@/components/Chatbot';

export default function Home() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--slate-50)',
    }}>
      {/* Subtle background orbs */}
      <div style={{ position: 'absolute', top: -50, right: -50, width: 400, height: 400, borderRadius: '50%', opacity: 0.2, background: 'radial-gradient(circle, var(--orb-blue), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -50, left: -50, width: 300, height: 300, borderRadius: '50%', opacity: 0.2, background: 'radial-gradient(circle, var(--orb-emerald), transparent 70%)', pointerEvents: 'none' }} />

      <Chatbot />

      {/* <p style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: 'rgba(0,0,0,0.3)' }}>
        developed by superaip
      </p> */}
    </div>
  );
}
