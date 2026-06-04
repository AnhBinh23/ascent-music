import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import AnnouncementBanner from '../../components/shared/AnnouncementBanner';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const INSTRUMENT_ICON = { 'Piano': '🎹', 'Guitar': '🎸', 'Violin': '🎻', 'Thanh nhạc': '🎤' };
const DAY_LABEL = { 1: 'CN', 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5', 6: 'T6', 7: 'T7' };
const hhmm = (t) => (t ? String(t).slice(0, 5) : '');
const fmt  = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';

// Tìm buổi học gần nhất sắp tới từ danh sách lịch
const getNextClass = (schedules) => {
  if (!schedules.length) return null;
  const now      = new Date();
  const todayDow = now.getDay() === 0 ? 1 : now.getDay() + 1; // DB: 1=CN..7=T7
  const nowMin   = now.getHours() * 60 + now.getMinutes();

  const minsUntil = (s) => {
    const [h, m]   = hhmm(s.time_start).split(':').map(Number);
    const diffDays = (s.day_of_week - todayDow + 7) % 7;
    let mins = diffDays * 1440 + (h * 60 + m) - nowMin;
    if (mins < 0) mins += 7 * 1440;
    return mins;
  };

  return [...schedules].sort((a, b) => minsUntil(a) - minsUntil(b))[0];
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [tuition, setTuition]     = useState([]);
  const [loading, setLoading]     = useState(true);

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const stuRes    = await api.get(`/students/by-user/${user.id}`);
        const studentId = stuRes.row?.id || stuRes.rows?.[0]?.id;
        if (!studentId) { setLoading(false); return; }

        const [schedRes, tuitionRes] = await Promise.all([
          api.get(`/schedules/student/${studentId}`),
          api.get('/tuition'),
        ]);
        setSchedules(schedRes.rows || []);
        setTuition((tuitionRes.rows || []).filter(t => t.student_id === studentId));
      } catch {
        setSchedules([]); setTuition([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const unpaid    = tuition.filter(t => t.status !== 'Đã thanh toán');
  const paid      = tuition.filter(t => t.status === 'Đã thanh toán');
  const totalPaid = paid.reduce((sum, t) => sum + Number(t.paid || 0), 0);
  const nextClass = getNextClass(schedules);

  if (loading) return (
    <MainLayout title="Tổng quan">
      <p className="text-center py-16 text-gray-400">Đang tải...</p>
    </MainLayout>
  );

  return (
    <MainLayout title="Tổng quan">
      <AnnouncementBanner />

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Xin chào, {user?.name}! 🎵</h2>
        <p className="text-sm text-gray-500 mt-1">{today}</p>
      </div>

      {/* Cảnh báo học phí chưa đóng */}
      {unpaid.length > 0 && (
        <div className="mb-5 p-4 bg-red-50 rounded-2xl border border-red-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-red-700">
                Bạn có {unpaid.length} khoản học phí chưa thanh toán đủ!
              </p>
              {unpaid.map(t => (
                <div key={t.id} className="flex items-center justify-between mt-2 p-2 bg-red-100 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-red-700 truncate">{t.class_name || t.instrument}</p>
                    {t.sessions > 0 && <p className="text-xs text-red-500">{t.sessions} buổi</p>}
                  </div>
                  <p className="text-sm font-bold text-red-700 flex-shrink-0">
                    Còn {fmt(Number(t.amount || 0) - Number(t.paid || 0))}
                  </p>
                </div>
              ))}
              <p className="text-xs text-red-500 mt-2">
                📞 Vui lòng liên hệ trung tâm để thanh toán: <span className="font-medium">0901 234 567</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card text-center">
          <p className={`text-2xl font-bold ${unpaid.length > 0 ? 'text-red-500' : 'text-green-600'}`}>
            {unpaid.length > 0 ? `${unpaid.length} chưa đóng` : '✅ Đã đóng'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Học phí</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-orange-600">{fmt(totalPaid)}</p>
          <p className="text-sm text-gray-500 mt-1">Tổng đã đóng</p>
        </div>
      </div>

      {/* Buổi học tiếp theo */}
      <Card title="Buổi học tiếp theo" className="mb-4">
        {nextClass ? (
          <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl">
            <div className="text-3xl">{INSTRUMENT_ICON[nextClass.instrument] || '🎵'}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{nextClass.class_name}</p>
              <p className="text-sm text-gray-500 truncate">
                {nextClass.teacher_name || '—'} · {nextClass.room_name || 'Chưa có phòng'}
              </p>
              <p className="text-sm text-primary-600 font-medium mt-1">
                {DAY_LABEL[nextClass.day_of_week]} · {hhmm(nextClass.time_start)} - {hhmm(nextClass.time_end)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-6 text-sm">Bạn chưa có lịch học nào</p>
        )}
      </Card>

      {/* Lịch sử thanh toán */}
      {paid.length > 0 && (
        <Card title="Lịch sử học phí đã đóng">
          <div className="flex flex-col gap-2 mt-2">
            {paid.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.class_name || t.instrument}</p>
                  {t.sessions > 0 && <p className="text-xs text-gray-500">{t.sessions} buổi</p>}
                  {t.paid_date && (
                    <p className="text-xs text-gray-400">Đóng: {new Date(t.paid_date).toLocaleDateString('vi-VN')}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-green-600">{fmt(t.paid || t.amount)}</p>
                  <Badge label="✅ Đã đóng" variant="green" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </MainLayout>
  );
};

export default StudentDashboard;