import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { checkUpcomingClasses, getTimeUntil } from '../../services/notificationService';

const jsDayToDb = d => d === 0 ? 1 : d + 1;

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [todayClasses, setTodayClasses] = useState([]);

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Bước 1: Lấy teachers.id từ user.id
        const teacherRes = await api.get(`/teachers/by-user/${user?.id}`);
        const teacherId  = teacherRes?.row?.id;
        if (!teacherId) return;

        // Bước 2: Lấy schedules filter theo teacherId
        const schedulesRes = await api.get(`/schedules?teacher_id=${teacherId}`);
        const schedules    = schedulesRes.rows || [];

        // Bước 3: Filter đúng ngày hôm nay
        const todayDbDay = jsDayToDb(new Date().getDay());
        const data = schedules.filter(s => Number(s.day_of_week) === todayDbDay);

        setTodayClasses(data);
        checkUpcomingClasses(data, 'teacher', user?.name);
      } catch (err) {
        console.error(err.message);
      }
    };

    if (user?.id) fetchData();
  }, [user]);

  // Nhắc lịch mỗi phút
  useEffect(() => {
    if (!todayClasses.length) return;
    const interval = setInterval(() => {
      checkUpcomingClasses(todayClasses, 'teacher', user?.name);
    }, 60000);
    return () => clearInterval(interval);
  }, [todayClasses, user]);

  // Đếm học viên hôm nay từ data thật
  const totalStudents = todayClasses.reduce((sum, c) => {
    if (c.class_type === '1v1') return sum + 1;
    return sum + (Number(c.student_count) || 0);
  }, 0);

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
          <p className="text-3xl font-bold text-blue-600">{totalStudents}</p>
          <p className="text-sm text-gray-500 mt-1">Học viên hôm nay</p>
        </div>
      </div>

      <Card title="Lịch dạy hôm nay">
        {todayClasses.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Hôm nay không có lịch dạy 🎉</p>
        ) : (
          <div className="flex flex-col gap-3">
            {[...todayClasses]
              .sort((a, b) => a.time_start?.localeCompare(b.time_start))
              .map((cls) => {
                const timeLeft = getTimeUntil(cls.time_start?.slice(0, 5));
                const label = cls.class_type === '1v1' && cls.student_name
                  ? cls.student_name
                  : cls.student_count
                    ? `Nhóm ${cls.student_count} học viên`
                    : cls.class_name;
                return (
                  <div key={cls.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="text-center min-w-[52px]">
                      <p className="text-sm font-bold text-primary-600">{cls.time_start?.slice(0, 5)}</p>
                      <p className="text-xs text-gray-400">{cls.time_end?.slice(0, 5)}</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{cls.class_name}</p>
                      <p className="text-xs text-gray-500">{label} · {cls.room_name}</p>
                      {timeLeft && (
                        <p className="text-xs text-orange-500 mt-0.5 font-medium">⏰ {timeLeft}</p>
                      )}
                    </div>
                    <Badge
                      label={cls.class_type === '1v1' ? '1 kèm 1' : 'Nhóm'}
                      variant={cls.class_type === '1v1' ? 'blue' : 'green'}
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