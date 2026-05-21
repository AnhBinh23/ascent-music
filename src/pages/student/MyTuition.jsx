import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

const STATUS_VARIANT = { 'Đã thanh toán': 'green', 'Chưa thanh toán': 'red', 'Thanh toán 1 phần': 'orange' };

const SAMPLE = [
  { month: '05/2025', amount: 800000, paid: 800000, status: 'Đã thanh toán',    method: 'Tiền mặt',     date: '2025-05-01' },
  { month: '04/2025', amount: 800000, paid: 800000, status: 'Đã thanh toán',    method: 'Chuyển khoản', date: '2025-04-02' },
  { month: '03/2025', amount: 800000, paid: 400000, status: 'Thanh toán 1 phần',method: 'Tiền mặt',     date: '2025-03-05' },
  { month: '02/2025', amount: 800000, paid: 0,      status: 'Chưa thanh toán',  method: '',             date: '' },
];

const MyTuition = () => {
  const { user } = useAuth();

  return (
    <MainLayout title="Học phí của tôi">
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">
            {SAMPLE.filter(s => s.status === 'Đã thanh toán').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Tháng đã đóng</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-500">
            {SAMPLE.filter(s => s.status !== 'Đã thanh toán').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Tháng chưa đóng</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {SAMPLE.map((item, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Tháng {item.month}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Học phí: <span className="font-medium">{item.amount.toLocaleString('vi-VN')}đ</span>
                </p>
                {item.method && <p className="text-xs text-gray-400 mt-0.5">{item.method} · {item.date}</p>}
              </div>
              <div className="text-right">
                <Badge label={item.status} variant={STATUS_VARIANT[item.status]} dot />
                {item.status === 'Thanh toán 1 phần' && (
                  <p className="text-xs text-orange-500 mt-1">
                    Còn: {(item.amount - item.paid).toLocaleString('vi-VN')}đ
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-2xl">
        <p className="text-sm text-blue-700">💡 Liên hệ trung tâm để thanh toán: <span className="font-medium">0901 234 567</span></p>
      </div>
    </MainLayout>
  );
};

export default MyTuition;