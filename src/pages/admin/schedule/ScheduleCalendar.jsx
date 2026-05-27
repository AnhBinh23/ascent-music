import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Loading from '../../../components/ui/Loading';
import scheduleService from '../../../services/scheduleService';
import { toast } from 'react-toastify';

const DAYS   = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];
const COLORS = [
  'bg-blue-50 border-blue-200',
  'bg-green-50 border-green-200',
  'bg-purple-50 border-purple-200',
  'bg-orange-50 border-orange-200',
  'bg-pink-50 border-pink-200',
];

const getDayOfWeek = (dateStr) => {
  const day = new Date(dateStr).getDay();
  return day === 0 ? 1 : day + 1;
};

const getDaysInMonth = (yearMonth) => {
  const [year, month] = yearMonth.split('-').map(Number);
  const days = [];
  const date  = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    days.push(new Date(date).toISOString().split('T')[0]);
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const ScheduleCalendar = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [tab, setTab]                     = useState('week');
  const [selectedDate, setSelectedDate]   = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await scheduleService.getAll();
        setSchedules(data);
      } catch (err) { toast.error(err.message); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa lịch học này?')) return;
    try {
      await scheduleService.delete(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
      toast.success('Đã xóa lịch học!');
    } catch (err) { toast.error(err.message); }
  };

  const byDay = DAYS.map((day, i) =>
    schedules.filter(s => s.day_of_week === i + 2 || (i === 6 && s.day_of_week === 1))
  );

  const schedulesByDate = schedules.filter(s => s.day_of_week === getDayOfWeek(selectedDate));
  const daysInMonth     = getDaysInMonth(selectedMonth);

  if (loading) return <MainLayout title="Lịch học"><Loading /></MainLayout>;

  return (
    <MainLayout title="Lịch học">
      <div className="flex justify-end mb-4">
        <Button icon="➕" onClick={() => navigate('/admin/schedule/new')}>Thêm lịch học</Button>
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-2xl">
        <button onClick={() => setTab('week')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all
            ${tab === 'week' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
          📅 Lịch tuần
        </button>
        <button onClick={() => setTab('date')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all
            ${tab === 'date' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
          🗓️ Theo ngày
        </button>
        <button onClick={() => setTab('month')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all
            ${tab === 'month' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
          📆 Theo tháng
        </button>
      </div>

      {/* ── TAB TUẦN ── */}
      {tab === 'week' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
            {DAYS.map((day, i) => (
              <div key={day} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-100 text-center">
                  <p className="text-sm font-semibold text-gray-700">{day}</p>
                </div>
                <div className="p-2 flex flex-col gap-2 min-h-[100px]">
                  {byDay[i].length === 0 ? (
                    <p className="text-xs text-gray-300 text-center py-3">Trống</p>
                  ) : byDay[i].map((s, j) => (
                    <div key={s.id} className={`p-2 rounded-xl border text-xs ${COLORS[j % COLORS.length]}`}>
                      <p className="font-semibold text-gray-800">{s.class_name || 'Lớp học'}</p>
                      <p className="text-gray-600">{s.time_start?.slice(0,5)} - {s.time_end?.slice(0,5)}</p>
                      <p className="text-gray-500">{s.teacher_name}</p>
                      <p className="text-gray-400">{s.room_name}</p>
                      <button onClick={() => handleDelete(s.id)}
                        className="mt-1 text-red-400 hover:text-red-600 text-xs">🗑️ Xóa</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {schedules.length === 0 && (
            <Card>
              <p className="text-center text-gray-400 py-10">Chưa có lịch học nào. Bấm "Thêm lịch học" để bắt đầu!</p>
            </Card>
          )}
        </>
      )}

      {/* ── TAB NGÀY ── */}
      {tab === 'date' && (
        <>
          <div className="mb-4">
            <input type="date" value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="input-field w-full" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              {new Date(selectedDate).toLocaleDateString('vi-VN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
            {schedulesByDate.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Không có lịch học ngày này</p>
            ) : (
              <div className="flex flex-col gap-3">
                {schedulesByDate
                  .sort((a, b) => a.time_start?.localeCompare(b.time_start))
                  .map((s, j) => (
                    <div key={s.id} className={`p-3 rounded-xl border ${COLORS[j % COLORS.length]}`}>
                      <p className="font-semibold text-gray-800 text-sm">{s.class_name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        🕐 {s.time_start?.slice(0,5)} - {s.time_end?.slice(0,5)}
                      </p>
                      <p className="text-xs text-gray-500">👨‍🏫 {s.teacher_name}</p>
                      <p className="text-xs text-gray-400">🚪 {s.room_name}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB THÁNG ── */}
      {tab === 'month' && (
        <>
          <div className="mb-4">
            <input type="month" value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="input-field w-full" />
          </div>
          <div className="flex flex-col gap-3">
            {daysInMonth.map(d => {
              const dow          = getDayOfWeek(d);
              const daySchedules = schedules.filter(s => s.day_of_week === dow);
              if (daySchedules.length === 0) return null;
              return (
                <div key={d} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700 capitalize">
                      {new Date(d).toLocaleDateString('vi-VN', {
                        weekday: 'long', day: 'numeric', month: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-400">{daySchedules.length} lớp</p>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    {daySchedules
                      .sort((a, b) => a.time_start?.localeCompare(b.time_start))
                      .map((s, j) => (
                        <div key={s.id} className={`p-2 rounded-xl border text-xs ${COLORS[j % COLORS.length]}`}>
                          <p className="font-semibold text-gray-800">{s.class_name}</p>
                          <p className="text-gray-600">
                            {s.time_start?.slice(0,5)} - {s.time_end?.slice(0,5)} · {s.teacher_name} · {s.room_name}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default ScheduleCalendar;