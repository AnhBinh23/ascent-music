import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// status trong DB (EN) -> hiển thị (VI)
const STATUS_MAP = {
  present: { label: 'Có mặt',   variant: 'green',  icon: '✅' },
  absent:  { label: 'Vắng mặt', variant: 'red',    icon: '❌' },
  late:    { label: 'Đi trễ',   variant: 'orange', icon: '⏰' },
  excused: { label: 'Có phép',  variant: 'blue',   icon: '📋' },
};

const MyAttendance = () => {
  const { user } = useAuth();
  const [stats, setStats]     = useState({ total: 0, present: 0, absent: 0, late: 0, excused: 0, rate: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const stuRes    = await api.get(`/students/by-user/${user.id}`);
        const studentId = stuRes.row?.id || stuRes.rows?.[0]?.id;
        if (!studentId) { setLoading(false); return; }

        const [statsRes, histRes] = await Promise.all([
          api.get(`/attendance/stats/${studentId}`),
          api.get(`/attendance/student-history/${studentId}`),
        ]);
        setStats({
          total:   statsRes.total   || 0,
          present: statsRes.present || 0,
          absent:  statsRes.absent  || 0,
          late:    statsRes.late    || 0,
          excused: statsRes.excused || 0,
          rate:    statsRes.rate    || 0,
        });
        setHistory(histRes.rows || []);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return (
    <MainLayout title="Điểm danh của tôi">
      <p className="text-center py-16 text-gray-400">Đang tải...</p>
    </MainLayout>
  );

  const rate = stats.rate;

  return (
    <MainLayout title="Điểm danh của tôi">
      {/* Thống kê */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
          <p className="text-xs text-gray-500 mt-1">Có mặt</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-500">{stats.absent}</p>
          <p className="text-xs text-gray-500 mt-1">Vắng mặt</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{rate}%</p>
          <p className="text-xs text-gray-500 mt-1">Chuyên cần</p>
        </div>
      </div>

      {/* Thanh chuyên cần */}
      <Card className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Tỷ lệ chuyên cần</span>
          <span className={`font-bold ${rate >= 80 ? 'text-green-600' : 'text-red-500'}`}>{rate}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${rate >= 80 ? 'bg-green-500' : 'bg-red-400'}`}
            style={{ width: `${rate}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">Yêu cầu tối thiểu: 80%</p>
      </Card>

      {/* Lịch sử điểm danh */}
      {history.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-gray-400 text-sm">Chưa có dữ liệu điểm danh</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((item) => {
            const st = STATUS_MAP[item.status] || STATUS_MAP.present;
            return (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.class_name || '—'}</p>
                  <p className="text-xs text-gray-400">{item.date ? new Date(item.date).toLocaleDateString('vi-VN') : ''}</p>
                  {item.note && <p className="text-xs text-gray-500 mt-0.5 italic">"{item.note}"</p>}
                </div>
                <Badge label={`${st.icon} ${st.label}`} variant={st.variant} />
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
};

export default MyAttendance;