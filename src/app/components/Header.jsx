'use client';

import { Menu } from 'lucide-react';

export default function Header({ onOpenMenu, userEmail }) {
  return (
    <header className="sticky top-0 z-10 h-16 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent lg:hidden"
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center justify-end">
          {userEmail ? (
            <span className="truncate text-sm text-muted-foreground">{userEmail}</span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
