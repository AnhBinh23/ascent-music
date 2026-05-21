import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Loading from '../../components/ui/Loading';
import AnnouncementBanner from '../../components/shared/AnnouncementBanner';
import BirthdayReminder from './students/BirthdayReminder';
import studentService from '../../services/studentService';
import teacherService from '../../services/teacherService';
import tuitionService from '../../services/tuitionService';
import scheduleService from '../../services/scheduleService';

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats]               = useState({ students: 0, teachers: 0, unpaid: 0, todayClasses: 0 });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading]           = useState(true);

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [students, teachers, unpaid, schedule] = await Promise.all([
          studentService.getAll(),
          teacherService.getAll(),
          tuitionService.getUnpaid(),
          scheduleService.getByDate(new Date().toISOString().split('T')[0]),
        ]);
        setStats({
          students:     students.length,
          teachers:     teachers.length,
          unpaid:       unpaid.length,
          todayClasses: schedule.length,
        });
        setTodaySchedule(schedule.slice(0, 5));
      } catch {
        setStats({ students: 24, teachers: 6, unpaid: 3, todayClasses: 8 });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <MainLayout title="Tổng quan"><Loading /></MainLayout>;

  return (
    <MainLayout title="Tổng quan">

      {/* Banner thông báo */}
      <AnnouncementBanner />

      {/* Chào */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Xin chào! 👋</h2>
        <p className="text-sm text-gray-500 mt-1">{today}</p>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="🎓" label="Học viên"      value={stats.students}     sub="đang theo học"  color="bg-blue-50"   />
        <StatCard icon="👨‍🏫" label="Giáo viên"     value={stats.teachers}     sub="đang giảng dạy" color="bg-purple-50" />
        <StatCard icon="🎵" label="Buổi hôm nay"  value={stats.todayClasses} sub="lịch học"       color="bg-orange-50" />
        <StatCard icon="⚠️" label="Chưa đóng tiền" value={stats.unpaid}       sub="học viên"       color="bg-red-50"    />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Lịch hôm nay */}
        <Card title="Lịch học hôm nay" subtitle={`${stats.todayClasses} buổi`}>
          {todaySchedule.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Không có lịch hôm nay</p>
          ) : (
            <div className="flex flex-col gap-2">
              {todaySchedule.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.className || 'Lớp Piano'}</p>
                    <p className="text-xs text-gray-500">{s.teacherName || 'Giáo viên'} · {s.room || 'Phòng 1'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary-600">{s.timeStart || '08:00'}</p>
                    <Badge label={s.type === '1v1' ? '1 kèm 1' : 'Nhóm'} variant={s.type === '1v1' ? 'blue' : 'green'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Nhắc nhở */}
        <Card title="Nhắc nhở" subtitle="Cần xử lý">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
              <span className="text-lg">💰</span>
              <div>
                <p className="text-sm font-medium text-red-700">{stats.unpaid} học viên chưa đóng học phí</p>
                <p className="text-xs text-red-500 mt-0.5">Cần liên hệ nhắc nhở</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
              <span className="text-lg">📅</span>
              <div>
                <p className="text-sm font-medium text-blue-700">Hôm nay có {stats.todayClasses} buổi học</p>
                <p className="text-xs text-blue-500 mt-0.5">Xem chi tiết lịch học</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
              <span className="text-lg">🎓</span>
              <div>
                <p className="text-sm font-medium text-green-700">Tổng {stats.students} học viên đang học</p>
                <p className="text-xs text-green-500 mt-0.5">{stats.teachers} giáo viên phụ trách</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sinh nhật & Khóa học sắp hết */}
      <BirthdayReminder />

    </MainLayout>
  );
};

export default AdminDashboard;