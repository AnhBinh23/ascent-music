import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import useRealtimeEvent from '../../hooks/useRealtimeEvent';
import { toast } from 'react-toastify';

// DAYS theo thứ tự hiển thị: T2..CN. day_of_week trong DB: 1=CN, 2=T2..7=T7
const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
// Map day_of_week (DB) -> index trong DAYS
const dowToIndex = (dow) => (dow === 1 ? 6 : dow - 2);

const INSTRUMENT_ICON = { 'Piano': '🎹', 'Guitar': '🎸', 'Violin': '🎻', 'Thanh nhạc': '🎤' };
const hhmm = (t) => (t ? String(t).slice(0, 5) : '');

const MySchedule = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState('week');

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const stuRes    = await api.get(`/students/by-user/${user.id}`);
      const studentId = stuRes.row?.id || stuRes.rows?.[0]?.id;
      if (!studentId) { setSchedules([]); return; }

      const res = await api.get(`/schedules/student/${studentId}`);
      setSchedules(res.rows || []);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // ── Real-time: admin sửa lịch → tự cập nhật ──
  useRealtimeEvent('schedule:updated', (data) => {
    toast.info(`📅 Lịch học đã được cập nhật`, { autoClose: 4000 });
    load();
  });

  // index của hôm nay trong DAYS (getDay: 0=CN,1=T2..6=T7)
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  if (loading) return (
    <MainLayout title="Lịch học của tôi">
      <p className="text-center py-16 text-gray-400">Đang tải...</p>
    </MainLayout>
  );

  return (
    <MainLayout title="Lịch học của tôi">
      <div className="flex gap-2 mb-5">
        {['week', 'list'].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${view === v ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {v === 'week' ? '📅 Tuần' : '📋 Danh sách'}
          </button>
        ))}
      </div>

      {schedules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-2">📅</p>
          <p className="text-gray-400 text-sm">Bạn chưa có lịch học nào</p>
        </div>
      ) : view === 'week' ? (
        <Card title="Lịch học tuần này">
          <div className="grid grid-cols-7 gap-2 mt-3">
            {DAYS.map((day, i) => {
              const dayClasses = schedules.filter(s => dowToIndex(s.day_of_week) === i);
              return (
                <div key={i} className="flex flex-col gap-2">
                  <p className={`text-xs font-medium text-center py-1 rounded-lg
                    ${i === todayIndex ? 'bg-primary-600 text-white' : 'text-gray-500'}`}>{day}</p>
                  {dayClasses.map(cls => (
                    <div key={cls.id} className="p-2 bg-primary-50 rounded-xl">
                      <p className="text-xs font-medium text-primary-700 truncate">{cls.class_name}</p>
                      <p className="text-xs text-gray-500">{hhmm(cls.time_start)}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {schedules.map(cls => (
            <Card key={cls.id}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                  {INSTRUMENT_ICON[cls.instrument] || '🎵'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{cls.class_name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {cls.teacher_name || '—'} · {cls.room_name || 'Chưa có phòng'}
                  </p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge label={DAYS[dowToIndex(cls.day_of_week)]} variant="blue" />
                    <Badge label={`${hhmm(cls.time_start)} - ${hhmm(cls.time_end)}`} variant="gray" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default MySchedule;