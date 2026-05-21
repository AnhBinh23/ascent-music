import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-toastify';

const SAMPLE_TODAY_CLASSES = [
  { id: 'LH001', name: 'Piano cơ bản 01', timeStart: '08:00', timeEnd: '09:00', room: 'Phòng 1', type: '1v1',   students: ['Nguyễn Văn An'],                          salaryPerSession: 200000 },
  { id: 'LH002', name: 'Guitar nhóm 01',  timeStart: '10:00', timeEnd: '11:00', room: 'Phòng 2', type: 'group', students: ['Trần Thị Bình', 'Lê Minh Châu'],           salaryPerSession: 180000 },
  { id: 'LH003', name: 'Piano nâng cao',  timeStart: '14:00', timeEnd: '15:00', room: 'Phòng 1', type: '1v1',   students: ['Hoàng Văn Em'],                           salaryPerSession: 220000 },
];

const SALARY_HISTORY = [
  { date: '20/05/2025', sessions: 3, total: 600000 },
  { date: '19/05/2025', sessions: 2, total: 400000 },
  { date: '17/05/2025', sessions: 3, total: 580000 },
  { date: '16/05/2025', sessions: 2, total: 400000 },
];

const getStatus = (timeStart, timeEnd, checkedIn) => {
  const now = new Date();
  const [sh, sm] = timeStart.split(':').map(Number);
  const [eh, em] = timeEnd.split(':').map(Number);
  const start  = new Date(); start.setHours(sh, sm, 0);
  const end    = new Date(); end.setHours(eh, em, 0);
  const remind = new Date(end.getTime() + 15 * 60000);
  if (checkedIn)      return 'done';
  if (now >= remind)  return 'overdue';
  if (now >= end)     return 'remind';
  if (now >= start)   return 'active';
  return 'upcoming';
};

const STATUS_INFO = {
  done:     { label: 'Đã chấm công',  variant: 'green',  icon: '✅', bg: 'bg-green-50  border-green-100'  },
  active:   { label: 'Đang diễn ra',  variant: 'blue',   icon: '🔵', bg: 'bg-blue-50   border-blue-100'   },
  remind:   { label: 'Chờ chấm công', variant: 'orange', icon: '⏰', bg: 'bg-orange-50 border-orange-100' },
  overdue:  { label: 'Quá hạn chấm',  variant: 'red',    icon: '❌', bg: 'bg-red-50    border-red-100'    },
  upcoming: { label: 'Sắp diễn ra',   variant: 'gray',   icon: '🕐', bg: 'bg-gray-50   border-gray-100'   },
};

const CheckIn = () => {
  const { user } = useAuth();
  const { addNotification } = useApp();
  const today   = new Date().toISOString().split('T')[0];
  const [checkedIn, setCheckedIn] = useState({});
  const [notes, setNotes]         = useState({});
  const [loading, setLoading]     = useState({});
  const [reminded, setReminded]   = useState({});
  const [now, setNow]             = useState(new Date());
  const [showSalary, setShowSalary] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`checkin_${user?.id}_${today}`) || '{}');
    setCheckedIn(saved);
  }, [user, today]);

  useEffect(() => {
    SAMPLE_TODAY_CLASSES.forEach(cls => {
      if (checkedIn[cls.id] || reminded[cls.id]) return;
      const [eh, em] = cls.timeEnd.split(':').map(Number);
      const end    = new Date(); end.setHours(eh, em, 0);
      const remind = new Date(end.getTime() + 15 * 60000);
      if (now >= remind) {
        toast.warn(`⏰ Bạn chưa chấm công buổi "${cls.name}"!`, {
          autoClose: false, toastId: `remind_${cls.id}`,
        });
        setReminded(prev => ({ ...prev, [cls.id]: true }));
      }
    });
  }, [now, checkedIn, reminded]);

  const handleCheckIn = async (cls) => {
    setLoading(prev => ({ ...prev, [cls.id]: true }));
    await new Promise(r => setTimeout(r, 700));

    const checkInTime  = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const salaryEarned = cls.salaryPerSession;
    const newCheckedIn = {
      ...checkedIn,
      [cls.id]: {
        time:          checkInTime,
        note:          notes[cls.id] || '',
        salaryEarned,
        className:     cls.name,
        type:          cls.type,
      }
    };

    localStorage.setItem(`checkin_${user?.id}_${today}`, JSON.stringify(newCheckedIn));
    setCheckedIn(newCheckedIn);

    // Gửi thông báo admin
    const adminNotifs = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
    adminNotifs.unshift({
      id:          Date.now(),
      type:        'checkin',
      teacherName: user?.name,
      teacherId:   user?.id,
      className:   cls.name,
      time:        checkInTime,
      date:        today,
      salaryEarned,
      note:        notes[cls.id] || '',
      read:        false,
      createdAt:   new Date().toISOString(),
    });
    localStorage.setItem('admin_notifications', JSON.stringify(adminNotifs));

    addNotification({
      title:   `${user?.name} đã chấm công`,
      message: `Buổi ${cls.name} lúc ${checkInTime}`,
      type:    'checkin',
    });

    setLoading(prev => ({ ...prev, [cls.id]: false }));
    setShowSalary(cls.id); // Hiện popup lương

    toast.success(`✅ Chấm công thành công! Lương buổi này: ${salaryEarned.toLocaleString('vi-VN')}đ`);
  };

  // Tính tổng lương hôm nay
  const todaySalary  = Object.values(checkedIn).reduce((sum, c) => sum + (c.salaryEarned || 0), 0);
  const totalDone    = Object.keys(checkedIn).length;
  const totalClasses = SAMPLE_TODAY_CLASSES.length;

  // Tổng lương tuần
  const weeklySalary = SALARY_HISTORY.reduce((sum, h) => sum + h.total, 0) + todaySalary;

  return (
    <MainLayout title="Chấm công">

      {/* Tổng quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{totalClasses}</p>
          <p className="text-xs text-gray-500 mt-1">Buổi hôm nay</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{totalDone}</p>
          <p className="text-xs text-gray-500 mt-1">Đã chấm công</p>
        </div>
        <div className="card text-center col-span-2">
          <p className="text-2xl font-bold text-orange-500">
            {todaySalary.toLocaleString('vi-VN')}đ
          </p>
          <p className="text-xs text-gray-500 mt-1">💰 Lương đã kiếm hôm nay</p>
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
        {totalDone === totalClasses && totalClasses > 0 && (
          <Badge label="✅ Hoàn tất hôm nay" variant="green" />
        )}
      </div>

      {/* Danh sách buổi học */}
      <div className="flex flex-col gap-4 mb-6">
        {SAMPLE_TODAY_CLASSES.map(cls => {
          const status   = getStatus(cls.timeStart, cls.timeEnd, checkedIn[cls.id]);
          const info     = STATUS_INFO[status];
          const isDone   = status === 'done';
          const canCheck = ['active', 'remind', 'overdue'].includes(status);
          const checkin  = checkedIn[cls.id];

          return (
            <Card key={cls.id} className={isDone ? 'border-green-200' : ''}>
              <div className="flex items-start gap-4">

                {/* Giờ */}
                <div className={`min-w-[64px] p-3 rounded-2xl text-center border ${info.bg}`}>
                  <p className="text-sm font-bold text-gray-800">{cls.timeStart}</p>
                  <div className="w-full h-px bg-gray-200 my-1" />
                  <p className="text-xs text-gray-500">{cls.timeEnd}</p>
                </div>

                {/* Thông tin */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-800">{cls.name}</p>
                    <Badge label={`${info.icon} ${info.label}`} variant={info.variant} />
                    <Badge label={cls.type === '1v1' ? '1 kèm 1' : 'Nhóm'} variant={cls.type === '1v1' ? 'blue' : 'green'} />
                  </div>
                  <p className="text-sm text-gray-500">{cls.room} · {cls.students.join(', ')}</p>

                  {/* Lương buổi */}
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-400">💵 Lương buổi này:</span>
                    <span className="text-xs font-semibold text-orange-600">
                      {cls.salaryPerSession.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  {/* Đã chấm công */}
                  {isDone && (
                    <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700">
                            ✅ Chấm công lúc {checkin?.time}
                          </p>
                          {checkin?.note && (
                            <p className="text-xs text-green-600 mt-0.5">📝 {checkin.note}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-green-600">Lương nhận được</p>
                          <p className="text-lg font-bold text-green-700">
                            +{checkin?.salaryEarned?.toLocaleString('vi-VN')}đ
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form chấm công */}
                  {canCheck && !isDone && (
                    <div className="mt-3">
                      <input type="text"
                        placeholder="Ghi chú (không bắt buộc)..."
                        value={notes[cls.id] || ''}
                        onChange={e => setNotes(prev => ({ ...prev, [cls.id]: e.target.value }))}
                        className="input-field text-sm" />
                    </div>
                  )}

                  {status === 'upcoming' && (
                    <p className="text-xs text-gray-400 mt-2 italic">
                      Chức năng chấm công mở khi bắt đầu buổi học
                    </p>
                  )}
                </div>

                {/* Nút chấm công */}
                {canCheck && !isDone && (
                  <Button loading={loading[cls.id]} onClick={() => handleCheckIn(cls)}
                    icon="✅" className="min-w-[110px] flex-shrink-0">
                    Chấm công
                  </Button>
                )}
              </div>

              {/* Popup lương sau khi chấm */}
              {showSalary === cls.id && isDone && (
                <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-orange-700">🎉 Tuyệt vời! Đã ghi nhận lương</p>
                      <p className="text-xs text-orange-600 mt-0.5">{cls.name} · {checkedIn[cls.id]?.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">
                        +{cls.salaryPerSession.toLocaleString('vi-VN')}đ
                      </p>
                      <p className="text-xs text-orange-500">Lương buổi này</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-orange-200 flex justify-between">
                    <p className="text-xs text-orange-600">Tổng lương hôm nay:</p>
                    <p className="text-sm font-bold text-orange-700">{todaySalary.toLocaleString('vi-VN')}đ</p>
                  </div>
                  <button onClick={() => setShowSalary(null)}
                    className="mt-2 text-xs text-orange-400 hover:text-orange-600 w-full text-center">
                    Đóng ✕
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Tổng kết lương */}
      <Card title="💰 Tổng kết lương" subtitle="Tuần này">
        <div className="grid grid-cols-2 gap-4 mt-3 mb-4">
          <div className="p-4 bg-orange-50 rounded-2xl text-center border border-orange-100">
            <p className="text-xs text-orange-600 mb-1">Hôm nay</p>
            <p className="text-2xl font-bold text-orange-600">{todaySalary.toLocaleString('vi-VN')}đ</p>
            <p className="text-xs text-orange-500 mt-1">{totalDone} buổi đã dạy</p>
          </div>
          <div className="p-4 bg-green-50 rounded-2xl text-center border border-green-100">
            <p className="text-xs text-green-600 mb-1">Tuần này</p>
            <p className="text-2xl font-bold text-green-600">{weeklySalary.toLocaleString('vi-VN')}đ</p>
            <p className="text-xs text-green-500 mt-1">
              {SALARY_HISTORY.reduce((s, h) => s + h.sessions, 0) + totalDone} buổi
            </p>
          </div>
        </div>

        {/* Lịch sử theo ngày */}
        <div className="flex flex-col gap-2">
          {/* Hôm nay */}
          {totalDone > 0 && (
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Hôm nay</p>
                  <p className="text-xs text-gray-500">{totalDone} buổi đã chấm công</p>
                </div>
              </div>
              <p className="text-sm font-bold text-orange-600">
                {todaySalary.toLocaleString('vi-VN')}đ
              </p>
            </div>
          )}

          {/* Các ngày trước */}
          {SALARY_HISTORY.map((h, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{h.date}</p>
                  <p className="text-xs text-gray-500">{h.sessions} buổi</p>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-700">
                {h.total.toLocaleString('vi-VN')}đ
              </p>
            </div>
          ))}
        </div>
      </Card>
    </MainLayout>
  );
};

export default CheckIn;