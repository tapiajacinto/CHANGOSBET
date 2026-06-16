'use client';
import { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger' | 'gold';
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', tone = 'primary', loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <h3 className="font-display text-lg font-bold text-brand-900">{title}</h3>
        {description && <div className="mt-2 text-sm text-gray-500">{description}</div>}
      </div>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button variant={tone} fullWidth onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
