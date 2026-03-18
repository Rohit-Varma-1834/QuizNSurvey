import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 16
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        QuiznSurvey
      </p>
    </div>
  );
}
