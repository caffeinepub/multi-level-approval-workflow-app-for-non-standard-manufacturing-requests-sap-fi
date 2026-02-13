import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useGetCallerUserProfile } from '../../hooks/useCurrentUserProfile';
import { useGetMyApprovals } from '../../hooks/useApprovals';
import LoginButton from '../auth/LoginButton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, ClipboardList, CheckSquare, Plus } from 'lucide-react';

export default function AppLayout() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: myApprovals } = useGetMyApprovals();

  const currentPath = routerState.location.pathname;
  const hasApprovals = (myApprovals?.length || 0) > 0;

  const navItems = [
    { path: '/my-requests', label: 'My Requests', icon: FileText },
    { path: '/my-approvals', label: 'My Approvals', icon: CheckSquare, show: hasApprovals },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-semibold">Approval Workflow</h1>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                if (item.show === false) return null;
                const Icon = item.icon;
                const isActive = currentPath === item.path || (item.path === '/my-requests' && currentPath === '/');
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => navigate({ to: item.path })}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate({ to: '/create' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
            {userProfile && (
              <div className="text-sm text-muted-foreground">
                {userProfile.name}
              </div>
            )}
            <LoginButton />
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6">
        <Outlet />
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex h-14 items-center justify-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Built with love using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
