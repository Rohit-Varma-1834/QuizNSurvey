// Shows the top navigation bar across the app.
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  HiOutlineViewGrid, HiOutlinePlusCircle, HiOutlineUser,
  HiOutlineLogout, HiOutlineMoon, HiOutlineSun, HiMenu, HiX
} from 'react-icons/hi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const navLinks = user ? [
    { to: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
    { to: '/forms/new', label: 'Create', icon: HiOutlinePlusCircle },
  ] : [
    { to: '/#features', label: 'Features', scroll: true },
    { to: '/#how-it-works', label: 'How it works', scroll: true },
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(var(--bg-rgb, 250,250,250), 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to={user ? '/dashboard' : '/'} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
            Quizn<span style={{ color: 'var(--primary)' }}>Survey</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              fontSize: 14, fontWeight: 500,
              color: location.pathname === link.to ? 'var(--primary)' : 'var(--text-secondary)',
              background: location.pathname === link.to ? 'var(--primary-light)' : 'transparent',
              transition: 'all 0.15s'
            }}>
              {link.icon && <link.icon size={16} />}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Theme toggle */}
          <button onClick={toggleTheme} className="btn btn-ghost btn-sm" style={{ padding: '7px 10px' }}>
            {theme === 'dark' ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
          </button>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setProfileOpen(p => !p)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 8,
                background: profileOpen ? 'var(--bg-secondary)' : 'transparent',
                border: '1px solid var(--border)',
                transition: 'all 0.15s'
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: user.avatar ? `url(${user.avatar}) center/cover` : 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0
                }}>
                  {!user.avatar && user.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name?.split(' ')[0]}
                </span>
              </button>

              {profileOpen && (
                <>
                  <div onClick={() => setProfileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 12, boxShadow: 'var(--shadow-lg)',
                    padding: 8, minWidth: 180, zIndex: 50,
                    animation: 'scaleIn 0.15s ease'
                  }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setProfileOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                      borderRadius: 8, fontSize: 14, color: 'var(--text-primary)',
                      transition: 'background 0.15s'
                    }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                       onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <HiOutlineUser size={15} /> Profile & Settings
                    </Link>
                    <button onClick={() => { setProfileOpen(false); handleLogout(); }} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                      borderRadius: 8, fontSize: 14, color: 'var(--danger)', width: '100%',
                      transition: 'background 0.15s'
                    }} onMouseOver={e => e.currentTarget.style.background = 'var(--danger-soft)'}
                       onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <HiOutlineLogout size={15} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
