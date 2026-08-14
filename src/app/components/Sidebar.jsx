'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FolderOpen, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import signOutAndExit from '@/app/firebase/auth/signout';
import BrandLogo from '@/app/components/BrandLogo';

const navigation = [{ name: 'Категории', href: '/categories', icon: FolderOpen }];

function NavigationItems({ onNavigate }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center space-x-3 rounded-lg px-4 py-3 transition-all duration-200',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOutAndExit();
    onCloseMobile?.();
    router.push('/signin');
  };

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="border-b border-sidebar-border p-6">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} />
            <div>
              <p className="text-lg font-medium text-foreground">SmartiTV</p>
              <p className="text-xs text-muted-foreground">Админ</p>
            </div>
          </div>
        </div>
        <NavigationItems />
        <div className="border-t border-sidebar-border p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      <div
        className={cn(
          'fixed inset-0 z-50 transition-opacity lg:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={onCloseMobile}
          className="absolute inset-0 bg-background/80 backdrop-blur-[1px]"
        />
        <aside className="absolute left-0 top-0 flex h-full w-[86vw] max-w-xs flex-col border-r border-sidebar-border bg-sidebar">
          <div className="flex items-center justify-between gap-3 border-b border-sidebar-border p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <BrandLogo size={32} />
                <div className="min-w-0">
                  <p className="text-lg font-medium text-foreground">SmartiTV</p>
                  <p className="text-[11px] text-muted-foreground">Админ</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Закрыть меню"
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
              onClick={onCloseMobile}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <NavigationItems onNavigate={onCloseMobile} />
          <div className="border-t border-sidebar-border p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>Выйти</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
