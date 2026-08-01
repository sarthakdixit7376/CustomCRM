import { Link } from 'react-router-dom';
import { ClipboardList, Users as UsersIcon, Mail, Send, AtSign, ShieldCheck } from 'lucide-react';
import logo from '../assets/Logo.png';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Lead management',
    description: 'Track leads from first contact through quoting, documents, and policy issuance in one flow.',
  },
  {
    icon: UsersIcon,
    title: 'Customer & policy records',
    description: 'Keep customer details, contacts, and active insurance policies organized and up to date.',
  },
  {
    icon: Mail,
    title: 'Gmail inbox integration',
    description:
      'Connect your Gmail account to read and send email with customers directly inside MdarAI, without switching tabs.',
  },
];

const GOOGLE_DATA_USES = [
  {
    icon: Mail,
    title: 'View your Gmail messages',
    description:
      'So MdarAI can show your inbox and let you open and read individual emails inside the CRM. Message content is fetched live from Gmail each time and is not stored on our servers.',
  },
  {
    icon: Send,
    title: 'Send email on your behalf',
    description:
      'Only used at the moment you click "Send" after composing a message inside MdarAI, so you can email customers without switching to Gmail.',
  },
  {
    icon: AtSign,
    title: 'Your Google email address',
    description: 'Used to identify which Gmail account you\'ve connected and to show it in the account switcher.',
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-dvh bg-surface-muted text-text font-sans flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="MdarAI logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold tracking-tight text-text">MdarAI</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link to="/privacy" className="text-sm text-text-muted hover:text-text">
            Privacy Policy
          </Link>
          <Link
            to={user ? '/leads' : '/login'}
            className="text-sm font-medium text-white bg-primary-600 rounded-lg px-4 py-2 hover:bg-primary-700"
          >
            {user ? 'Go to Dashboard' : 'Sign in'}
          </Link>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-16 flex flex-col gap-16">
        <section className="flex flex-col items-center text-center gap-5">
          <h1 className="text-3xl md:text-4xl font-bold text-text max-w-2xl">
            The CRM built for insurance agencies
          </h1>
          <p className="text-base text-text-muted max-w-xl">
            MdarAI helps insurance agents manage leads, customers, and policies in one place — and, with an optional
            Gmail connection, read and send customer email without leaving the app.
          </p>
          <Link
            to={user ? '/leads' : '/login'}
            className="text-sm font-semibold text-white bg-primary-600 rounded-lg px-6 py-3 hover:bg-primary-700"
          >
            {user ? 'Go to Dashboard' : 'Sign in to MdarAI'}
          </Link>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-3 bg-surface border border-border rounded-xl p-6 shadow-card">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon size={20} />
              </div>
              <h2 className="text-base font-semibold text-text">{title}</h2>
              <p className="text-sm text-text-muted leading-relaxed">{description}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 md:p-8 shadow-card">
          <div className="flex items-start gap-3">
            <ShieldCheck size={22} className="text-primary-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-text">Why MdarAI asks for access to your Google Account</h2>
              <p className="text-sm text-text-muted mt-1 leading-relaxed">
                Connecting Gmail is optional and only happens if you choose to use the Email tab. When you do, MdarAI
                requests exactly the following permissions from Google — nothing more:
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 pl-1">
            {GOOGLE_DATA_USES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 mt-0.5">
                  <Icon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">{title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-text-muted leading-relaxed border-t border-border pt-4">
            We never sell your data or use it for advertising, and you can disconnect your Gmail account at any time
            from the Email tab or from your{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Google Account permissions
            </a>
            . Full details are in our{' '}
            <Link to="/privacy" className="text-primary-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-text-muted">
        &copy; {new Date().getFullYear()} MdarAI. All rights reserved.
      </footer>
    </div>
  );
}
