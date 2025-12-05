'use client';

import { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AlertOptions {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function useAlertDialog() {
  const [alertState, setAlertState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
  });

  const showAlert = useCallback((options: AlertOptions | string) => {
    if (typeof options === 'string') {
      setAlertState({
        open: true,
        title: 'Alert',
        description: options,
        confirmText: 'OK',
        cancelText: '',
        onConfirm: () => setAlertState(prev => ({ ...prev, open: false })),
      });
    } else {
      setAlertState({
        open: true,
        title: options.title || 'Alert',
        description: options.description,
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || '',
        onConfirm: () => {
          options.onConfirm?.();
          setAlertState(prev => ({ ...prev, open: false }));
        },
        onCancel: () => {
          options.onCancel?.();
          setAlertState(prev => ({ ...prev, open: false }));
        },
      });
    }
  }, []);

  const AlertDialogComponent = () => (
    <AlertDialog open={alertState.open} onOpenChange={(open) => {
      if (!open) {
        setAlertState(prev => ({ ...prev, open: false }));
        alertState.onCancel?.();
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{alertState.title}</AlertDialogTitle>
          <AlertDialogDescription>{alertState.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {alertState.cancelText && (
            <AlertDialogCancel>
              {alertState.cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction onClick={alertState.onConfirm}>
            {alertState.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { showAlert, AlertDialogComponent };
}

