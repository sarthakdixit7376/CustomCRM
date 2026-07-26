import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/Logo.png';
import { API_BASE, setAuthToken } from '../config';
import { useAuth } from '../context/AuthContext';

interface InvitationInfo {
  name: string;
  email: string;
  role: string;
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { refreshMe } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loadError, setLoadError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError('This invitation link is missing a token.');
      setLoading(false);
      return;
    }
    axios
      .get(`${API_BASE}/api/auth/invite/${token}`)
      .then((res) => setInvitation(res.data))
      .catch((err) => {
        setLoadError(err.response?.data?.error || 'This invitation link is invalid.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/invite/${token}/accept`, { password, confirmPassword });
      if (res.data?.token) setAuthToken(res.data.token);
      await refreshMe();
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.request) {
        setError('Could not reach the server — check it is running and CORS is configured for this origin.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="font-sans bg-surface-muted text-text min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src={logo} alt="MdarAi Logo" className="w-12 h-12 object-contain" />
          <h1 className="text-2xl font-bold tracking-tight m-0">
            <span className="text-text">Mdar</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Ai</span>
          </h1>
        </div>

        <div className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-6 shadow-card">
          {loading ? (
            <p className="text-sm text-text-muted text-center m-0">Checking your invitation…</p>
          ) : loadError ? (
            <>
              <p className="text-sm text-danger-600 m-0">{loadError}</p>
              <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium text-center">
                Back to login
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-text m-0">
                Setting up an account for <span className="font-semibold">{invitation!.name}</span> ({invitation!.email}) as{' '}
                {invitation!.role === 'ADMIN' ? 'Admin' : 'Agent'}.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Password</label>
                <input
                  type="password"
                  required
                  autoFocus
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
                <p className="text-[11px] text-text-muted m-0">At least 8 characters.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Confirm password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              {error && <p className="text-sm text-danger-600 m-0">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary-600 text-white border-none cursor-pointer transition-all duration-150 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Setting up…' : 'Set password & continue'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
