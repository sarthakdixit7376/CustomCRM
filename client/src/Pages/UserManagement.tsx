import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { API_BASE } from '../config';
import type { Role } from '../context/AuthContext';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

interface PendingInvitation {
  id: string;
  name: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('AGENT');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');

  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('AGENT');
  const [inviteError, setInviteError] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  const fetchUsers = async () => {
    const res = await axios.get(`${API_BASE}/api/users`);
    setUsers(res.data);
  };

  const fetchInvitations = async () => {
    const res = await axios.get(`${API_BASE}/api/invitations`);
    setInvitations(res.data);
  };

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSubmitting(true);
    try {
      await axios.post(`${API_BASE}/api/invitations`, { name: inviteName, email: inviteEmail, role: inviteRole });
      setInviteName('');
      setInviteEmail('');
      setInviteRole('AGENT');
      setInviting(false);
      fetchInvitations();
    } catch (err: any) {
      setInviteError(err.response?.data?.error || 'Error sending invitation');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRevoke = async (invitationId: string) => {
    await axios.delete(`${API_BASE}/api/invitations/${invitationId}`);
    fetchInvitations();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/api/users`, { name, email, password, role });
      setName('');
      setEmail('');
      setPassword('');
      setRole('AGENT');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error creating user');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (u: ManagedUser) => {
    await axios.patch(`${API_BASE}/api/users/${u.id}`, { isActive: !u.isActive });
    fetchUsers();
  };

  const changeRole = async (u: ManagedUser, newRole: Role) => {
    await axios.patch(`${API_BASE}/api/users/${u.id}`, { role: newRole });
    fetchUsers();
  };

  const handleDelete = async (u: ManagedUser) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE}/api/users/${u.id}`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error deleting user');
    }
  };

  const handleResetPassword = async (userId: string) => {
    setResetError('');
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters');
      return;
    }
    try {
      await axios.patch(`${API_BASE}/api/users/${userId}`, { password: newPassword });
      setResettingId(null);
      setNewPassword('');
    } catch {
      setResetError('Error resetting password');
    }
  };

  return (
    <div className="font-sans bg-surface-muted text-text min-h-screen flex flex-col">
      <header className="px-8 pt-6 pb-4 flex items-center justify-between gap-4 flex-wrap max-md:px-4 max-md:pt-4">
        <h1 className="text-xl font-bold m-0 text-text">User Management</h1>
        <div className="flex items-center gap-2">
          <button
            className="text-sm font-medium text-white bg-primary-600 border-none rounded-lg px-4 py-2 cursor-pointer hover:bg-primary-700"
            onClick={() => setInviting(!inviting)}
          >
            {inviting ? 'Cancel invite' : 'Invite user'}
          </button>
          <button
            className="text-sm font-medium text-text-muted bg-surface border border-border rounded-lg px-4 py-2 cursor-pointer hover:bg-neutral-50 hover:text-text"
            onClick={() => navigate('/leads')}
          >
            <ArrowLeft size={14} className="inline-block mr-1.5 -mt-0.5" />Back to CRM
          </button>
        </div>
      </header>

      <div className="px-8 pb-8 flex flex-col gap-8 max-md:px-4">
        {inviting && (
          <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Name</label>
              <input
                required
                autoFocus
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Email</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviteSubmitting}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary-600 text-white border-none cursor-pointer hover:bg-primary-700 disabled:opacity-50"
            >
              {inviteSubmitting ? 'Sending…' : 'Send invitation'}
            </button>
            {inviteError && <p className="text-sm text-danger-600 m-0 basis-full">{inviteError}</p>}
          </form>
        )}

        {invitations.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-card">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-text-muted bg-neutral-50 border-b border-border">
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider" colSpan={5}>
                    Pending invitations
                  </th>
                </tr>
                <tr className="text-left text-text-muted bg-neutral-50 border-b border-border">
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider">Name</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider">Email</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider">Role</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider">Expires</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-b-0 hover:bg-neutral-50">
                    <td className="py-2.5 px-4 text-text font-medium">{inv.name}</td>
                    <td className="py-2.5 px-4 text-text-muted">{inv.email}</td>
                    <td className="py-2.5 px-4 text-text-muted">{inv.role === 'ADMIN' ? 'Admin' : 'Agent'}</td>
                    <td className="py-2.5 px-4 text-text-muted">{new Date(inv.expiresAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-4">
                      <button
                        className="text-xs font-medium text-danger-600 bg-danger-50 border border-danger-100 rounded px-3 py-1.5 cursor-pointer hover:bg-danger-100"
                        onClick={() => handleRevoke(inv.id)}
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 bg-surface border border-border rounded-xl p-5 shadow-card max-md:p-4">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
            <label className="text-xs font-medium text-text-muted">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-text-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-text-muted">Temporary password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
            <label className="text-xs font-medium text-text-muted">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            >
              <option value="AGENT">Agent</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary-600 text-white border-none cursor-pointer hover:bg-primary-700 disabled:opacity-50 max-md:w-full"
          >
            {submitting ? 'Creating…' : 'Create user'}
          </button>
          {error && <p className="text-sm text-danger-600 m-0 basis-full">{error}</p>}
        </form>

        <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-card">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-text-muted bg-neutral-50 border-b border-border">
                <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider">Name</th>
                <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider">Email</th>
                <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider">Role</th>
                <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-neutral-50">
                  <td className="py-2.5 px-4 text-text font-medium">{u.name}</td>
                  <td className="py-2.5 px-4 text-text-muted">{u.email}</td>
                  <td className="py-2.5 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                      className="bg-surface border border-border rounded px-2 py-1 text-xs text-text outline-none"
                    >
                      <option value="AGENT">Agent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.isActive ? 'bg-success-50 text-success-600' : 'bg-neutral-100 text-text-muted'
                    }`}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        className="text-xs font-medium text-text-muted bg-surface border border-border rounded px-3 py-1.5 cursor-pointer hover:bg-neutral-50 hover:text-text"
                        onClick={() => toggleActive(u)}
                      >
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                      <button
                        className="text-xs font-medium text-danger-600 bg-danger-50 border border-danger-100 rounded px-3 py-1.5 cursor-pointer hover:bg-danger-100"
                        onClick={() => handleDelete(u)}
                      >
                        Delete
                      </button>
                      <button
                        className="text-xs font-medium text-text-muted bg-surface border border-border rounded px-3 py-1.5 cursor-pointer hover:bg-neutral-50 hover:text-text"
                        onClick={() => {
                          setResettingId(resettingId === u.id ? null : u.id);
                          setNewPassword('');
                          setResetError('');
                        }}
                      >
                        Reset password
                      </button>
                    </div>
                    {resettingId === u.id && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="password"
                          autoFocus
                          minLength={8}
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-surface border border-border rounded px-2 py-1.5 text-xs text-text outline-none focus:border-primary-400"
                        />
                        <button
                          className="text-xs font-semibold bg-primary-600 text-white rounded px-3 py-1.5 cursor-pointer hover:bg-primary-700"
                          onClick={() => handleResetPassword(u.id)}
                        >
                          Save
                        </button>
                        {resetError && <p className="text-xs text-danger-600 m-0">{resetError}</p>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
