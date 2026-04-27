// Reusable modal window for dialogs and popups.
import React, { useEffect } from 'react';
import { HiX } from 'react-icons/hi';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = { sm: 420, md: 560, lg: 760, xl: 960 };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
      }} />
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--bg-card)', borderRadius: 16,
        boxShadow: 'var(--shadow-xl)', width: '100%',
        maxWidth: sizes[size], maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        animation: 'scaleIn 0.2s ease'
      }}>
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>{title}</h3>
            <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 6 }}>
              <HiX size={18} />
            </button>
          </div>
        )}
        <div style={{ overflowY: 'auto', flex: 1, padding: 24 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
