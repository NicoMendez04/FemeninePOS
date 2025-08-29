import React from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check size={20} />;
      case 'error':
        return <X size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return <Check size={20} />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-green-500 text-white';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${getStyles()} px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-bounce`}>
      {getIcon()}
      {message}
      {onClose && (
        <button 
          onClick={onClose}
          className="ml-2 hover:bg-black hover:bg-opacity-20 rounded-full p-1 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Notification;
