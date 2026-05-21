import React from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { toast } from 'react-toastify';

const SAMPLE = [
  { month: 'Tháng 1', revenue: 12000000, collected: 11500000, unpaid: 500000 },
  { month: 'Tháng 2', revenue: 15000000, collected: 15000000, unpaid: 0 },
  { month: 'Tháng 3', revenue: 13500000, collected: 12000000, unpaid: 1500000 },
  { month: 'Tháng 4', revenue: 17000000, collected: 16500000, unpaid: 500000 },
  { month: 'Tháng 5', revenue: 19500000, collected: 17000000, unpaid: 2500000 },
];

const TuitionReport = () => {
  const totalRevenue   = SAMPLE.reduce((s, r) => s + r.revenue, 0);
  const totalCollected = SAMPLE.reduce((s, r) => s + r.collected, 0);
  const totalUnpaid    = SAMPLE.reduce((s, r) => s + r.unpaid, 0);

  return (
    <MainLayout title="Báo cáo học phí">
      <div className="flex justify-end mb-5">
        <Button variant="secondary" icon="📥" onClick={() => toast.info('Xuất Excel sẽ kết nối Google Sheets!')}>
          Xuất Excel
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-xl font-bold text-blue-600">{totalRevenue.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-gray-500 mt-1">Tổng học phí</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-green-600">{totalCollected.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-gray-500 mt-1">Đã thu</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-red-500">{totalUnpaid.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-gray-500 mt-1">Còn thiếu</p>
        </div>
      </div>

      <Card title="Chi tiết theo tháng">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Tháng','Học phí dự kiến','Đã thu','Còn thiếu','Tỷ lệ thu'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE.map((row, i) => {
                const rate = Math.round((row.collected / row.revenue) * 100);
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.month}</td>
                    <td className="px-4 py-3 text-gray-600">{row.revenue.toLocaleString('vi-VN')}đ</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{row.collected.toLocaleString('vi-VN')}đ</td>
                    <td className="px-4 py-3 text-red-500">{row.unpaid > 0 ? `${row.unpaid.toLocaleString('vi-VN')}đ` : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${rate >= 90 ? 'bg-green-500' : rate >= 70 ? 'bg-orange-400' : 'bg-red-400'}`}
                            style={{ width: `${rate}%` }} />
                        </div>
                        <span className={`text-xs font-medium ${rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-orange-500' : 'text-red-500'}`}>{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </MainLayout>
  );
};

export default TuitionReport;