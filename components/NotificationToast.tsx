
import React from 'react';
import { AppNotification } from '../types';

interface NotificationToastProps {
  notification: AppNotification;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification }) => {
  const bgColor = {
    success: 'bg-emerald-600',
    info: 'bg-indigo-600',
    warning: 'bg-amber-500',
    error: 'bg-rose-600'
  }[notification.type];

  const icon = {
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌'
  }[notification.type];

  return (
    <div className={`pointer-events-auto flex items-center gap-4 p-4 pr-5 min-w-[320px] rounded-2xl text-white shadow-2xl animate-slideInRight ${bgColor}`}>
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <h4 className="font-bold text-sm mb-0.5">{notification.title}</h4>
        <p className="text-white/80 text-xs leading-relaxed">{notification.message}</p>
      </div>
    </div>
  );
};

export default NotificationToast;
