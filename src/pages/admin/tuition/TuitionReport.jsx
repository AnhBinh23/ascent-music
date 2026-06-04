import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';

const TuitionReport = () => {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/tuition/report');
      setData(res.rows || []);
    } catch {
      toast.error('Không tải được báo cáo!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalRevenue   = data.reduce((s, r) => s + Number(r.revenue   || 0), 0);
  const totalCollected = data.reduce((s, r) => s + Number(r.collected || 0), 0);
  const totalUnpaid    = data.reduce((s, r) => s + Number(r.unpaid    || 0), 0);

  if (loading) return (
    <MainLayout title="Báo cáo học phí">
      <p className="text-center py-16 text-gray-400">Đang tải...</p>
    </MainLayout>
  );

  return (
    <MainLayout title="Báo cáo học phí">
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-xl font-bold text-blue-600">{fmt(totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">Tổng học phí</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-green-600">{fmt(totalCollected)}</p>
          <p className="text-xs text-gray-500 mt-1">Đã thu</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-red-500">{fmt(totalUnpaid)}</p>
          <p className="text-xs text-gray-500 mt-1">Còn thiếu</p>
        </div>
      </div>

      <Card title="Chi tiết theo tháng">
        {data.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-gray-400 text-sm">Chưa có dữ liệu học phí</p>
          </div>
        ) : (
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
                {data.map((row, i) => {
                  const revenue = Number(row.revenue || 0);
                  const rate = revenue > 0 ? Math.round((Number(row.collected || 0) / revenue) * 100) : 0;
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{row.month}</td>
                      <td className="px-4 py-3 text-gray-600">{fmt(row.revenue)}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{fmt(row.collected)}</td>
                      <td className="px-4 py-3 text-red-500">{Number(row.unpaid) > 0 ? fmt(row.unpaid) : '—'}</td>
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
        )}
      </Card>
    </MainLayout>
  );
};

export default TuitionReport;