// Shows the top navigation bar across the app.
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  HiOutlineViewGrid,
  HiOutlinePlusCircle,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineMoon,
  HiOutlineSun,
  HiMenu,
  HiX
} from 'react-icons/hi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const guestNavLinks = [
    { href: '#features', label: 'Features' },
    { href: '#ai', label: 'AI' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#use-cases', label: 'Use Cases' }
  ];

  const appNavLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
    { to: '/forms/new', label: 'Create', icon: HiOutlinePlusCircle }
  ];

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(var(--bg-rgb, 248,250,252), 0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px'
      }}
    >
      <div className="navbar-shell">
        <Link to={user ? '/dashboard' : '/'} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
            Quizn<span style={{ color: 'var(--primary)' }}>Survey</span>
          </span>
        </Link>

        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {user ? (
            appNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: location.pathname === link.to ? 'var(--primary)' : 'var(--text-secondary)',
                  background: location.pathname === link.to ? 'var(--primary-light)' : 'transparent',
                  transition: 'all var(--transition)'
                }}
              >
                <link.icon size={16} />
                {link.label}
              </Link>
            ))
          ) : (
            guestNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  transition: 'all var(--transition)'
                }}
              >
                {link.label}
              </a>
            ))
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={toggleTheme} className="btn btn-ghost btn-sm" style={{ padding: '7px 10px' }}>
            {theme === 'dark' ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
          </button>

          {user ? (
            <>
              <div className="desktop-auth-actions" style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen((open) => !open)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: profileOpen ? 'var(--bg-secondary)' : 'transparent',
                    border: '1px solid var(--border)',
                    transition: 'all var(--transition)'
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: user.avatar ? `url(${user.avatar}) center/cover` : 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    {!user.avatar && user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name?.split(' ')[0]}
                  </span>
                </button>

                {profileOpen && (
                  <>
                    <div onClick={() => setProfileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 8px)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        boxShadow: 'var(--shadow-lg)',
                        padding: 8,
                        minWidth: 190,
                        zIndex: 50,
                        animation: 'scaleIn 0.15s ease'
                      }}
                    >
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setProfileOpen(false)} className="mobile-nav-link">
                        <HiOutlineUser size={15} /> Profile & Settings
                      </Link>
                      <button onClick={() => { setProfileOpen(false); handleLogout(); }} className="mobile-nav-link" style={{ color: 'var(--danger)', width: '100%' }}>
                        <HiOutlineLogout size={15} /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button onClick={() => setMenuOpen((open) => !open)} className="btn btn-ghost btn-sm mobile-nav-toggle" style={{ padding: '7px 10px' }}>
                {menuOpen ? <HiX size={18} /> : <HiMenu size={18} />}
              </button>
            </>
          ) : (
            <>
              <div className="desktop-auth-actions" style={{ display: 'flex', gap: 8 }}>
                <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Start Building</Link>
              </div>

              <button onClick={() => setMenuOpen((open) => !open)} className="btn btn-ghost btn-sm mobile-nav-toggle" style={{ padding: '7px 10px' }}>
                {menuOpen ? <HiX size={18} /> : <HiMenu size={18} />}
              </button>
            </>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-nav-panel">
          {user ? (
            <>
              {appNavLinks.map((link) => (
                <Link key={link.to} to={link.to} className="mobile-nav-link">
                  <link.icon size={16} /> {link.label}
                </Link>
              ))}
              <Link to="/profile" className="mobile-nav-link">
                <HiOutlineUser size={16} /> Profile & Settings
              </Link>
              <button onClick={handleLogout} className="mobile-nav-link" style={{ color: 'var(--danger)' }}>
                <HiOutlineLogout size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              {guestNavLinks.map((link) => (
                <a key={link.href} href={link.href} className="mobile-nav-link">
                  {link.label}
                </a>
              ))}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 6 }}>
                <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Start Building</Link>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
