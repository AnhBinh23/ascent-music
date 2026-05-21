import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-toastify';

const SAMPLE_TODAY_CLASSES = [
  { id: 'LH001', name: 'Piano cơ bản 01', timeStart: '08:00', timeEnd: '09:00', room: 'Phòng 1', type: '1v1',   students: ['Nguyễn Văn An'] },
  { id: 'LH002', name: 'Guitar nhóm 01',  timeStart: '10:00', timeEnd: '11:00', room: 'Phòng 2', type: 'group', students: ['Trần Thị Bình', 'Lê Minh Châu'] },
  { id: 'LH003', name: 'Piano nâng cao',  timeStart: '14:00', timeEnd: '15:00', room: 'Phòng 1', type: '1v1',   students: ['Hoàng Văn Em'] },
];

const getStatusClass = (timeStart, timeEnd, checkedIn) => {
  const now = new Date();
  const [sh, sm] = timeStart.split(':').map(Number);
  const [eh, em] = timeEnd.split(':').map(Number);
  const start = new Date(); start.setHours(sh, sm, 0);
  const end   = new Date(); end.setHours(eh, em, 0);
  const remind = new Date(end.getTime() + 15 * 60000);

  if (checkedIn) return 'done';
  if (now >= remind) return 'overdue';
  if (now >= end)   return 'remind';
  if (now >= start) return 'active';
  return 'upcoming';
};

const STATUS_INFO = {
  done:     { label: 'Đã chấm công', variant: 'green',  icon: '✅', bg: 'bg-green-50' },
  active:   { label: 'Đang diễn ra', variant: 'blue',   icon: '🔵', bg: 'bg-blue-50' },
  remind:   { label: 'Chờ chấm công', variant: 'orange', icon: '⏰', bg: 'bg-orange-50' },
  overdue:  { label: 'Quá hạn chấm', variant: 'red',    icon: '❌', bg: 'bg-red-50' },
  upcoming: { label: 'Sắp diễn ra',  variant: 'gray',   icon: '🕐', bg: 'bg-gray-50' },
};

const CheckIn = () => {
  const { user } = useAuth();
  const { addNotification } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const [checkedIn, setCheckedIn]   = useState({});
  const [notes, setNotes]           = useState({});
  const [loading, setLoading]       = useState({});
  const [reminded, setReminded]     = useState({});
  const [now, setNow]               = useState(new Date());

  // Cập nhật giờ mỗi 30 giây
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Load dữ liệu đã chấm công từ localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`checkin_${user?.id}_${today}`) || '{}');
    setCheckedIn(saved);
  }, [user, today]);

  // Kiểm tra nhắc chấm công sau 15 phút
  useEffect(() => {
    SAMPLE_TODAY_CLASSES.forEach(cls => {
      if (checkedIn[cls.id] || reminded[cls.id]) return;
      const [eh, em] = cls.timeEnd.split(':').map(Number);
      const end     = new Date(); end.setHours(eh, em, 0);
      const remind  = new Date(end.getTime() + 15 * 60000);
      if (now >= remind) {
        toast.warn(`⏰ Bạn chưa chấm công buổi "${cls.name}" (${cls.timeStart}-${cls.timeEnd}). Vui lòng chấm công ngay!`, {
          autoClose: false,
          toastId: `remind_${cls.id}`,
        });
        setReminded(prev => ({ ...prev, [cls.id]: true }));
      }
    });
  }, [now, checkedIn, reminded]);

  const handleCheckIn = async (cls) => {
    setLoading(prev => ({ ...prev, [cls.id]: true }));
    await new Promise(r => setTimeout(r, 700));

    const checkInTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newCheckedIn = { ...checkedIn, [cls.id]: { time: checkInTime, note: notes[cls.id] || '' } };

    // Lưu vào localStorage
    localStorage.setItem(`checkin_${user?.id}_${today}`, JSON.stringify(newCheckedIn));
    setCheckedIn(newCheckedIn);

    // Gửi thông báo cho admin
    const adminNotifs = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
    adminNotifs.unshift({
      id: Date.now(),
      type: 'checkin',
      teacherName: user?.name,
      teacherId: user?.id,
      className: cls.name,
      time: checkInTime,
      date: today,
      note: notes[cls.id] || '',
      read: false,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('admin_notifications', JSON.stringify(adminNotifs));

    // Thêm vào notification context
    addNotification({
      title: `${user?.name} đã chấm công`,
      message: `Buổi ${cls.name} lúc ${checkInTime}`,
      type: 'checkin',
    });

    toast.success(`✅ Chấm công thành công lúc ${checkInTime}!`);
    setLoading(prev => ({ ...prev, [cls.id]: false }));
  };

  const totalDone     = Object.keys(checkedIn).length;
  const totalClasses  = SAMPLE_TODAY_CLASSES.length;

  return (
    <MainLayout title="Chấm công">
      {/* Tổng quan */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{totalClasses}</p>
          <p className="text-xs text-gray-500 mt-1">Buổi hôm nay</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{totalDone}</p>
          <p className="text-xs text-gray-500 mt-1">Đã chấm công</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-500">{totalClasses - totalDone}</p>
          <p className="text-xs text-gray-500 mt-1">Chưa chấm</p>
        </div>
      </div>

      {/* Ngày & giờ hiện tại */}
      <div className="flex items-center gap-3 mb-5 p-4 bg-primary-50 rounded-2xl border border-primary-100">
        <span className="text-2xl">🕐</span>
        <div>
          <p className="font-semibold text-primary-700">
            {now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-primary-500">
            {now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {totalDone === totalClasses && totalClasses > 0 && (
          <div className="ml-auto">
            <Badge label="✅ Đã chấm công tất cả" variant="green" />
          </div>
        )}
      </div>

      {/* Danh sách buổi học */}
      <div className="flex flex-col gap-4">
        {SAMPLE_TODAY_CLASSES.map(cls => {
          const status   = getStatusClass(cls.timeStart, cls.timeEnd, checkedIn[cls.id]);
          const info     = STATUS_INFO[status];
          const isDone   = status === 'done';
          const canCheck = ['active', 'remind', 'overdue'].includes(status);

          return (
            <Card key={cls.id} className={isDone ? 'border-green-200' : ''}>
              <div className={`flex items-start justify-between gap-4 p-1`}>
                <div className="flex items-start gap-4 flex-1">
                  {/* Thời gian */}
                  <div className={`min-w-[64px] p-3 rounded-2xl text-center ${info.bg}`}>
                    <p className="text-sm font-bold text-gray-800">{cls.timeStart}</p>
                    <div className="w-full h-px bg-gray-200 my-1" />
                    <p className="text-xs text-gray-500">{cls.timeEnd}</p>
                  </div>

                  {/* Thông tin buổi học */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-800">{cls.name}</p>
                      <Badge label={info.icon + ' ' + info.label} variant={info.variant} />
                    </div>
                    <p className="text-sm text-gray-500">{cls.room}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cls.type === '1v1' ? '1 kèm 1' : 'Nhóm'} · {cls.students.join(', ')}
                    </p>

                    {/* Đã chấm công */}
                    {isDone && (
                      <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-sm font-medium text-green-700">
                          ✅ Đã chấm công lúc {checkedIn[cls.id]?.time}
                        </p>
                        {checkedIn[cls.id]?.note && (
                          <p className="text-xs text-green-600 mt-0.5">
                            Ghi chú: {checkedIn[cls.id].note}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Form chấm công */}
                    {canCheck && !isDone && (
                      <div className="mt-3 flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Ghi chú (không bắt buộc)..."
                          value={notes[cls.id] || ''}
                          onChange={e => setNotes(prev => ({ ...prev, [cls.id]: e.target.value }))}
                          className="input-field text-sm"
                        />
                      </div>
                    )}

                    {/* Chưa đến giờ */}
                    {status === 'upcoming' && (
                      <p className="text-xs text-gray-400 mt-2 italic">
                        Chức năng chấm công sẽ mở khi bắt đầu buổi học
                      </p>
                    )}
                  </div>
                </div>

                {/* Nút chấm công */}
                {canCheck && !isDone && (
                  <Button
                    loading={loading[cls.id]}
                    onClick={() => handleCheckIn(cls)}
                    icon="✅"
                    className="min-w-[120px]"
                  >
                    Chấm công
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Lịch sử chấm công */}
      <Card title="Lịch sử chấm công tuần này" className="mt-5">
        <div className="flex flex-col gap-2 mt-2">
          {[
            { date: '20/05/2025', sessions: 3, done: 3 },
            { date: '19/05/2025', sessions: 2, done: 2 },
            { date: '17/05/2025', sessions: 3, done: 2 },
            { date: '16/05/2025', sessions: 2, done: 2 },
          ].map((h, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-lg">{h.done === h.sessions ? '✅' : '⚠️'}</span>
                <p className="text-sm font-medium text-gray-700">{h.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${h.done === h.sessions ? 'text-green-600' : 'text-orange-500'}`}>
                  {h.done}/{h.sessions} buổi
                </span>
                <Badge
                  label={h.done === h.sessions ? 'Đầy đủ' : 'Thiếu ' + (h.sessions - h.done)}
                  variant={h.done === h.sessions ? 'green' : 'orange'}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </MainLayout>
  );
};

export default CheckIn;