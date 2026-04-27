// Shows a dashboard card with form details and quick actions.
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
  published: { bg: 'var(--success-soft)', text: 'var(--success)', dot: 'var(--secondary)' },
  draft: { bg: 'var(--bg-secondary)', text: 'var(--text-secondary)', dot: 'var(--text-muted)' },
  closed: { bg: 'var(--danger-soft)', text: 'var(--danger)', dot: 'var(--danger)' },
};

export default function FormCard({ form, onDelete, onDuplicate, onPublish, view = 'grid' }) {
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

  const createdDate = new Date(form.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const handleShareOpen = () => setShareOpen(true);
  const cardPadding = '18px 18px 16px';
  const isGridView = view !== 'list';

  return (
    <>
      <div className="card" style={{
        padding: 0,
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
      }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = 'var(--border-strong)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        <div style={{ height: 4, background: form.coverColor || 'var(--primary)' }} />

        <div style={{ padding: cardPadding }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: form.type === 'quiz' ? 'var(--primary)' : 'var(--text-secondary)',
                  background: form.type === 'quiz' ? 'var(--primary-light)' : 'var(--bg-secondary)',
                  padding: '4px 8px',
                  borderRadius: 999
                }}>
                  {form.type}
                </span>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: status.text,
                  background: status.bg,
                  padding: '4px 8px',
                  borderRadius: 999
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.dot }} />
                  {form.status}
                </span>
              </div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 6,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: isGridView ? 'nowrap' : 'normal'
              }}>
                {form.title}
              </h3>
              <p style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: isGridView ? 2 : 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {form.description || 'No description'}
              </p>
            </div>

            <div style={{ flexShrink: 0 }}>
              <button
                ref={btnRef}
                onClick={handleMenuOpen}
                className="btn btn-ghost btn-sm"
                style={{ padding: '6px 8px' }}
                aria-label="More actions"
              >
                <HiOutlineDotsVertical size={16} />
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isGridView ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
            gap: 12,
            padding: '12px 0 14px',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            marginBottom: 14
          }}>
            <MetaItem label="Created" value={createdDate} />
            <MetaItem label="Responses" value={String(form.totalResponses || 0)} />
            {!isGridView && <MetaItem label="Status" value={form.status} />}
            {!isGridView && <MetaItem label="Type" value={form.type} />}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => navigate(`/forms/${form._id}/edit`)} className="btn btn-secondary btn-sm">
                <HiOutlinePencil size={14} /> Edit
              </button>
              <button onClick={() => navigate(`/forms/${form._id}/responses`)} className="btn btn-ghost btn-sm">
                <HiOutlineEye size={14} /> Responses
              </button>
              <button onClick={handleShareOpen} className="btn btn-ghost btn-sm">
                <HiOutlineShare size={14} /> Share
              </button>
            </div>

            <button onClick={() => navigate(`/forms/${form._id}/analytics`)} className="btn btn-ghost btn-sm">
              <HiOutlineChartBar size={14} /> Analytics
            </button>
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
                  color: item.danger ? 'var(--danger)' : 'var(--text-primary)',
                  background: 'transparent',
                  border: 'none', cursor: 'pointer',
                  transition: 'background 0.1s',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseOver={e => e.currentTarget.style.background = item.danger ? 'var(--danger-soft)' : 'var(--bg-secondary)'}
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

function MetaItem({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}
