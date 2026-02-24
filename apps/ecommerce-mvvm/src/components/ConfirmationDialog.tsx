interface ConfirmationDialogProps {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <section className="dialog-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        {title ? <h3>{title}</h3> : null}
        <p>{message}</p>
        <div className="dialog-actions">
          <button type="button" className="ghost-btn" onClick={onCancel}>
            {cancelText ?? 'Cancel'}
          </button>
          <button type="button" className="brand-btn" onClick={onConfirm}>
            {confirmText ?? 'Confirm'}
          </button>
        </div>
      </section>
    </div>
  );
}
