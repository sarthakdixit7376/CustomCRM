import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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

  const fetchUsers = async () => {
    const res = await axios.get(`${API_BASE}/api/users`);
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
    <div className="font-sans bg-black text-white min-h-screen flex flex-col">
      <header className="px-8 pt-6 pb-4 flex items-center justify-between gap-4 max-md:px-4">
        <h1 className="text-xl font-bold m-0">User Management</h1>
        <button
          className="text-sm font-medium text-neutral-400 bg-transparent border border-neutral-700 rounded-lg px-4 py-2 cursor-pointer hover:bg-neutral-900"
          onClick={() => navigate('/')}
        >
          ← Back to CRM
        </button>
      </header>

      <div className="px-8 pb-8 flex flex-col gap-8 max-md:px-4">
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-400">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neutral-600"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neutral-600"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-400">Temporary password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neutral-600"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-400">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neutral-600"
            >
              <option value="AGENT">Agent</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-white text-black border-none cursor-pointer hover:bg-neutral-200 disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create user'}
          </button>
          {error && <p className="text-sm text-red-400 m-0 basis-full">{error}</p>}
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-neutral-500 border-b border-neutral-800">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-neutral-900">
                  <td className="py-2.5 pr-4">{u.name}</td>
                  <td className="py-2.5 pr-4 text-neutral-400">{u.email}</td>
                  <td className="py-2.5 pr-4">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                      className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white outline-none"
                    >
                      <option value="AGENT">Agent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={u.isActive ? 'text-green-400' : 'text-neutral-500'}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs font-medium text-neutral-400 bg-transparent border border-neutral-700 rounded px-3 py-1.5 cursor-pointer hover:bg-neutral-900"
                        onClick={() => toggleActive(u)}
                      >
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                      <button
                        className="text-xs font-medium text-red-400 bg-transparent border border-red-900 rounded px-3 py-1.5 cursor-pointer hover:bg-red-950"
                        onClick={() => handleDelete(u)}
                      >
                        Delete
                      </button>
                      <button
                        className="text-xs font-medium text-neutral-400 bg-transparent border border-neutral-700 rounded px-3 py-1.5 cursor-pointer hover:bg-neutral-900"
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
                          className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-neutral-600"
                        />
                        <button
                          className="text-xs font-semibold bg-white text-black rounded px-3 py-1.5 cursor-pointer hover:bg-neutral-200"
                          onClick={() => handleResetPassword(u.id)}
                        >
                          Save
                        </button>
                        {resetError && <p className="text-xs text-red-400 m-0">{resetError}</p>}
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
