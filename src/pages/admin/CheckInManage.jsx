import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const CheckInManage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
    setNotifications(data);
  }, []);

  const markRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem('admin_notifications', JSON.stringify(updated));
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('admin_notifications', JSON.stringify(updated));
  };

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  // Sample data khi chưa có thật
  const displayData = filtered.length > 0 ? filtered : [
    { id: 1, teacherName: 'Nguyễn Thị Mai', className: 'Piano cơ bản 01', time: '08:05', date: '2025-05-21', note: '', read: false, createdAt: new Date().toISOString() },
    { id: 2, teacherName: 'Trần Văn Hùng',  className: 'Guitar nhóm 01',  time: '10:03', date: '2025-05-21', note: 'Đến đúng giờ', read: true,  createdAt: new Date().toISOString() },
    { id: 3, teacherName: 'Lê Thị Hoa',     className: 'Violin cơ bản',   time: '14:20', date: '2025-05-20', note: '', read: true,  createdAt: new Date().toISOString() },
  ];

  return (
    <MainLayout title="Quản lý chấm công">
      {/* Tổng quan */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{displayData.length}</p>
          <p className="text-xs text-gray-500 mt-1">Tổng chấm công</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-500">{unreadCount}</p>
          <p className="text-xs text-gray-500 mt-1">Chưa đọc</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">
            {displayData.filter(n => n.date === new Date().toISOString().split('T')[0]).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Hôm nay</p>
        </div>
      </div>

      {/* Filter & actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {[
            { key: 'all',    label: 'Tất cả' },
            { key: 'unread', label: `Chưa đọc (${unreadCount})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${filter === f.key ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            ✅ Đọc tất cả
          </Button>
        )}
      </div>

      {/* Danh sách thông báo */}
      <div className="flex flex-col gap-3">
        {displayData.length === 0 ? (
          <Card>
            <p className="text-center text-gray-400 py-10">Chưa có thông báo chấm công nào</p>
          </Card>
        ) : (
          displayData.map(notif => (
            <div key={notif.id}
              className={`p-4 rounded-2xl border transition-all
                ${notif.read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                    ${notif.read ? 'bg-gray-100 text-gray-600' : 'bg-primary-100 text-primary-700'}`}>
                    {notif.teacherName?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-800">{notif.teacherName}</p>
                      {!notif.read && <Badge label="Mới" variant="blue" />}
                    </div>
                    <p className="text-sm text-gray-600">
                      ✅ Chấm công buổi <span className="font-medium">{notif.className}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      🕐 {notif.time} · 📅 {notif.date}
                    </p>
                    {notif.note && (
                      <p className="text-xs text-gray-500 mt-1 italic">💬 "{notif.note}"</p>
                    )}
                  </div>
                </div>
                {!notif.read && (
                  <Button size="sm" variant="secondary" onClick={() => markRead(notif.id)}>
                    Đã đọc
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
};

export default CheckInManage;