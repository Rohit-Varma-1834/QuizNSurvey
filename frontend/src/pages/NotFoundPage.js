import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24, textAlign: 'center' }}>
      <p style={{ fontSize: 80, marginBottom: 8 }}>404</p>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 360 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary btn-lg">Go Home</Link>
    </div>
  );
}
