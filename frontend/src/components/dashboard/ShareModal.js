import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '../ui/Modal';
import { HiOutlineClipboardCopy, HiOutlineDownload, HiCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function ShareModal({ isOpen, onClose, form }) {
  const [copied, setCopied] = useState(false);

  const publicUrl = `${window.location.origin}/f/${form.publicId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('QR code downloaded!');
  };

  if (!form) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Form" size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Status check */}
        {form.status !== 'published' && (
          <div style={{
            background: 'var(--warning-soft)', border: '1px solid color-mix(in srgb, var(--primary) 28%, var(--bg-secondary) 72%)',
            borderRadius: 10, padding: '12px 16px',
            fontSize: 13, color: 'var(--primary-dark)'
          }}>
            ⚠️ This form is not published yet. Publish it first so respondents can access it.
          </div>
        )}

        {/* QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            padding: 20, background: 'var(--bg-elevated)', borderRadius: 16,
            border: '2px solid var(--border)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <QRCodeSVG
              id="qr-svg"
              value={publicUrl}
              size={180}
              fgColor="#2b2d42"
              bgColor="#ffffff"
              level="H"
              includeMargin={false}
            />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Scan this QR code to open the form on any device
          </p>
        </div>

        {/* Link */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Shareable Link
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={publicUrl}
              readOnly
              className="form-input"
              style={{ fontSize: 13, flex: 1, background: 'var(--bg-secondary)' }}
            />
            <button onClick={handleCopy} className={`btn ${copied ? 'btn-secondary' : 'btn-primary'} btn-sm`} style={{ flexShrink: 0 }}>
              {copied ? <HiCheck size={16} /> : <HiOutlineClipboardCopy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleDownloadQR} className="btn btn-secondary" style={{ flex: 1 }}>
            <HiOutlineDownload size={16} /> Download QR
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Preview Form
          </a>
        </div>

        {/* Form stats */}
        <div style={{
          background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 16px',
          display: 'flex', justifyContent: 'space-around'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 800, fontSize: 20 }}>{form.totalResponses || 0}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Responses</p>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 800, fontSize: 20 }}>{form.questions?.length || 0}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Questions</p>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 800, fontSize: 20, textTransform: 'capitalize', color: form.status === 'published' ? 'var(--secondary)' : 'var(--text-secondary)' }}>
              {form.status}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
