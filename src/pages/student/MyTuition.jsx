import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const STATUS_LABEL = {
  'Đã thanh toán':    { label: '✅ Đã thanh toán',    variant: 'green'  },
  'Chưa thanh toán':  { label: '⏳ Chưa thanh toán',  variant: 'red'    },
  'Thanh toán 1 phần':{ label: '🔶 Thanh toán 1 phần', variant: 'orange' },
};

const MyTuition = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Bước 1: Lấy students.id từ user.id
        const studentRes = await api.get(`/students/by-user/${user?.id}`);
        const studentId  = studentRes?.row?.id;
        if (!studentId) return;

        // Bước 2: Lấy tất cả tuition filter theo student_id
        const res  = await api.get('/tuition');
        const all  = res.rows || [];
        const mine = all.filter(t => t.student_id === studentId);
        setInvoices(mine);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) load();
  }, [user]);

  const unpaid  = invoices.filter(i => i.status !== 'Đã thanh toán');
  const paid    = invoices.filter(i => i.status === 'Đã thanh toán');
  const totalPaid = paid.reduce((sum, i) => sum + Number(i.paid || 0), 0);
  const totalDebt = unpaid.reduce((sum, i) => sum + (Number(i.amount||0) - Number(i.paid||0)), 0);

  if (loading) return (
    <MainLayout title="Học phí của tôi">
      <div className="text-center py-16 text-gray-400">Đang tải...</div>
    </MainLayout>
  );

  return (
    <MainLayout title="Học phí của tôi">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-500">{unpaid.length}</p>
          <p className="text-xs text-gray-500 mt-1">Chưa thanh toán đủ</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{paid.length}</p>
          <p className="text-xs text-gray-500 mt-1">Đã thanh toán</p>
        </div>
        {totalDebt > 0 && (
          <div className="card text-center col-span-2 bg-red-50 border border-red-100">
            <p className="text-xl font-bold text-red-600">{totalDebt.toLocaleString('vi-VN')}đ</p>
            <p className="text-xs text-red-500 mt-1">⚠️ Tổng còn nợ</p>
          </div>
        )}
        <div className="card text-center col-span-2">
          <p className="text-xl font-bold text-orange-600">{totalPaid.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-gray-500 mt-1">💰 Tổng đã đóng</p>
        </div>
      </div>

      {/* Chưa thanh toán */}
      {unpaid.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-semibold text-red-600 mb-3">⚠️ Cần thanh toán</p>
          <div className="flex flex-col gap-3">
            {unpaid.map(inv => {
              const remaining = Number(inv.amount||0) - Number(inv.paid||0);
              const pct = inv.amount > 0 ? Math.round(Number(inv.paid||0)/Number(inv.amount)*100) : 0;
              const statusInfo = STATUS_LABEL[inv.status] || STATUS_LABEL['Chưa thanh toán'];
              return (
                <Card key={inv.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-800">{inv.class_name || inv.instrument}</p>
                        <Badge label={statusInfo.label} variant={statusInfo.variant} />
                      </div>
                      {inv.month && (
                        <p className="text-xs text-gray-500">
                          📅 Khóa {new Date(inv.month+'-01').toLocaleDateString('vi-VN',{month:'long',year:'numeric'})}
                        </p>
                      )}
                      {inv.sessions > 0 && (
                        <p className="text-xs text-gray-500">📚 {inv.sessions} buổi</p>
                      )}
                      {inv.note && (
                        <p className="text-xs text-gray-400">📝 {inv.note}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-red-500">{Number(inv.amount).toLocaleString('vi-VN')}đ</p>
                      {inv.paid > 0 && (
                        <p className="text-xs text-gray-400">Đã đóng: {Number(inv.paid).toLocaleString('vi-VN')}đ</p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {inv.paid > 0 && (
                    <div className="mt-2">
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full"
                          style={{width:`${pct}%`}}/>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{pct}% đã thanh toán</p>
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-red-50 rounded-xl">
                    <p className="text-sm font-semibold text-red-600">
                      Còn lại: {remaining.toLocaleString('vi-VN')}đ
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      📞 Liên hệ trung tâm để thanh toán: <span className="font-medium">0901 234 567</span>
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Lịch sử đã thanh toán */}
      <p className="text-sm font-semibold text-gray-700 mb-3">📋 Lịch sử thanh toán</p>
      {invoices.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-gray-400">Chưa có hóa đơn nào</p>
          </div>
        </Card>
      ) : paid.length === 0 ? (
        <Card>
          <p className="text-center text-gray-400 py-6">Chưa có hóa đơn nào được thanh toán đủ</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {paid.map(inv => (
            <Card key={inv.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-800">{inv.class_name || inv.instrument}</p>
                    <Badge label="✅ Đã thanh toán" variant="green" />
                  </div>
                  {inv.month && (
                    <p className="text-xs text-gray-500">
                      📅 Khóa {new Date(inv.month+'-01').toLocaleDateString('vi-VN',{month:'long',year:'numeric'})}
                    </p>
                  )}
                  {inv.sessions > 0 && (
                    <p className="text-xs text-gray-500">📚 {inv.sessions} buổi</p>
                  )}
                  {inv.method && (
                    <p className="text-xs text-green-600 font-medium">💳 {inv.method}</p>
                  )}
                  {inv.paid_date && (
                    <p className="text-xs text-gray-400">
                      Ngày đóng: {new Date(inv.paid_date).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                  {inv.note && (
                    <p className="text-xs text-gray-400">📝 {inv.note}</p>
                  )}
                </div>
                <p className="text-xl font-bold text-green-600 flex-shrink-0">
                  {Number(inv.paid||inv.amount).toLocaleString('vi-VN')}đ
                </p>
              </div>
            </Card>
          ))}

          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex justify-between items-center">
            <p className="font-semibold text-gray-700">💰 Tổng học phí đã đóng</p>
            <p className="text-2xl font-bold text-orange-600">{totalPaid.toLocaleString('vi-VN')}đ</p>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default MyTuition;