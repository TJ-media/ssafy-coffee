import { useEffect, useState } from 'react';
import { ToastMessage } from '../types';
import { ShoppingCart, CheckCircle, AlertTriangle } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const Toast = ({ toasts, removeToast }: ToastProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  onClose: () => void;
}

const ToastItem = ({ toast, onClose }: ToastItemProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2700);

    const removeTimer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [onClose]);

  const handleClick = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={18} className="text-secondary" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-500" />;
      default:
        return <ShoppingCart size={18} className="text-primary" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-secondary';
      case 'warning':
        return 'bg-amber-50 border-amber-400';
      default:
        return 'bg-blue-50 border-primary';
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`${isExiting ? 'toast-exit' : 'toast-enter'} ${getBgColor()}
        px-4 py-3 rounded-xl shadow-lg border-l-4 cursor-pointer
        flex items-center gap-3 min-w-[200px]`}
    >
      {getIcon()}
      <p className="text-sm text-text-primary font-medium">{toast.message}</p>
    </div>
  );
};

export default Toast;
