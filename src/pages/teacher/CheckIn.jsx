import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import checkinService from '../../services/checkinService';
import scheduleService from '../../services/scheduleService';
import { toast } from 'react-toastify';

const CheckIn = () => {
  const { user } = useAuth();
  const [todayClasses, setTodayClasses] = useState([]);
  const [checkedIn, setCheckedIn]       = useState({});
  const [notes, setNotes]               = useState({});
  const [loading, setLoading]           = useState({});
  const [history, setHistory]           = useState([]);
  const [now, setNow]                   = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        // Lịch hôm nay
        const schedules = await scheduleService.getByTeacher(user?.id || 'teacher-001');
        const today = new Date().getDay() || 7;
        const todaySchedule = schedules.filter(s => s.day_of_week == today);
        setTodayClasses(todaySchedule);

        // Lịch sử chấm công
        const hist = await checkinService.getByTeacher(user?.id || 'teacher-001');
        setHistory(hist);

        // Kiểm tra đã chấm công hôm nay chưa
        const todayStr = new Date().toISOString().split('T')[0];
        const todayCheckins = hist.filter(h => h.date === todayStr);
        const checkedMap = {};
        todayCheckins.forEach(c => { checkedMap[c.class_id] = c; });
        setCheckedIn(checkedMap);
      } catch (err) {
        console.error(err.message);
      }
    };
    fetch();
  }, [user]);

  const handleCheckIn = async (cls) => {
    setLoading(prev => ({ ...prev, [cls.id]: true }));
    try {
      const timeNow      = now.toTimeString().slice(0, 5);
      const dateNow      = new Date().toISOString().split('T')[0];
      const salaryEarned = 200000; // Mặc định, lấy từ teacher profile

      await checkinService.create({
        class_id:      cls.id || cls.class_id,
        date:          dateNow,
        time:          timeNow,
        salary_earned: salaryEarned,
        note:          notes[cls.id] || '',
      });

      setCheckedIn(prev => ({
        ...prev,
        [cls.id]: { time: timeNow, salary_earned: salaryEarned }
      }));

      toast.success(`✅ Chấm công thành công! Lương: ${salaryEarned.toLocaleString('vi-VN')}đ`);

      // Reload history
      const hist = await checkinService.getByTeacher(user?.id || 'teacher-001');
      setHistory(hist);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(prev => ({ ...prev, [cls.id]: false }));
    }
  };

  const todaySalary = Object.values(checkedIn).reduce((sum, c) => sum + Number(c.salary_earned || 0), 0);
  const totalDone   = Object.keys(checkedIn).length;

  // Tổng lương tuần
  const weekSalary = history.reduce((sum, h) => sum + Number(h.salary_earned || 0), 0);

  return (
    <MainLayout title="Chấm công">
      {/* Tổng quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{todayClasses.length}</p>
          <p className="text-xs text-gray-500 mt-1">Buổi hôm nay</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{totalDone}</p>
          <p className="text-xs text-gray-500 mt-1">Đã chấm công</p>
        </div>
        <div className="card text-center col-span-2">
          <p className="text-2xl font-bold text-orange-500">{todaySalary.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-gray-500 mt-1">💰 Lương hôm nay</p>
        </div>
      </div>

      {/* Giờ hiện tại */}
      <div className="flex items-center gap-3 mb-5 p-4 bg-primary-50 rounded-2xl border border-primary-100">
        <span className="text-2xl">🕐</span>
        <div className="flex-1">
          <p className="font-semibold text-primary-700">
            {now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-primary-500">
            {now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Danh sách buổi học hôm nay */}
      {todayClasses.length === 0 ? (
        <Card>
          <p className="text-center text-gray-400 py-10">Không có lịch dạy hôm nay 🎉</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4 mb-6">
          {todayClasses.map(cls => {
            const isDone   = !!checkedIn[cls.id];
            const checkin  = checkedIn[cls.id];

            return (
              <Card key={cls.id}>
                <div className="flex items-start gap-4">
                  <div className="min-w-[64px] p-3 rounded-2xl text-center border bg-gray-50 border-gray-100">
                    <p className="text-sm font-bold text-gray-800">{cls.time_start?.slice(0,5)}</p>
                    <div className="w-full h-px bg-gray-200 my-1" />
                    <p className="text-xs text-gray-500">{cls.time_end?.slice(0,5)}</p>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-gray-800">{cls.class_name || 'Lớp học'}</p>
                      <Badge label={cls.type === '1v1' ? '1 kèm 1' : 'Nhóm'} variant={cls.type === '1v1' ? 'blue' : 'green'} />
                      {isDone && <Badge label="✅ Đã chấm công" variant="green" />}
                    </div>
                    <p className="text-sm text-gray-500">{cls.room_name}</p>

                    {isDone ? (
                      <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-green-700">✅ Chấm công lúc {checkin?.time}</p>
                          <div className="text-right">
                            <p className="text-xs text-green-600">Lương nhận được</p>
                            <p className="text-lg font-bold text-green-700">
                              +{Number(checkin?.salary_earned).toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <input type="text"
                          placeholder="Ghi chú (không bắt buộc)..."
                          value={notes[cls.id] || ''}
                          onChange={e => setNotes(prev => ({ ...prev, [cls.id]: e.target.value }))}
                          className="input-field text-sm" />
                      </div>
                    )}
                  </div>

                  {!isDone && (
                    <Button loading={loading[cls.id]} onClick={() => handleCheckIn(cls)}
                      icon="✅" className="flex-shrink-0">
                      Chấm công
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tổng kết lương */}
      <Card title="💰 Tổng kết lương" subtitle="7 ngày gần nhất">
        <div className="grid grid-cols-2 gap-4 mt-3 mb-4">
          <div className="p-4 bg-orange-50 rounded-2xl text-center border border-orange-100">
            <p className="text-xs text-orange-600 mb-1">Hôm nay</p>
            <p className="text-2xl font-bold text-orange-600">{todaySalary.toLocaleString('vi-VN')}đ</p>
            <p className="text-xs text-orange-500 mt-1">{totalDone} buổi</p>
          </div>
          <div className="p-4 bg-green-50 rounded-2xl text-center border border-green-100">
            <p className="text-xs text-green-600 mb-1">Tổng tích lũy</p>
            <p className="text-2xl font-bold text-green-600">{weekSalary.toLocaleString('vi-VN')}đ</p>
            <p className="text-xs text-green-500 mt-1">{history.length} buổi</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {history.slice(0, 7).map((h, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span>✅</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{h.class_name || 'Buổi học'}</p>
                  <p className="text-xs text-gray-500">{h.date} · {h.time?.slice(0,5)}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-700">
                {Number(h.salary_earned).toLocaleString('vi-VN')}đ
              </p>
            </div>
          ))}
        </div>
      </Card>
    </MainLayout>
  );
};

export default CheckIn;