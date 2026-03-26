import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';
import { CheckSquare, BarChart2, Users, LogOut } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    localStorage.removeItem('token');
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: '进度查看', href: '/dashboard/progress', icon: BarChart2 },
  ];

  if (user?.role === 'admin') {
    navigation.unshift({ name: '任务管理', href: '/dashboard/tasks', icon: CheckSquare });
    navigation.push({ name: '人员管理', href: '/dashboard/users', icon: Users });
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop / Topbar for Mobile */}
      <div className="w-full md:w-64 bg-white shadow-md flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">任务进度查看工具</h1>
        </div>
        <div className="flex md:flex-col justify-between md:justify-start h-[calc(100%-4rem)] p-4 md:p-0 overflow-x-auto md:overflow-visible">
          <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1 md:p-4 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md whitespace-nowrap ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:block p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{user?.username}</span>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100"
                title="退出登录"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="md:hidden bg-white shadow-sm h-14 flex items-center justify-between px-4">
          <span className="text-sm font-medium text-gray-700">{user?.username}</span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
            <LogOut className="h-5 w-5" />
          </button>
        </header>
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
