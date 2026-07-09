'use client';

import { useState, useEffect, useRef } from 'react';
import { apiRequest, getStoredUser } from '../lib/api';
import {
  Users, UserPlus, Edit3, Trash2, Key, Shield, ChevronDown,
  ChevronRight, CheckCircle, XCircle, Eye, EyeOff, Save, User,
  Phone, Mail, Building, Briefcase, Star, Lock, AlertCircle,
  Crown, Settings, BarChart2, Code2, DollarSign, Handshake,
  ClipboardList, Camera, Upload, UserCheck,
} from 'lucide-react';

// ─── Role metadata ────────────────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  FOUNDER:         { label: 'Founder',          color: 'text-yellow-400',  bg: 'bg-yellow-500/15 border-yellow-500/30',  Icon: Crown },
  CO_FOUNDER:      { label: 'Co-Founder',        color: 'text-orange-400',  bg: 'bg-orange-500/15 border-orange-500/30',  Icon: Star },
  ADMIN:           { label: 'Administrator',     color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/30',        Icon: Settings },
  HR_MANAGER:      { label: 'HR Manager',        color: 'text-pink-400',    bg: 'bg-pink-500/15 border-pink-500/30',      Icon: Users },
  SALES_MANAGER:   { label: 'Sales Manager',     color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/30',      Icon: BarChart2 },
  SALES_EXECUTIVE: { label: 'Sales Executive',   color: 'text-cyan-400',    bg: 'bg-cyan-500/15 border-cyan-500/30',      Icon: Briefcase },
  PROJECT_MANAGER: { label: 'Project Manager',   color: 'text-indigo-400',  bg: 'bg-indigo-500/15 border-indigo-500/30',  Icon: ClipboardList },
  DEVELOPER:       { label: 'Developer',         color: 'text-violet-400',  bg: 'bg-violet-500/15 border-violet-500/30',  Icon: Code2 },
  FINANCE_MANAGER: { label: 'Finance Manager',   color: 'text-green-400',   bg: 'bg-green-500/15 border-green-500/30',    Icon: DollarSign },
  CLIENT:          { label: 'Client',            color: 'text-slate-400',   bg: 'bg-slate-500/15 border-slate-500/30',    Icon: Handshake },
};

const ALL_ROLES = Object.keys(ROLE_META);

const PERMISSION_LABELS: Record<string, string> = {
  crm: 'CRM & Leads', finance: 'Finance & Invoices', hrms: 'HR & People',
  projects: 'Projects & Tasks', monitoring: 'Site Monitoring', ai: 'AI Assistant',
};

// ─── Avatar component ─────────────────────────────────────────────────────
function Avatar({ user, size = 'md' }: { user: any; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-7 h-7 text-xs';
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  const colors = ['from-blue-500 to-violet-600', 'from-orange-500 to-red-500', 'from-green-500 to-teal-500',
    'from-pink-500 to-rose-500', 'from-yellow-500 to-orange-500', 'from-indigo-500 to-blue-500'];
  const color = colors[(user.employeeNumber || 1) % colors.length];
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold shrink-0 shadow overflow-hidden`}>
      {user.avatarUrl
        ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt={initials} />
        : initials}
    </div>
  );
}

// ─── Avatar Upload Button ─────────────────────────────────────────────────
function AvatarUpload({ user, onUploaded, size = 'lg' }: { user: any; onUploaded: (url: string) => void; size?: 'sm' | 'md' | 'lg' }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10 MB.'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await apiRequest(`/hrms/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ avatarUrl: base64 }),
        });
        onUploaded(base64);
      } catch (err: any) {
        alert(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const sz = size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-10 h-10' : 'w-7 h-7';

  return (
    <div className="relative group shrink-0">
      <Avatar user={user} size={size} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className={`absolute inset-0 ${sz} rounded-xl flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`}
        title="Upload photo"
      >
        {uploading
          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <Camera className="w-4 h-4 text-white" />}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─── Self Avatar Upload (for profile settings) ────────────────────────────
function SelfAvatarUpload({ currentUser, onUploaded }: { currentUser: any; onUploaded: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10 MB.'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await apiRequest('/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify({ avatarUrl: base64 }),
        });
        onUploaded(base64);
      } catch (err: any) {
        alert(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative group shrink-0">
      <Avatar user={currentUser} size="lg" />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 w-16 h-16 rounded-xl flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        title="Upload your photo"
      >
        {uploading
          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <Camera className="w-4 h-4 text-white" />}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const m = ROLE_META[role] || { label: role, color: 'text-muted-foreground', bg: 'bg-secondary', Icon: User };
  const Icon = m.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${m.bg} ${m.color}`}>
      <Icon className="w-2.5 h-2.5" /> {m.label}
    </span>
  );
}

// ─── User ID badge ────────────────────────────────────────────────────────
function UserIdBadge({ userId }: { userId: string }) {
  const isClient = userId?.startsWith('CLNT');
  return (
    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${isClient ? 'text-teal-400 bg-teal-500/10 border-teal-500/20' : 'text-violet-400 bg-violet-500/10 border-violet-500/20'}`}>
      {userId}
    </span>
  );
}

// ─── Create/Edit user modal ───────────────────────────────────────────────
function UserFormModal({ initial, onSave, onClose, isFounder, canManage }: any) {
  const editing = !!initial?.id;
  const [form, setForm] = useState({
    firstName: initial?.firstName || '',
    lastName: initial?.lastName || '',
    email: initial?.email || '',
    password: '',
    role: initial?.role || 'DEVELOPER',
    phone: initial?.phone || '',
    bio: initial?.bio || '',
    department: initial?.department || '',
  });
  const [avatarUser, setAvatarUser] = useState(initial || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const body = editing
        ? { firstName: form.firstName, lastName: form.lastName, role: form.role, phone: form.phone, bio: form.bio, department: form.department }
        : { ...form };
      const endpoint = editing ? `/hrms/users/${initial.id}` : '/hrms/users';
      const method = editing ? 'PATCH' : 'POST';
      const result = await apiRequest(endpoint, { method, body: JSON.stringify(body) });
      onSave(result);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            {editing ? 'Edit Team Member' : 'Add New Team Member'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><XCircle className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}

          {/* Avatar upload when editing */}
          {editing && avatarUser && canManage && (
            <div className="flex items-center gap-4 p-3 rounded-xl border border-border bg-secondary/20">
              <AvatarUpload
                user={avatarUser}
                onUploaded={(url) => setAvatarUser((u: any) => ({ ...u, avatarUrl: url }))}
              />
              <div>
                <p className="text-sm font-semibold">{avatarUser.firstName} {avatarUser.lastName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Camera className="w-3 h-3" /> Hover avatar to upload a photo
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {['firstName', 'lastName'].map(f => (
              <div key={f}>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                  {f === 'firstName' ? 'First Name' : 'Last Name'}
                </label>
                <input required value={(form as any)[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            ))}
          </div>

          {!editing && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Email</label>
              <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          )}

          {!editing && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Initial Password</label>
              <input required type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Minimum 8 characters" minLength={8} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                {ALL_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_META[r]?.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Department</label>
              <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Engineering" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="+91 98765 00001" />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Bio / Notes</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Short description..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-95 disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Permission grant modal (Founder only) ────────────────────────────────
function PermissionsModal({ user, onSave, onClose }: any) {
  const parsed = (() => { try { return JSON.parse(user.permissions || '{}'); } catch { return {}; } })();
  const [perms, setPerms] = useState<Record<string, boolean>>(parsed);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest(`/hrms/users/${user.id}/permissions`, {
        method: 'PATCH', body: JSON.stringify({ permissions: perms }),
      });
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-400" />
            Manage Access — {user.firstName} {user.lastName}
          </h3>
          <button onClick={onClose}><XCircle className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-xs text-muted-foreground mb-4">
            User ID: <UserIdBadge userId={user.userId} /> · Role: <RoleBadge role={user.role} />
          </p>
          {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-secondary/50 transition">
              <span className="text-sm font-semibold">{label}</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${perms[key] ? 'bg-primary' : 'bg-border'}`}
                onClick={() => setPerms(p => ({ ...p, [key]: !p[key] }))}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${perms[key] ? 'left-5' : 'left-0.5'}`} />
              </div>
            </label>
          ))}
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-yellow-500 text-black rounded-lg text-sm font-bold hover:opacity-95 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Access'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reset password modal ─────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose }: any) {
  const [newPassword, setNewPassword] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest(`/hrms/users/${user.id}/reset-password`, {
        method: 'PATCH', body: JSON.stringify({ newPassword }),
      });
      setDone(true);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2"><Key className="w-4 h-4 text-orange-400" /> Reset Password</h3>
          <button onClick={onClose}><XCircle className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="font-bold">Password reset successfully</p>
              <p className="text-sm text-muted-foreground mt-1">{user.firstName}'s password has been updated.</p>
              <button onClick={onClose} className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">Close</button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-muted-foreground">Setting new password for <strong>{user.firstName} {user.lastName}</strong> (<span className="font-mono text-violet-400 text-xs">{user.userId}</span>)</p>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  required minLength={8} placeholder="New password (min 8 chars)"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-primary" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-lg text-sm hover:bg-secondary">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-bold hover:opacity-95 disabled:opacity-50">
                  {saving ? 'Resetting...' : 'Reset'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Settings panel ───────────────────────────────────────────────
function ProfileSettings({ currentUser }: { currentUser: any }) {
  const [localUser, setLocalUser] = useState(currentUser);
  const [profile, setProfile] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    phone: currentUser?.phone || '',
    bio: currentUser?.bio || '',
    department: currentUser?.department || '',
  });
  const [passwords, setPasswords] = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await apiRequest('/auth/profile', { method: 'PATCH', body: JSON.stringify(profile) });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const handlePwdChange = async (e: React.FormEvent) => {
    e.preventDefault(); setPwdError('');
    if (passwords.newPwd !== passwords.confirm) { setPwdError('Passwords do not match'); return; }
    setSaving(true);
    try {
      await apiRequest('/auth/password', { method: 'PATCH', body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPwd }) });
      setPwdSaved(true); setPasswords({ current: '', newPwd: '', confirm: '' });
      setTimeout(() => setPwdSaved(false), 2000);
    } catch (err: any) {
      setPwdError(err.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* ID Card with avatar upload */}
      <div className="p-5 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 flex items-center gap-5">
        <SelfAvatarUpload
          currentUser={localUser}
          onUploaded={(url) => setLocalUser((u: any) => ({ ...u, avatarUrl: url }))}
        />
        <div>
          <p className="text-xl font-bold">{localUser?.firstName} {localUser?.lastName}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <UserIdBadge userId={localUser?.userId} />
            <RoleBadge role={localUser?.role} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{localUser?.email} · {localUser?.department}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Camera className="w-3 h-3" /> Hover your avatar to change profile photo
          </p>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleProfileSave} className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <h3 className="font-bold flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Edit Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          {[['firstName', 'First Name'], ['lastName', 'Last Name']].map(([f, l]) => (
            <div key={f}>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">{l}</label>
              <input value={(profile as any)[f]} onChange={e => setProfile(p => ({ ...p, [f]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Phone</label>
            <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Department</label>
            <input value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Bio</label>
          <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
        </div>
        <button type="submit" disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition ${profileSaved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:opacity-95'} disabled:opacity-50`}>
          {profileSaved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Profile</>}
        </button>
      </form>

      {/* Password form */}
      <form onSubmit={handlePwdChange} className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Lock className="w-4 h-4 text-orange-400" /> Change Password</h3>
        {pwdError && <div className="text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" />{pwdError}</div>}
        {[['current', 'Current Password'], ['newPwd', 'New Password'], ['confirm', 'Confirm New Password']].map(([f, l]) => (
          <div key={f}>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">{l}</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={(passwords as any)[f]} required minLength={f === 'current' ? 1 : 8}
                onChange={e => setPasswords(p => ({ ...p, [f]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-primary" />
              {f === 'confirm' && (
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        ))}
        <button type="submit" disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition ${pwdSaved ? 'bg-green-500 text-white' : 'bg-orange-500 text-white hover:opacity-95'} disabled:opacity-50`}>
          {pwdSaved ? <><CheckCircle className="w-4 h-4" /> Changed!</> : <><Key className="w-4 h-4" /> Change Password</>}
        </button>
      </form>
    </div>
  );
}

// ─── Main People Management export ───────────────────────────────────────
export default function PeopleManagement() {
  const [currentUser] = useState<any>(getStoredUser());
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'directory' | 'profile'>('directory');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [permUser, setPermUser] = useState<any>(null);
  const [resetUser, setResetUser] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isFounder = ['FOUNDER', 'CO_FOUNDER'].includes(currentUser?.role);
  const isHR = currentUser?.role === 'HR_MANAGER';
  const isAdmin = currentUser?.role === 'ADMIN';
  const canManage = isFounder || isHR || isAdmin;

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/hrms/staff');
      setUsers(data.users || []);
      setGroups(data.groups || {});
      const expanded: Record<string, boolean> = {};
      Object.keys(data.groups || {}).forEach(r => { expanded[r] = true; });
      setExpandedGroups(expanded);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadStaff(); }, []);

  const handleDelete = async (user: any) => {
    try {
      await apiRequest(`/hrms/users/${user.id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      loadStaff();
    } catch (err: any) { alert(err.message); }
  };

  const filteredUsers = users.filter(u =>
    !searchQuery || [u.firstName, u.lastName, u.email, u.userId, u.role, u.department]
      .join(' ').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups: Record<string, any[]> = {};
  for (const [role, members] of Object.entries(groups)) {
    const filtered = members.filter(u => filteredUsers.find(fu => fu.id === u.id));
    if (filtered.length > 0) filteredGroups[role] = filtered;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> People Management
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {users.length} team members · User IDs: <span className="font-mono text-violet-400">VXR{new Date().getFullYear().toString().slice(-2)}XXX</span> / Clients: <span className="font-mono text-teal-400">CLNT{new Date().getFullYear().toString().slice(-2)}XXX</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab(activeTab === 'directory' ? 'profile' : 'directory')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-semibold transition ${activeTab === 'profile' ? 'bg-primary text-primary-foreground border-transparent' : 'border-border hover:bg-secondary'}`}>
            <UserCheck className="w-3.5 h-3.5" /> My Profile
          </button>
          {canManage && activeTab === 'directory' && (
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 transition shadow-lg shadow-primary/20">
              <UserPlus className="w-3.5 h-3.5" /> Add Member
            </button>
          )}
        </div>
      </div>

      {activeTab === 'profile' ? (
        <ProfileSettings currentUser={currentUser} />
      ) : (
        <>
          {/* Search */}
          <div className="relative">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, user ID, role, department..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {Object.entries(filteredGroups).map(([role, members]) => {
                const meta = ROLE_META[role] || { label: role, Icon: User, color: 'text-foreground', bg: 'bg-secondary' };
                const GroupIcon = meta.Icon;
                const isOpen = expandedGroups[role];
                return (
                  <div key={role} className="border border-border rounded-2xl overflow-hidden">
                    {/* Group header */}
                    <button
                      onClick={() => setExpandedGroups(p => ({ ...p, [role]: !p[role] }))}
                      className="w-full flex items-center justify-between px-5 py-3 bg-secondary/30 hover:bg-secondary/60 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg border ${meta.bg}`}>
                          <GroupIcon className={`w-4 h-4 ${meta.color}`} />
                        </div>
                        <span className={`font-bold text-sm ${meta.color}`}>{meta.label}</span>
                        <span className="text-xs px-2 py-0.5 bg-secondary rounded-full font-semibold text-muted-foreground">{members.length}</span>
                      </div>
                      {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {/* Group members */}
                    {isOpen && (
                      <div className="divide-y divide-border">
                        {members.map(u => (
                          <div key={u.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/20 transition ${!u.isActive ? 'opacity-40' : ''}`}>
                            {/* Avatar with upload for admins/HR */}
                            {canManage ? (
                              <AvatarUpload
                                user={u}
                                size="md"
                                onUploaded={(url) => {
                                  setUsers(prev => prev.map(p => p.id === u.id ? { ...p, avatarUrl: url } : p));
                                  setGroups(prev => {
                                    const next = { ...prev };
                                    if (next[role]) next[role] = next[role].map(p => p.id === u.id ? { ...p, avatarUrl: url } : p);
                                    return next;
                                  });
                                }}
                              />
                            ) : (
                              <Avatar user={u} size="md" />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm">{u.firstName} {u.lastName}</p>
                                <UserIdBadge userId={u.userId} />
                                {!u.isActive && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full font-bold">INACTIVE</span>}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{u.email} · {u.department || '—'} {u.phone ? `· ${u.phone}` : ''}</p>
                            </div>

                            {/* Actions */}
                            {canManage && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => setEditUser(u)} title="Edit"
                                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setResetUser(u)} title="Reset Password"
                                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-orange-400 transition">
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                                {isFounder && (
                                  <button onClick={() => setPermUser(u)} title="Manage Access"
                                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-yellow-400 transition">
                                    <Shield className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button onClick={() => setDeleteConfirm(u)} title="Deactivate"
                                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-red-400 transition">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <UserFormModal canManage={canManage} isFounder={isFounder} onClose={() => setShowCreateModal(false)} onSave={() => { setShowCreateModal(false); loadStaff(); }} />
      )}
      {editUser && (
        <UserFormModal initial={editUser} canManage={canManage} isFounder={isFounder} onClose={() => setEditUser(null)} onSave={() => { setEditUser(null); loadStaff(); }} />
      )}
      {permUser && (
        <PermissionsModal user={permUser} onClose={() => setPermUser(null)} onSave={() => { setPermUser(null); loadStaff(); }} />
      )}
      {resetUser && (
        <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />
      )}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-lg">Deactivate Account</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Deactivate <strong>{deleteConfirm.firstName} {deleteConfirm.lastName}</strong> (<span className="font-mono text-xs text-violet-400">{deleteConfirm.userId}</span>)?
              They will no longer be able to log in. This action can be reversed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm hover:bg-secondary">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:opacity-95">Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
