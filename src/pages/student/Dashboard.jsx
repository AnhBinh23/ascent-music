import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import AnnouncementBanner from '../../components/shared/AnnouncementBanner';
import { useAuth } from '../../context/AuthContext';
import { checkUpcomingClasses, getTimeUntil } from '../../services/notificationService';

const SAMPLE_SCHEDULE = [
  { id: 1, name: 'Piano cơ bản 01', timeStart: '08:00', timeEnd: '09:00', room: 'Phòng 1', teacher: 'Nguyễn Thị Mai' },
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const [myInvoices, setMyInvoices] = useState([]);

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Lấy hóa đơn của học viên này
  useEffect(() => {
    const all = JSON.parse(localStorage.getItem('invoices_v2') || '[]');
    const mine = all.filter(inv =>
      inv.student?.name?.toLowerCase() === user?.name?.toLowerCase() ||
      inv.student?.email?.toLowerCase() === user?.email?.toLowerCase() ||
      inv.student?.phone === user?.phone
    );
    setMyInvoices(mine);
  }, [user]);

  // Nhắc lịch học
  useEffect(() => {
    checkUpcomingClasses(SAMPLE_SCHEDULE, 'student', user?.name);
    const interval = setInterval(() => {
      checkUpcomingClasses(SAMPLE_SCHEDULE, 'student', user?.name);
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const unpaidInvoices = myInvoices.filter(i => i.status === 'unpaid');
  const paidInvoices   = myInvoices.filter(i => i.status === 'paid');
  const totalPaid      = paidInvoices.reduce((sum, i) => sum + i.totalFee, 0);
  const timeLeft       = getTimeUntil(SAMPLE_SCHEDULE[0]?.timeStart);

  return (
    <MainLayout title="Tổng quan">
      <AnnouncementBanner />

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Xin chào, {user?.name}! 🎵</h2>
        <p className="text-sm text-gray-500 mt-1">{today}</p>
      </div>

      {/* Cảnh báo học phí chưa đóng */}
      {unpaidInvoices.length > 0 && (
        <div className="mb-5 p-4 bg-red-50 rounded-2xl border border-red-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-red-700">Bạn có {unpaidInvoices.length} hóa đơn chưa thanh toán!</p>
              {unpaidInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between mt-2 p-2 bg-red-100 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-red-700">{inv.course.instrument}</p>
                    <p className="text-xs text-red-500">
                      {inv.course.billingType === 'session'
                        ? `${inv.course.sessions} buổi`
                        : `${inv.course.duration} tháng`}
                      · {inv.createdDate}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-red-700">{inv.totalFee.toLocaleString('vi-VN')}đ</p>
                </div>
              ))}
              <p className="text-xs text-red-500 mt-2">
                📞 Vui lòng liên hệ trung tâm để thanh toán: <span className="font-medium">0901 234 567</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card text-center">
          <p className={`text-3xl font-bold ${unpaidInvoices.length > 0 ? 'text-red-500' : 'text-green-600'}`}>
            {unpaidInvoices.length > 0 ? `${unpaidInvoices.length} chưa đóng` : '✅ Đã đóng'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Học phí</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-orange-600">{totalPaid.toLocaleString('vi-VN')}đ</p>
          <p className="text-sm text-gray-500 mt-1">Tổng đã đóng</p>
        </div>
      </div>

      {/* Buổi học tiếp theo */}
      <Card title="Buổi học tiếp theo" className="mb-4">
        <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl">
          <div className="text-3xl">🎹</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">{SAMPLE_SCHEDULE[0].name}</p>
            <p className="text-sm text-gray-500">{SAMPLE_SCHEDULE[0].teacher} · {SAMPLE_SCHEDULE[0].room}</p>
            <p className="text-sm text-primary-600 font-medium mt-1">
              Hôm nay · {SAMPLE_SCHEDULE[0].timeStart}
            </p>
            {timeLeft && <p className="text-xs text-orange-500 font-medium mt-0.5">⏰ {timeLeft}</p>}
          </div>
        </div>
      </Card>

      {/* Lịch sử thanh toán */}
      {paidInvoices.length > 0 && (
        <Card title="Lịch sử học phí đã đóng">
          <div className="flex flex-col gap-2 mt-2">
            {paidInvoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">{inv.course.instrument}</p>
                  <p className="text-xs text-gray-500">
                    {inv.course.billingType === 'session'
                      ? `${inv.course.sessions} buổi`
                      : `${inv.course.duration} tháng`}
                    · Đóng: {inv.paidDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{inv.totalFee.toLocaleString('vi-VN')}đ</p>
                  <Badge label="✅ Đã đóng" variant="green" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </MainLayout>
  );
};

export default StudentDashboard;