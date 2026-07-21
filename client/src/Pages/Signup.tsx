import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/Logo.png';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signup(name, email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('An account with that email already exists.');
      } else if (err.response?.data?.error) {
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
    <div className="font-sans bg-black text-white min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src={logo} alt="MdarAi Logo" className="w-12 h-12 object-contain" />
          <h1 className="text-2xl font-bold tracking-tight m-0">
            <span>Mdar</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Ai</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-neutral-950 border border-neutral-800 rounded-xl p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-400">Name</label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-neutral-600"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-neutral-600"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-400">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-neutral-600"
            />
            <p className="text-[11px] text-neutral-500 m-0">At least 8 characters.</p>
          </div>

          {error && <p className="text-sm text-red-400 m-0">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white text-black border-none cursor-pointer transition-all duration-150 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-xs text-neutral-500 text-center m-0">
            Already have an account?{' '}
            <Link to="/login" className="text-neutral-300 hover:text-white">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
