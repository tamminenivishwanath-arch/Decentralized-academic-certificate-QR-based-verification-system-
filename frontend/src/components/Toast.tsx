import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'border-success/30 bg-success/10',
  error: 'border-destructive/30 bg-destructive/10',
  warning: 'border-warning/30 bg-warning/10',
  info: 'border-primary/30 bg-primary/10',
};

const iconStyles = {
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
  info: 'text-primary',
};

export function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-lg transition-all duration-300',
        styles[type],
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn('w-5 h-5', iconStyles[type])} />
      <span className="text-foreground text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="text-muted-foreground hover:text-foreground transition-colors ml-2"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Toast manager hook
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
const listeners: Set<(toasts: ToastItem[]) => void> = new Set();
let toasts: ToastItem[] = [];

function notify() {
  listeners.forEach((listener) => listener([...toasts]));
}

export const toast = {
  success: (message: string) => {
    const id = ++toastId;
    toasts = [...toasts, { id, message, type: 'success' }];
    notify();
    return id;
  },
  error: (message: string) => {
    const id = ++toastId;
    toasts = [...toasts, { id, message, type: 'error' }];
    notify();
    return id;
  },
  warning: (message: string) => {
    const id = ++toastId;
    toasts = [...toasts, { id, message, type: 'warning' }];
    notify();
    return id;
  },
  info: (message: string) => {
    const id = ++toastId;
    toasts = [...toasts, { id, message, type: 'info' }];
    notify();
    return id;
  },
  dismiss: (id: number) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
};

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {items.map((item) => (
        <Toast
          key={item.id}
          message={item.message}
          type={item.type}
          onClose={() => toast.dismiss(item.id)}
        />
      ))}
    </div>
  );
}
