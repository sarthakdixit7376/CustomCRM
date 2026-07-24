import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import logo from '../assets/Logo.png';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Leads', path: '/leads', icon: '📝' },
    { label: 'Customers', path: '/customers', icon: '👥' },
    // We can add Quotes, Policies, Conversations later
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ label: 'Users', path: '/admin/users', icon: '⚙️' });
  }

  return (
    <div className="flex h-screen bg-surface-muted text-text font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col bg-surface">
        <div className="p-6 flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-text">Mdar</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Ai</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-text-muted hover:text-text hover:bg-neutral-50'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-text">{user?.name}</span>
              <span className="text-xs text-text-muted">{user?.role === 'ADMIN' ? 'Administrator' : 'Agent'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-text-muted hover:text-text bg-neutral-50 hover:bg-neutral-100 border border-border p-2 rounded-md transition-colors"
              title="Log out"
            >
              ✕
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
}
