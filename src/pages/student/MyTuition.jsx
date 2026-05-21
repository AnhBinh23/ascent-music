import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

const MyTuition = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem('invoices_v2') || '[]');
    const mine = all.filter(inv =>
      inv.student?.name?.toLowerCase() === user?.name?.toLowerCase() ||
      inv.student?.email?.toLowerCase() === user?.email?.toLowerCase()
    );
    setInvoices(mine);
  }, [user]);

  const unpaid = invoices.filter(i => i.status === 'unpaid');
  const paid   = invoices.filter(i => i.status === 'paid');
  const total  = paid.reduce((sum, i) => sum + i.totalFee, 0);

  return (
    <MainLayout title="Học phí của tôi">

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-500">{unpaid.length}</p>
          <p className="text-xs text-gray-500 mt-1">Chưa đóng</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{paid.length}</p>
          <p className="text-xs text-gray-500 mt-1">Đã đóng</p>
        </div>
        <div className="card text-center">
          <p className="text-lg font-bold text-orange-600">{total.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-gray-500 mt-1">Tổng đã đóng</p>
        </div>
      </div>

      {/* Chưa thanh toán */}
      {unpaid.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-red-600 mb-2">⚠️ Cần thanh toán</p>
          <div className="flex flex-col gap-3">
            {unpaid.map(inv => (
              <Card key={inv.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800">{inv.course.instrument}</p>
                      <Badge label="⏳ Chưa thanh toán" variant="red" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {inv.course.billingType === 'session'
                        ? `${inv.course.sessions} buổi · ${inv.course.pricePerSession?.toLocaleString('vi-VN')}đ/buổi`
                        : `${inv.course.duration} tháng`}
                    </p>
                    <p className="text-xs text-gray-400">📅 {inv.course.startDate} → {inv.endDate}</p>
                    <p className="text-xs text-gray-400">Số HĐ: {inv.id} · Tạo: {inv.createdDate}</p>
                  </div>
                  <p className="text-xl font-bold text-red-500">{inv.totalFee.toLocaleString('vi-VN')}đ</p>
                </div>
                <div className="mt-3 p-3 bg-red-50 rounded-xl">
                  <p className="text-xs text-red-600">
                    📞 Liên hệ trung tâm để thanh toán: <span className="font-medium">0901 234 567</span>
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Lịch sử đã thanh toán */}
      <p className="text-sm font-semibold text-gray-700 mb-2">📋 Lịch sử thanh toán</p>
      {invoices.length === 0 ? (
        <Card>
          <p className="text-center text-gray-400 py-8">Chưa có hóa đơn nào</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {paid.map(inv => (
            <Card key={inv.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-800">{inv.course.instrument}</p>
                    <Badge label="✅ Đã thanh toán" variant="green" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {inv.course.billingType === 'session'
                      ? `${inv.course.sessions} buổi`
                      : `${inv.course.duration} tháng`}
                  </p>
                  <p className="text-xs text-gray-400">📅 {inv.course.startDate} → {inv.endDate}</p>
                  <p className="text-xs text-green-600 font-medium">
                    Đã đóng: {inv.paidDate} · {inv.paidMethod}
                  </p>
                  <p className="text-xs text-gray-400">Số HĐ: {inv.id}</p>
                </div>
                <p className="text-xl font-bold text-green-600">{inv.totalFee.toLocaleString('vi-VN')}đ</p>
              </div>
            </Card>
          ))}

          {/* Tổng cộng */}
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex justify-between items-center">
            <p className="font-semibold text-gray-700">💰 Tổng học phí đã đóng</p>
            <p className="text-2xl font-bold text-orange-600">{total.toLocaleString('vi-VN')}đ</p>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default MyTuition;