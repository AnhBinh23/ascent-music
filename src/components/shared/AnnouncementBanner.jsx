import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const TYPE_STYLE = {
  holiday: { bg: 'bg-red-50 border-red-200',       icon: '🎉', text: 'text-red-700',    btn: 'text-red-500 hover:text-red-700' },
  dayoff:  { bg: 'bg-orange-50 border-orange-200', icon: '📅', text: 'text-orange-700', btn: 'text-orange-500 hover:text-orange-700' },
  info:    { bg: 'bg-blue-50 border-blue-200',     icon: '📢', text: 'text-blue-700',   btn: 'text-blue-500 hover:text-blue-700' },
  warning: { bg: 'bg-yellow-50 border-yellow-200', icon: '⚠️', text: 'text-yellow-700', btn: 'text-yellow-500 hover:text-yellow-700' },
  success: { bg: 'bg-green-50 border-green-200',   icon: '✅', text: 'text-green-700',  btn: 'text-green-500 hover:text-green-700' },
};

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed]         = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/notifications/banners');
        setAnnouncements(res.rows || []);
      } catch {
        setAnnouncements([]);
      }
    };
    // Dismiss vẫn lưu local (theo từng thiết bị)
    setDismissed(JSON.parse(localStorage.getItem('dismissed_announcements') || '[]'));
    load();
    const interval = setInterval(load, 60000); // refresh mỗi phút
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
  };

  const visible = announcements.filter(a => !dismissed.includes(a.id));
  if (!visible.length) return null;

  return (
    <div className="flex flex-col gap-2 mb-5">
      {visible.map(ann => {
        const style = TYPE_STYLE[ann.type] || TYPE_STYLE.info;
        return (
          <div key={ann.id} className={`flex items-start gap-3 p-4 rounded-2xl border ${style.bg}`}>
            <span className="text-xl flex-shrink-0">{style.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${style.text}`}>{ann.title}</p>
              <p className={`text-sm mt-0.5 whitespace-pre-line ${style.text} opacity-80`}>{ann.message}</p>
            </div>
            <button onClick={() => handleDismiss(ann.id)}
              className={`text-lg leading-none ${style.btn} transition-colors flex-shrink-0`}>
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementBanner;