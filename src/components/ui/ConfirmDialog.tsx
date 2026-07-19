import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center py-2">
        <div className="mx-auto grid place-items-center h-14 w-14 rounded-2xl bg-red-50 border border-red-100 mb-4">
          <AlertTriangle className="text-red-600" size={28} />
        </div>
        <h3 className="text-lg font-bold text-ink-900">{title}</h3>
        <p className="mt-2 text-sm text-ink-500">{message}</p>
        <div className="mt-6 flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button className="btn-danger flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
