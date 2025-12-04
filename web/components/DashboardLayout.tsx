'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface Workspace {
  id: number;
  name: string;
  slug: string;
  role: string;
  apiToken?: string;
}

interface User {
  name: string;
  email: string;
  avatar?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load data
    const workspaceData = localStorage.getItem('workspace');
    const workspacesData = localStorage.getItem('workspaces');
    const userData = localStorage.getItem('user');
    
    if (workspaceData) {
      setCurrentWorkspace(JSON.parse(workspaceData));
    }
    if (workspacesData) {
      setWorkspaces(JSON.parse(workspacesData));
    }
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    // Clear HttpOnly cookie via API
    await fetch('/api/auth/logout', { method: 'POST' });
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('workspace');
    localStorage.removeItem('workspaces');
    
    router.push('/login');
  };

  const switchWorkspace = async (workspace: Workspace) => {
    // Update current workspace
    localStorage.setItem('workspace', JSON.stringify(workspace));
    setCurrentWorkspace(workspace);
    
    // Reload to apply changes
    window.location.reload();
  };

  // Helper to generate breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    const paths = pathname?.split('/').filter(Boolean) || [];
    return paths.map((path, index) => {
      const href = `/${paths.slice(0, index + 1).join('/')}`;
      const isLast = index === paths.length - 1;
      return {
        name: path.charAt(0).toUpperCase() + path.slice(1),
        href,
        isLast
      };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <SidebarProvider>
      <AppSidebar 
        user={user}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSwitchWorkspace={switchWorkspace}
        onLogout={handleLogout}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">
                  TourLayer
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.length > 0 && <BreadcrumbSeparator className="hidden md:block" />}
              {breadcrumbs.map((item, index) => (
                <div key={item.href} className="flex items-center">
                  <BreadcrumbItem>
                    {item.isLast ? (
                      <BreadcrumbPage>{item.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href}>{item.name}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!item.isLast && <BreadcrumbSeparator className="hidden md:block ml-2" />}
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Main content area */}
          <main className="p-4 md:p-8 pt-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
