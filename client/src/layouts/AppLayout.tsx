import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ClipboardList, Users, Settings, LogOut, Menu, X, Mail, BarChart3 } from 'lucide-react';
import logo from '../assets/Logo.png';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../Components/NotificationBell';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Leads', path: '/leads', icon: ClipboardList },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Email', path: '/email', icon: Mail },
    // We can add Quotes, Policies, Conversations later
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ label: 'Users', path: '/admin/users', icon: Settings });
    navItems.push({ label: 'Reports', path: '/admin/reports', icon: BarChart3 });
  }

  return (
    <div className="flex h-dvh bg-surface-muted text-text font-sans overflow-hidden max-md:flex-col">
      {/* Mobile top bar */}
      <header className="hidden max-md:flex items-center justify-between px-4 py-3 bg-surface border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-text">Mdar</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Ai</span>
          </h1>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="text-text-muted hover:text-text bg-neutral-50 hover:bg-neutral-100 border border-border p-2 rounded-md transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="hidden max-md:block fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 border-r border-border flex flex-col bg-surface shrink-0 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:shadow-dropdown max-md:transition-transform max-md:duration-200 ${
          isSidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-text">Mdar</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Ai</span>
            </h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="hidden max-md:flex text-text-muted hover:text-text p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-text-muted hover:text-text hover:bg-neutral-50'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-text">{user?.name}</span>
              <span className="text-xs text-text-muted">{user?.role === 'ADMIN' ? 'Administrator' : 'Agent'}</span>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="text-text-muted hover:text-text bg-neutral-50 hover:bg-neutral-100 border border-border p-2 rounded-md transition-colors"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
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
