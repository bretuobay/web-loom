interface Toast {
  id: string;
  message: string;
}

interface ToastStackProps {
  toasts: Toast[];
}

export function ToastStack({ toasts }: ToastStackProps) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div className="toast-item" key={toast.id}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
