'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Target, Settings, LogOut, BookOpen, Building2, ChevronDown, Check, MessageCircle } from 'lucide-react';

interface Workspace {
  id: number;
  name: string;
  slug: string;
  role: string;
  apiToken?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);

  useEffect(() => {
    // Load workspace data
    const workspaceData = localStorage.getItem('workspace');
    const workspacesData = localStorage.getItem('workspaces');
    
    if (workspaceData) {
      setCurrentWorkspace(JSON.parse(workspaceData));
    }
    if (workspacesData) {
      setWorkspaces(JSON.parse(workspacesData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('workspace');
    localStorage.removeItem('workspaces');
    router.push('/login');
  };

  const switchWorkspace = async (workspace: Workspace) => {
    // Update current workspace
    localStorage.setItem('workspace', JSON.stringify(workspace));
    setCurrentWorkspace(workspace);
    setShowWorkspaceSwitcher(false);
    
    // Reload to apply changes
    window.location.reload();
  };

  const nav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tours', href: '/tours', icon: Target },
    { name: 'Tooltips', href: '/tooltips', icon: MessageCircle },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Docs', href: '/docs', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">🎯 TourLayer</h1>
          </div>

          {/* Workspace Switcher */}
          <div className="p-4 border-b border-gray-100 relative">
            <button
              onClick={() => setShowWorkspaceSwitcher(!showWorkspaceSwitcher)}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                {currentWorkspace?.name?.charAt(0) || 'W'}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentWorkspace?.name || 'My Workspace'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {currentWorkspace?.role || 'Member'}
                </p>
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showWorkspaceSwitcher ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {showWorkspaceSwitcher && workspaces.length > 1 && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-500 px-2 py-1">Switch Workspace</p>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => switchWorkspace(ws)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold">
                        {ws.name?.charAt(0) || 'W'}
                      </div>
                      <span className="flex-1 text-left text-sm text-gray-700 truncate">{ws.name}</span>
                      {currentWorkspace?.id === ws.id && (
                        <Check size={14} className="text-green-500" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-100 p-2">
                  <Link
                    href="/workspaces/new"
                    className="flex items-center gap-2 px-2 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                    onClick={() => setShowWorkspaceSwitcher(false)}
                  >
                    <Building2 size={14} />
                    Create New Workspace
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {nav.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">{children}</main>
      </div>

      {/* Click outside to close */}
      {showWorkspaceSwitcher && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowWorkspaceSwitcher(false)}
        />
      )}
    </div>
  );
}
