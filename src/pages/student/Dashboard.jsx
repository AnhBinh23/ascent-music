import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { checkUpcomingClasses, getTimeUntil } from '../../services/notificationService';

const SAMPLE_SCHEDULE = [
  {
    id: 1,
    name: 'Piano cơ bản 01',
    timeStart: '08:00',
    timeEnd: '09:00',
    room: 'Phòng 1',
    teacher: 'Nguyễn Thị Mai',
  },
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data] = useState({
    nextClass: {
      className: 'Piano cơ bản',
      timeStart: '08:00',
      date: 'Hôm nay',
      teacher: 'Nguyễn Thị Mai',
      room: 'Phòng 1',
    },
    attendance:    90,
    tuitionStatus: 'paid',
    progress:      'Trung cấp',
  });

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Kiểm tra nhắc lịch khi vào trang
  useEffect(() => {
    checkUpcomingClasses(SAMPLE_SCHEDULE, 'student', user?.name);

    // Kiểm tra mỗi phút
    const interval = setInterval(() => {
      checkUpcomingClasses(SAMPLE_SCHEDULE, 'student', user?.name);
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const timeLeft = getTimeUntil(data.nextClass.timeStart);

  return (
    <MainLayout title="Tổng quan">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Xin chào, {user?.name}! 🎵</h2>
        <p className="text-sm text-gray-500 mt-1">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{data.attendance}%</p>
          <p className="text-sm text-gray-500 mt-1">Chuyên cần</p>
        </div>
        <div className="card text-center">
          <Badge label={data.progress} variant="blue" />
          <p className="text-sm text-gray-500 mt-2">Trình độ hiện tại</p>
        </div>
      </div>

      {/* Buổi học tiếp theo */}
      <Card title="Buổi học tiếp theo" className="mb-4">
        <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl">
          <div className="text-3xl">🎹</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">{data.nextClass.className}</p>
            <p className="text-sm text-gray-500">
              {data.nextClass.teacher} · {data.nextClass.room}
            </p>
            <p className="text-sm text-primary-600 font-medium mt-1">
              {data.nextClass.date} · {data.nextClass.timeStart}
            </p>
            {timeLeft && (
              <p className="text-xs text-orange-500 font-medium mt-1">
                ⏰ {timeLeft}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Học phí */}
      <Card title="Học phí tháng này">
        <div className={`flex items-center gap-3 p-4 rounded-xl
          ${data.tuitionStatus === 'paid' ? 'bg-green-50' : 'bg-red-50'}`}>
          <span className="text-2xl">
            {data.tuitionStatus === 'paid' ? '✅' : '⚠️'}
          </span>
          <div>
            <p className={`font-medium
              ${data.tuitionStatus === 'paid' ? 'text-green-700' : 'text-red-700'}`}>
              {data.tuitionStatus === 'paid'
                ? 'Đã đóng học phí tháng này'
                : 'Chưa đóng học phí tháng này'}
            </p>
            <p className={`text-sm mt-0.5
              ${data.tuitionStatus === 'paid' ? 'text-green-500' : 'text-red-500'}`}>
              {data.tuitionStatus === 'paid'
                ? 'Cảm ơn bạn!'
                : 'Vui lòng liên hệ trung tâm'}
            </p>
          </div>
        </div>
      </Card>
    </MainLayout>
  );
};

export default StudentDashboard;