// Contains shared small UI pieces used across many pages.
import React from 'react';
import { HiOutlineCalendar } from 'react-icons/hi';

const isPlainText = (value) => typeof value === 'string' && /^[a-z0-9\s]+$/i.test(value.trim());

const buildMonogram = (label = '') => (
  label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'QS'
);

const renderVisual = (visual, fallbackLabel) => {
  if (React.isValidElement(visual)) return visual;
  if (isPlainText(visual)) return visual;
  return buildMonogram(fallbackLabel);
};

export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      textAlign: 'center', padding: '64px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
        fontWeight: 700,
        color: 'var(--text-secondary)',
        letterSpacing: '0.04em'
      }}>
        {renderVisual(icon, title)}
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

export function DateInput({ className = '', style, ...props }) {
  const inputRef = React.useRef(null);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.focus();
    if (typeof input.click === 'function') {
      input.click();
    }
  };

  return (
    <div className="date-input-wrapper">
      <input
        ref={inputRef}
        type="date"
        className={`form-input date-input-field ${className}`.trim()}
        style={style}
        {...props}
      />
      <button
        type="button"
        className="date-input-button"
        aria-label="Open date picker"
        onClick={openPicker}
      >
        <HiOutlineCalendar className="date-input-icon" size={18} />
      </button>
    </div>
  );
}

export function StatCard({ label, value, icon, color = 'var(--primary)', trend }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{value}</p>
          {trend !== undefined && (
            <p style={{ fontSize: 12, color: trend >= 0 ? 'var(--secondary)' : 'var(--danger)', marginTop: 4, fontWeight: 600 }}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
            </p>
          )}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}18`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', color, fontSize: 14, fontWeight: 700, letterSpacing: '0.04em'
        }}>
          {renderVisual(icon, label)}
        </div>
      </div>
    </div>
  );
}
