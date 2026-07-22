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
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-800 flex flex-col bg-neutral-950">
        <div className="p-6 flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-bold tracking-tight">
            <span>Mdar</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Ai</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-800 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{user?.name}</span>
              <span className="text-xs text-neutral-500">{user?.role === 'ADMIN' ? 'Administrator' : 'Agent'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 p-2 rounded-lg transition-colors"
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
