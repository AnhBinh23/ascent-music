import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ConnectionStatus from '../shared/ConnectionStatus';
import useRealtimeEvent from '../../hooks/useRealtimeEvent';

const TYPE_ICON = {
  checkin:         '📋',
  schedule_remind: '⏰',
  tuition:         '💰',
  material:        '📁',
  dayoff:          '📅',
  pending:         '🔔',
  general:         '📢',
  manual:          '📨',
  course_ending:   '🎓',
};

const roleLabels = {
  admin:   'Super Admin',
  staff:   'Nhân viên',
  teacher: 'Giáo viên',
  student: 'Học viên',
};

const roleColors = {
  admin:   'bg-red-100 text-red-700',
  staff:   'bg-orange-100 text-orange-700',
  teacher: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
};

const Header = ({ title = '' }) => {
  const { toggleSidebar, darkMode, toggleDarkMode } = useApp();
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();

  const [showNotif, setShowNotif]         = useState(false);
  const [showProfile, setShowProfile]     = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [expandedId, setExpandedId]       = useState(null);
  const [readIds, setReadIds]             = useState(() =>
    JSON.parse(localStorage.getItem('read_notif_ids') || '[]').map(String)
  );
  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  const loadNotifs = useCallback(async () => {
    try {
      const endpoint = user?.role === 'admin' ? '/notifications/history' : '/notifications';
      const data = await api.get(endpoint);
      const dbNotifs = (data.rows || []).map(n => ({
        id:        n.id,
        title:     n.title,
        message:   n.message,
        type:      n.type || 'manual',
        recipient: n.recipient,
        createdAt: n.created_at,
        read:      false,
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
  }, [user]);

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, [loadNotifs]);

  // ── Real-time: nhận notification → auto refresh danh sách ──
  useRealtimeEvent('notification:new', () => {
    loadNotifs();
  });
  useRealtimeEvent('attendance:saved', () => {
    loadNotifs();
  });
  useRealtimeEvent('checkin:created', () => {
    loadNotifs();
  });

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))     setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isRead = (n) => readIds.includes(String(n.id)) || n.read;
  const unreadCount = notifications.filter(n => !isRead(n)).length;

  const markRead = (id) => {
    const strId  = String(id);
    const newIds = [...new Set([...readIds, strId])];
    setReadIds(newIds);
    localStorage.setItem('read_notif_ids', JSON.stringify(newIds));
    const adminNotifs = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
    localStorage.setItem('admin_notifications',
      JSON.stringify(adminNotifs.map(n => String(n.id) === strId ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    const allIds = notifications.map(n => String(n.id));
    const newIds = [...new Set([...readIds, ...allIds])];
    setReadIds(newIds);
    localStorage.setItem('read_notif_ids', JSON.stringify(newIds));
    const adminNotifs = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
    localStorage.setItem('admin_notifications',
      JSON.stringify(adminNotifs.map(n => ({ ...n, read: true })))
    );
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
    markRead(id);
  };

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

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-600">
          ☰
        </button>
        <h1 className="text-base font-semibold text-gray-800">{title}</h1>
        <ConnectionStatus />
      </div>

      <div className="flex items-center gap-2">

        {/* Chuông thông báo */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false); if (!showNotif) loadNotifs(); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <span className="text-lg">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-800 text-sm">
                  Thông báo {unreadCount > 0 && <span className="text-primary-600">({unreadCount} mới)</span>}
                </p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline font-medium">
                    Đọc tất cả
                  </button>
                )}
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-3xl mb-2">🔕</p>
                    <p className="text-sm text-gray-400">Chưa có thông báo nào</p>
                  </div>
                ) : (
                  notifications.map((notif, i) => (
                    <div key={notif.id || i}
                      onClick={() => toggleExpand(notif.id)}
                      className={`px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50
                        ${!isRead(notif) ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                          ${!isRead(notif) ? 'bg-primary-100' : 'bg-gray-100'}`}>
                          {TYPE_ICON[notif.type] || '📢'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!isRead(notif) ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>
                            {notif.title || (notif.teacherName && `${notif.teacherName} đã chấm công`)}
                          </p>
                          <p className={`text-xs text-gray-500 mt-0.5 whitespace-pre-wrap ${expandedId === notif.id ? '' : 'line-clamp-2'}`}>
                            {notif.message || notif.className}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-400">{timeAgo(notif.createdAt)}</p>
                            <span className="text-xs text-primary-500 font-medium">
                              {expandedId === notif.id ? '▲ Thu gọn' : '▼ Xem thêm'}
                            </span>
                          </div>
                        </div>
                        {!isRead(notif) && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {user?.role === 'admin' && (
                <div className="px-4 py-3 border-t border-gray-100">
                  <button
                    onClick={() => { navigate('/admin/notifications'); setShowNotif(false); }}
                    className="text-xs text-primary-600 hover:underline font-medium w-full text-center">
                    Xem tất cả thông báo →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar + dropdown profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
            className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm hover:bg-primary-200 transition-colors">
            {user?.name?.charAt(0)?.toUpperCase()}
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${roleColors[user?.role]}`}>
                      {roleLabels[user?.role]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="py-2">
                <button
                  onClick={() => { navigate(`/${user?.role}/profile`); setShowProfile(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <span>⚙️</span>
                  <span>Tài khoản</span>
                </button>
                {/* Dark mode toggle */}
                <button
                  onClick={() => { toggleDarkMode(); setShowProfile(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <span>{darkMode ? '☀️' : '🌙'}</span>
                  <span>{darkMode ? 'Chế độ sáng' : 'Chế độ tối'}</span>
                </button>
              </div>
              <div className="border-t border-gray-100 py-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                  <span>🚪</span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;