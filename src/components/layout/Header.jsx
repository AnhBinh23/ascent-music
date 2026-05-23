import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TYPE_ICON = {
  checkin:         '📋',
  schedule_remind: '⏰',
  tuition:         '💰',
  material:        '📁',
  dayoff:          '📅',
  pending:         '🔔',
  general:         '📢',
  manual:          '📨',
};

const Header = ({ title = '' }) => {
  const { toggleSidebar } = useApp();
  const { user }          = useAuth();
  const navigate          = useNavigate();

  const [showDropdown, setShowDropdown]   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds]             = useState(() =>
    JSON.parse(localStorage.getItem('read_notif_ids') || '[]')
  );
  const dropdownRef = useRef(null);

  // Load thông báo từ API + localStorage
 const loadNotifs = async () => {
  try {
    // Admin xem history, còn lại xem thông báo của mình
    const endpoint = user?.role === 'admin' ? '/notifications/history' : '/notifications';
    const data = await api.get(endpoint);
    const dbNotifs = (data.rows || []).map(n => ({
      id:        n.id,
      title:     n.title,
      message:   n.message,
      type:      n.type || 'manual',
      createdAt: n.created_at,
      read:      readIds.includes(n.id),
    }));

    const adminNotifs = user?.role === 'admin'
      ? JSON.parse(localStorage.getItem('admin_notifications') || '[]')
      : [];

    const all = [...adminNotifs, ...dbNotifs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 30);

    setNotifications(all);
  } catch {
    const appNotifs   = JSON.parse(localStorage.getItem('app_notifications') || '[]');
    const adminNotifs = user?.role === 'admin'
      ? JSON.parse(localStorage.getItem('admin_notifications') || '[]')
      : [];
    const all = [...adminNotifs, ...appNotifs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
    setNotifications(all);
  }
};

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, readIds]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifications.filter(n => !readIds.includes(n.id) && !n.read).length;

  const markRead = (id) => {
    const newIds = [...new Set([...readIds, id])];
    setReadIds(newIds);
    localStorage.setItem('read_notif_ids', JSON.stringify(newIds));
    // Cập nhật admin notifications
    const adminNotifs = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
    localStorage.setItem('admin_notifications',
      JSON.stringify(adminNotifs.map(n => n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id);
    const newIds = [...new Set([...readIds, ...allIds])];
    setReadIds(newIds);
    localStorage.setItem('read_notif_ids', JSON.stringify(newIds));
    const adminNotifs = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
    localStorage.setItem('admin_notifications',
      JSON.stringify(adminNotifs.map(n => ({ ...n, read: true })))
    );
  };

  const isRead = (n) => readIds.includes(n.id) || n.read;

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs} giờ trước`;
    return `${Math.floor(hrs / 24)} ngày trước`;
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-600 md:hidden">
          ☰
        </button>
        <h1 className="text-base font-semibold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Chuông thông báo */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setShowDropdown(!showDropdown); if (!showDropdown) loadNotifs(); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <span className="text-lg">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-800 text-sm">
                  Thông báo {unreadCount > 0 && <span className="text-primary-600">({unreadCount} mới)</span>}
                </p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    className="text-xs text-primary-600 hover:underline font-medium">
                    Đọc tất cả
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-3xl mb-2">🔕</p>
                    <p className="text-sm text-gray-400">Chưa có thông báo nào</p>
                  </div>
                ) : (
                  notifications.map((notif, i) => (
                    <div key={notif.id || i}
                      onClick={() => markRead(notif.id)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50
                        ${!isRead(notif) ? 'bg-blue-50' : ''}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                        ${!isRead(notif) ? 'bg-primary-100' : 'bg-gray-100'}`}>
                        {TYPE_ICON[notif.type] || '📢'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!isRead(notif) ? 'font-semibold text-gray-800' : 'text-gray-700'} truncate`}>
                          {notif.title || (notif.teacherName && `${notif.teacherName} đã chấm công`)}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {notif.message || notif.className}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(notif.createdAt)}</p>
                      </div>
                      {!isRead(notif) && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {user?.role === 'admin' && (
                <div className="px-4 py-3 border-t border-gray-100">
                  <button
                    onClick={() => { navigate('/admin/notifications'); setShowDropdown(false); }}
                    className="text-xs text-primary-600 hover:underline font-medium w-full text-center">
                    Xem tất cả thông báo →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar */}
        <button
          onClick={() => navigate(`/${user?.role}/profile`)}
          className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm hover:bg-primary-200 transition-colors">
          {user?.name?.charAt(0)?.toUpperCase()}
        </button>
      </div>
    </header>
  );
};

export default Header;