'use client';

import { AlertTriangle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import Button from './ui/Button';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmDisabled = false,
  isLoading = false,
}) {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/40">
          <div className="flex items-start space-x-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="mb-2 text-foreground">{title}</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {description}
              </Dialog.Description>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end space-x-3">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={confirmDisabled || isLoading}>
              {isLoading ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
