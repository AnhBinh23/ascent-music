import React from 'react';

const variants = {
  success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', icon: '✅' },
  error:   { bg: 'bg-red-50 border-red-200',     text: 'text-red-800',   icon: '❌' },
  warning: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', icon: '⚠️' },
  info:    { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-800',  icon: 'ℹ️' },
};

const Alert = ({ type = 'info', message, onClose }) => {
  const v = variants[type];
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${v.bg}`}>
      <span>{v.icon}</span>
      <p className={`text-sm flex-1 ${v.text}`}>{message}</p>
      {onClose && (
        <button onClick={onClose} className={`text-sm ${v.text} hover:opacity-70`}>✕</button>
      )}
    </div>
  );
};

export default Alert;