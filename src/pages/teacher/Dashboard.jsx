import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import scheduleService from '../../services/scheduleService';
import { checkUpcomingClasses, getTimeUntil } from '../../services/notificationService';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [todayClasses, setTodayClasses] = useState([]);


  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  useEffect(() => {
    const sample = [
      { id: 1, className: 'Piano cơ bản', timeStart: '08:00', timeEnd: '09:00', room: 'Phòng 1', type: '1v1',   studentName: 'Nguyễn Văn A' },
      { id: 2, className: 'Guitar nâng cao', timeStart: '10:00', timeEnd: '11:00', room: 'Phòng 2', type: 'group', studentName: 'Nhóm 3 học viên' },
    ];

    const fetchData = async () => {
      try {
        const schedule = await scheduleService.getByTeacher(user?.id);
        const data = schedule.length ? schedule : sample;
        setTodayClasses(data);
        checkUpcomingClasses(data, 'teacher', user?.name);
      } catch {
        setTodayClasses(sample);
        checkUpcomingClasses(sample, 'teacher', user?.name);
      }
    };

    fetchData();
  }, [user]);

  // Kiểm tra nhắc lịch mỗi phút
  useEffect(() => {
    if (!todayClasses.length) return;
    const interval = setInterval(() => {
      checkUpcomingClasses(todayClasses, 'teacher', user?.name);
    }, 60000);
    return () => clearInterval(interval);
  }, [todayClasses, user]);

  return (
    <MainLayout title="Tổng quan">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Xin chào, {user?.name}! 👋</h2>
        <p className="text-sm text-gray-500 mt-1">{today}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-600">{todayClasses.length}</p>
          <p className="text-sm text-gray-500 mt-1">Buổi dạy hôm nay</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">
            {todayClasses.reduce((sum, c) => sum + (c.type === '1v1' ? 1 : 3), 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Học viên hôm nay</p>
        </div>
      </div>

      <Card title="Lịch dạy hôm nay">
        {todayClasses.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Hôm nay không có lịch dạy 🎉</p>
        ) : (
          <div className="flex flex-col gap-3">
            {todayClasses.map((cls) => {
              const timeLeft = getTimeUntil(cls.timeStart);
              return (
                <div key={cls.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="text-center min-w-[52px]">
                    <p className="text-sm font-bold text-primary-600">{cls.timeStart}</p>
                    <p className="text-xs text-gray-400">{cls.timeEnd}</p>
                  </div>
                  <div className="w-px h-10 bg-gray-200" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{cls.className}</p>
                    <p className="text-xs text-gray-500">{cls.studentName} · {cls.room}</p>
                    {timeLeft && (
                      <p className="text-xs text-orange-500 mt-0.5 font-medium">⏰ {timeLeft}</p>
                    )}
                  </div>
                  <Badge
                    label={cls.type === '1v1' ? '1 kèm 1' : 'Nhóm'}
                    variant={cls.type === '1v1' ? 'blue' : 'green'}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </MainLayout>
  );
};

export default TeacherDashboard;