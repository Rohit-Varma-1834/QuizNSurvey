import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import { ConfirmDialog } from '../components/ui/Common';
import { HiOutlineArrowLeft, HiOutlineCamera } from 'react-icons/hi';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' });
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const { data } = await api.put('/api/users/avatar', { avatar: ev.target.result });
        updateUser({ avatar: data.user.avatar });
        toast.success('Avatar updated!');
      } catch { toast.error('Failed to update avatar'); }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) { toast.error('Name is required'); return; }
    setSavingProfile(true);
    try {
      const { data } = await api.put('/api/users/profile', profile);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setSavingProfile(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.newPw !== passwords.confirm) { toast.error('New passwords do not match'); return; }
    if (passwords.newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPw(true);
    try {
      await api.put('/api/users/password', { currentPassword: passwords.current, newPassword: passwords.newPw });
      toast.success('Password updated!');
      setPasswords({ current: '', newPw: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update password'); }
    finally { setSavingPw(false); }
  };

  const handleEmailSave = async (e) => {
    e.preventDefault();
    setSavingEmail(true);
    try {
      const { data } = await api.put('/api/users/email', { email });
      updateUser({ email: data.user.email });
      toast.success('Email updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update email'); }
    finally { setSavingEmail(false); }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/api/users/account');
      await logout();
      navigate('/');
      toast.success('Account deleted');
    } catch { toast.error('Failed to delete account'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm" style={{ padding: '7px 10px' }}>
            <HiOutlineArrowLeft size={16} />
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Profile & Settings</h1>
        </div>

        {/* Avatar + Name */}
        <div className="card" style={{ padding: '24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: user?.avatar ? `url(${user.avatar}) center/cover` : 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 26, fontWeight: 800
              }}>
                {!user?.avatar && user?.name?.charAt(0).toUpperCase()}
              </div>
              <label style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--primary)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '2px solid var(--bg-card)'
              }}>
                <HiOutlineCamera size={12} />
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </label>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user?.email}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Personal Info</h3>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input form-textarea" rows={2} value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell us a bit about yourself" maxLength={200} />
              <span className="form-hint">{profile.bio.length}/200</span>
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ alignSelf: 'flex-start' }}>
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Email */}
        <div className="card" style={{ padding: '24px', marginBottom: 20 }}>
          <form onSubmit={handleEmailSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Email Address</h3>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingEmail} style={{ alignSelf: 'flex-start' }}>
              {savingEmail ? 'Updating…' : 'Update Email'}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="card" style={{ padding: '24px', marginBottom: 20 }}>
          <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Change Password</h3>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={passwords.newPw} onChange={e => setPasswords(p => ({ ...p, newPw: e.target.value }))} required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPw} style={{ alignSelf: 'flex-start' }}>
              {savingPw ? 'Updating…' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="card" style={{ padding: '24px', border: '1px solid color-mix(in srgb, var(--danger) 28%, var(--bg-secondary) 72%)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>⚠️ Danger Zone</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Permanently delete your account and all your forms and responses. This cannot be undone.
          </p>
          <button onClick={() => setDeleteOpen(true)} className="btn btn-danger btn-sm">
            Delete My Account
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="This will permanently delete your account, all your forms, and all responses. This cannot be undone. Are you absolutely sure?"
        confirmLabel="Yes, Delete Everything"
        danger
      />
    </div>
  );
}
