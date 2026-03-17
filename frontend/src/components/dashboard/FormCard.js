import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineDotsVertical, HiOutlinePencil, HiOutlineTrash,
  HiOutlineDuplicate, HiOutlineChartBar, HiOutlineEye,
  HiOutlineShare, HiOutlineGlobe
} from 'react-icons/hi';
import { ConfirmDialog } from '../ui/Common';
import ShareModal from './ShareModal';

const STATUS_COLORS = {
  published: { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
  draft: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
  closed: { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
};

export default function FormCard({ form, onDelete, onDuplicate, onPublish }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const navigate = useNavigate();
  const status = STATUS_COLORS[form.status] || STATUS_COLORS.draft;

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    if (!menuOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow < menuHeight
        ? rect.top - menuHeight + window.scrollY
        : rect.bottom + window.scrollY + 4;
      const right = window.innerWidth - rect.right;
      setMenuPos({ top, right });
    }
    setMenuOpen(p => !p);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [menuOpen]);

  const menuItems = [
    { icon: HiOutlinePencil, label: 'Edit', action: () => navigate(`/forms/${form._id}/edit`) },
    { icon: HiOutlineChartBar, label: 'Analytics', action: () => navigate(`/forms/${form._id}/analytics`) },
    { icon: HiOutlineEye, label: 'View Responses', action: () => navigate(`/forms/${form._id}/responses`) },
    { icon: HiOutlineShare, label: 'Share & QR Code', action: () => { setMenuOpen(false); setShareOpen(true); } },
    { icon: HiOutlineGlobe, label: form.status === 'published' ? 'Unpublish' : 'Publish', action: () => { setMenuOpen(false); onPublish(form._id); } },
    { icon: HiOutlineDuplicate, label: 'Duplicate', action: () => { setMenuOpen(false); onDuplicate(form._id); } },
    { icon: HiOutlineTrash, label: 'Delete', action: () => { setMenuOpen(false); setDeleteOpen(true); }, danger: true },
  ];

  return (
    <>
      <div className="card" style={{
        padding: 0, overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}
      >
        <div style={{ height: 6, background: form.coverColor || '#6366f1' }} />

        <div style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: form.type === 'quiz' ? '#6366f1' : '#10b981',
                  background: form.type === 'quiz' ? '#ede9fe' : '#d1fae5',
                  padding: '2px 8px', borderRadius: 6
                }}>
                  {form.type}
                </span>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                  color: status.text, background: status.bg, padding: '2px 8px', borderRadius: 6
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.dot }} />
                  {form.status}
                </span>
              </div>
              <h3 style={{
                fontSize: 15, fontWeight: 700, marginBottom: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {form.title}
              </h3>
              <p style={{
                fontSize: 12, color: 'var(--text-secondary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {form.description || 'No description'}
              </p>
            </div>

            {/* Menu button */}
            <div style={{ flexShrink: 0 }}>
              <button
                ref={btnRef}
                onClick={handleMenuOpen}
                className="btn btn-ghost btn-sm"
                style={{ padding: '5px 7px' }}
              >
                <HiOutlineDotsVertical size={16} />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{form.totalResponses || 0}</strong> responses
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {new Date(form.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            {form.settings?.timeLimit && (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                ⏱ {form.settings.timeLimit}m
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown rendered in portal-style using fixed positioning */}
      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
          />
          <div style={{
            position: 'fixed',
            top: menuPos.top,
            right: menuPos.right,
            zIndex: 9999,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            padding: 6,
            minWidth: 195,
            animation: 'scaleIn 0.15s ease',
          }}>
            {menuItems.map(item => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', borderRadius: 7, fontSize: 13,
                  width: '100%', textAlign: 'left',
                  color: item.danger ? '#ef4444' : 'var(--text-primary)',
                  background: 'transparent',
                  border: 'none', cursor: 'pointer',
                  transition: 'background 0.1s',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseOver={e => e.currentTarget.style.background = item.danger ? '#fee2e2' : 'var(--bg-secondary)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => { setDeleteOpen(false); onDelete(form._id); }}
        title="Delete Form"
        message={`Are you sure you want to delete "${form.title}"? This will also delete all responses. This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        form={form}
      />
    </>
  );
}