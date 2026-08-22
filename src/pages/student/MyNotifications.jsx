import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import useRealtimeEvent from '../../hooks/useRealtimeEvent';

const MyNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(data.rows || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user?.id) load(); }, [user, load]);

  // ── Real-time: nhận thông báo mới → tự refresh ──
  useRealtimeEvent('notification:new', () => { load(); });

  const getIcon = (type) => {
    if (type === 'course_ending') return '📋';
    if (type === 'salary') return '💰';
    if (type === 'manual') return '📨';
    return '🔔';
  };

  const getTimeAgo = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(date).toLocaleDateString('vi-VN');
  };

  if (loading) return (
    <MainLayout title="Thông báo">
      <p className="text-center text-gray-400 py-20">Đang tải...</p>
    </MainLayout>
  );

  return (
    <MainLayout title="Thông báo">
      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-400">Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map(n => (
            <div key={n.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                    {n.type === 'manual' && <Badge label="Từ trung tâm" variant="blue" />}
                  </div>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <span>{getTimeAgo(n.created_at)}</span>
                    {n.sender_name && <span>· {n.sender_name}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default MyNotifications;