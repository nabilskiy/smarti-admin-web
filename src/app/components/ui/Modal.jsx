'use client';

import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

export default function Modal({ open, onOpenChange, title, children, footer, className }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-1rem)] max-h-[90vh] overflow-y-auto sm:w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/40 sm:p-6',
            className
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-lg font-medium text-foreground">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-accent" aria-label="Закрыть">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          {children}
          {footer ? (
            <div className="mt-6 flex flex-col-reverse items-stretch justify-end gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:space-x-3">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
