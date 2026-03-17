import React from 'react';

export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      textAlign: 'center', padding: '64px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'var(--bg-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32
      }}>
        {icon || '📋'}
      </div>
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
        {description && <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 360, margin: '0 auto' }}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message, confirmLabel = 'Confirm', danger = false }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', zIndex: 1, background: 'var(--bg-card)',
        borderRadius: 16, padding: 28, maxWidth: 420, width: '100%',
        boxShadow: 'var(--shadow-xl)', animation: 'scaleIn 0.2s ease'
      }}>
        <h3 style={{ fontWeight: 700, marginBottom: 10 }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function Spinner({ size = 20 }) {
  return <div className="spinner" style={{ width: size, height: size }} />;
}

export function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 80 }}>
      <Spinner size={32} />
    </div>
  );
}

export function StatCard({ label, value, icon, color = '#6366f1', trend }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{value}</p>
          {trend !== undefined && (
            <p style={{ fontSize: 12, color: trend >= 0 ? '#10b981' : '#ef4444', marginTop: 4, fontWeight: 600 }}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
            </p>
          )}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}18`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', color, fontSize: 22
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
