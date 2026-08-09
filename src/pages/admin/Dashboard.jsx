import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';

const fmt = n => Number(n || 0).toLocaleString('vi-VN') + 'đ';
const DAY_NAMES = { 1:'CN', 2:'T2', 3:'T3', 4:'T4', 5:'T5', 6:'T6', 7:'T7' };

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats]               = useState({ students:0, teachers:0, classes:0 });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [unpaid, setUnpaid]             = useState([]);
  const [nearEnd, setNearEnd]           = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsRes, teachersRes, classesRes, schedRes, unpaidRes, progressRes] = await Promise.all([
          api.get('/students'),
          api.get('/teachers'),
          api.get('/classes'),
          api.get('/schedules'),
          api.get('/tuition'),
          api.get('/attendance/course-progress'),
        ]);

        const activeStudents = (studentsRes.rows || []).filter(s => s.status === 'active');
        const activeClasses  = (classesRes.rows || []).filter(c => c.status === 'Đang học');
        setStats({
          students: activeStudents.length,
          teachers: (teachersRes.rows || []).length,
          classes:  activeClasses.length,
        });

        const todayDow = new Date().getDay() === 0 ? 1 : new Date().getDay() + 1;
        setTodaySchedule((schedRes.rows || []).filter(s => Number(s.day_of_week) === todayDow));

        setUnpaid((unpaidRes.rows || []).filter(t => t.status !== 'Đã thanh toán'));
        setNearEnd((progressRes.rows || []).filter(p => p.total_sessions > 0 && p.attended >= p.total_sessions - 3));
      } catch (err) { console.error(err.message); }
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  if (loading) return <MainLayout title="Tổng quan"><p className="text-center text-gray-400 py-20">Đang tải...</p></MainLayout>;

  return (
    <MainLayout title="Tổng quan">
      {/* Thống kê */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/admin/students')}>
          <p className="text-3xl mb-1">👨‍🎓</p>
          <p className="text-2xl font-bold text-primary-600">{stats.students}</p>
          <p className="text-xs text-gray-500 mt-1">Học viên</p>
        </div>
        <div className="card text-center cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/admin/teachers')}>
          <p className="text-3xl mb-1">👨‍🏫</p>
          <p className="text-2xl font-bold text-green-600">{stats.teachers}</p>
          <p className="text-xs text-gray-500 mt-1">Giáo viên</p>
        </div>
        <div className="card text-center cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/admin/classes')}>
          <p className="text-3xl mb-1">🎵</p>
          <p className="text-2xl font-bold text-orange-600">{stats.classes}</p>
          <p className="text-xs text-gray-500 mt-1">Lớp đang học</p>
        </div>
      </div>

      {/* Nhắc nhở */}
      {(unpaid.length > 0 || nearEnd.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {unpaid.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate('/admin/tuition')}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-red-700">💸 Chưa đóng học phí</p>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">{unpaid.length}</span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {unpaid.slice(0, 10).map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 font-medium truncate">{t.student_name}</span>
                    <span className="text-red-600 font-bold flex-shrink-0">{fmt(Number(t.amount||0) - Number(t.paid||0))}</span>
                  </div>
                ))}
                {unpaid.length > 10 && <p className="text-xs text-red-400 text-center mt-1">...và {unpaid.length - 10} HV khác</p>}
              </div>
            </div>
          )}
          {nearEnd.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate('/admin/attendance')}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-orange-700">⏰ Sắp hết khóa</p>
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold">{nearEnd.length}</span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {nearEnd.slice(0, 10).map((p, i) => {
                  const remaining = Math.max(0, (p.total_sessions||0) - (p.attended||0));
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 font-medium truncate">{p.student_name}</span>
                      <span className="text-orange-600 font-bold flex-shrink-0">còn {remaining} buổi</span>
                    </div>
                  );
                })}
                {nearEnd.length > 10 && <p className="text-xs text-orange-400 text-center mt-1">...và {nearEnd.length - 10} HV khác</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lịch hôm nay */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-700">📅 Lịch dạy hôm nay — {new Date().toLocaleDateString('vi-VN', { weekday:'long', day:'numeric', month:'long' })}</p>
          <span className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded-full font-bold">{todaySchedule.length} buổi</span>
        </div>
        {todaySchedule.length === 0 ? (
          <p className="text-center text-gray-400 py-6">Hôm nay không có lịch dạy</p>
        ) : (
          <div className="flex flex-col gap-2">
            {todaySchedule.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-sm font-bold text-primary-700">
                    {String(s.time_start||'').slice(0,5)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{s.class_name}</p>
                    <p className="text-xs text-gray-500">{s.teacher_name} · {s.room_name || 'Chưa xếp phòng'}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{String(s.time_start||'').slice(0,5)} – {String(s.time_end||'').slice(0,5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Truy cập nhanh */}
      <div className="card">
        <p className="text-sm font-bold text-gray-700 mb-3">⚡ Truy cập nhanh</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon:'✅', label:'Điểm danh',   path:'/admin/attendance' },
            { icon:'💰', label:'Học phí',      path:'/admin/tuition' },
            { icon:'📊', label:'Import Excel', path:'/admin/import-excel' },
            { icon:'💼', label:'Lương GV',     path:'/admin/salary' },
            { icon:'📋', label:'Chấm công',    path:'/admin/checkin' },
            { icon:'🎓', label:'Lớp học',      path:'/admin/classes' },
            { icon:'📢', label:'Thông báo',    path:'/admin/notifications' },
            { icon:'🤖', label:'Trợ lý AI',    path:'/admin/ai' },
          ].map((item, i) => (
            <button key={i} onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl hover:bg-primary-50 hover:shadow-md transition-all">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium text-gray-600">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;