import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Loading from '../../../components/ui/Loading';
import scheduleService from '../../../services/scheduleService';
import { toast } from 'react-toastify';

const DAYS = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];
const COLORS = ['bg-blue-50 border-blue-200','bg-green-50 border-green-200','bg-purple-50 border-purple-200',
  'bg-orange-50 border-orange-200','bg-pink-50 border-pink-200'];

const ScheduleCalendar = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await scheduleService.getAll();
        setSchedules(data);
      } catch (err) { toast.error(err.message); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa lịch học này?')) return;
    try {
      await scheduleService.delete(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
      toast.success('Đã xóa lịch học!');
    } catch (err) { toast.error(err.message); }
  };

  // Nhóm theo ngày trong tuần
  const byDay = DAYS.map((day, i) =>
    schedules.filter(s => s.day_of_week === i + 2 || (i === 6 && s.day_of_week === 1))
  );

  if (loading) return <MainLayout title="Lịch học"><Loading /></MainLayout>;

  return (
    <MainLayout title="Lịch học">
      <div className="flex justify-end mb-5">
        <Button icon="➕" onClick={() => navigate('/admin/schedule/new')}>Thêm lịch học</Button>
      </div>

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
    </MainLayout>
  );
};

export default ScheduleCalendar;