import React, { useEffect, useState } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];

const ReportPage = () => {
  const [tab, setTab]     = useState('revenue');
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear]   = useState(String(new Date().getFullYear()));
  const [stats, setStats] = useState({
    totalRevenue: 0, totalPaid: 0, totalUnpaid: 0,
    totalStudents: 0, activeStudents: 0,
    totalTeachers: 0, totalClasses: 0,
  });
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const [invStats, students, teachers, classes] = await Promise.all([
          api.get('/invoices/stats'),
          api.get('/students'),
          api.get('/teachers'),
          api.get('/classes'),
        ]);
        setStats({
          totalRevenue:   invStats.total   || 0,
          totalPaid:      invStats.paid    || 0,
          totalUnpaid:    invStats.unpaid  || 0,
          totalStudents:  students.rows?.length || 0,
          activeStudents: students.rows?.filter(s => s.status === 'active').length || 0,
          totalTeachers:  teachers.rows?.length || 0,
          totalClasses:   classes.rows?.length  || 0,
        });

        const invData = await api.get('/invoices');
        setInvoices(invData.rows || []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Tính doanh thu theo tháng
  const revenueByMonth = MONTHS.map(m => {
    const monthInvoices = invoices.filter(inv => {
      const d = new Date(inv.created_at);
      return String(d.getMonth() + 1).padStart(2, '0') === m
        && String(d.getFullYear()) === year
        && inv.status === 'paid';
    });
    return {
      month: `T${parseInt(m)}`,
      total: monthInvoices.reduce((sum, inv) => sum + Number(inv.total_fee || 0), 0),
      count: monthInvoices.length,
    };
  });

  const maxRevenue = Math.max(...revenueByMonth.map(r => r.total), 1);

  const handleExportExcel = () => {
    const rows = [
      ['Tháng', 'Số hóa đơn', 'Doanh thu'],
      ...revenueByMonth.map(r => [r.month, r.count, r.total]),
      ['', 'TỔNG', stats.totalRevenue],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `bao-cao-doanh-thu-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('✅ Xuất Excel thành công!');
  };

  if (loading) return <MainLayout title="Báo cáo"><p className="text-center py-20 text-gray-400">Đang tải...</p></MainLayout>;

  return (
    <MainLayout title="Báo cáo & Thống kê">
      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-gray-100">
        {[
          { key: 'revenue',  label: '💰 Doanh thu'  },
          { key: 'students', label: '🎓 Học viên'    },
          { key: 'teachers', label: '👨‍🏫 Giáo viên'   },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all
              ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab doanh thu */}
      {tab === 'revenue' && (
        <div className="flex flex-col gap-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-xl font-bold text-green-600">{Number(stats.totalRevenue).toLocaleString('vi-VN')}đ</p>
              <p className="text-xs text-gray-500 mt-1">Tổng doanh thu</p>
            </div>
            <div className="card text-center">
              <p className="text-xl font-bold text-blue-600">{stats.totalPaid}</p>
              <p className="text-xs text-gray-500 mt-1">Đã thanh toán</p>
            </div>
            <div className="card text-center">
              <p className="text-xl font-bold text-red-500">{stats.totalUnpaid}</p>
              <p className="text-xs text-gray-500 mt-1">Chưa thanh toán</p>
            </div>
            <div className="card text-center">
              <p className="text-xl font-bold text-orange-600">{stats.totalClasses}</p>
              <p className="text-xs text-gray-500 mt-1">Lớp học</p>
            </div>
          </div>

          {/* Biểu đồ doanh thu */}
          <Card title={`📊 Doanh thu theo tháng năm ${year}`}>
            <div className="flex items-center gap-3 mb-4 mt-2">
              <select value={year} onChange={e => setYear(e.target.value)} className="input-field w-auto">
                {['2024','2025','2026'].map(y => <option key={y}>{y}</option>)}
              </select>
              <button onClick={handleExportExcel}
                className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
                📥 Xuất Excel
              </button>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-2 h-48 mt-4">
              {revenueByMonth.map((r, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs text-gray-500 font-medium">
                    {r.total > 0 ? `${(r.total / 1000000).toFixed(1)}M` : ''}
                  </p>
                  <div className="w-full bg-gray-100 rounded-t-lg relative"
                    style={{ height: '160px' }}>
                    <div
                      className="absolute bottom-0 w-full bg-primary-500 rounded-t-lg transition-all duration-500"
                      style={{ height: `${(r.total / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{r.month}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Danh sách hóa đơn gần nhất */}
          <Card title="📋 Hóa đơn gần nhất">
            <div className="flex flex-col gap-2 mt-3">
              {invoices.filter(inv => inv.status === 'paid').slice(0, 10).map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{inv.student_name}</p>
                    <p className="text-xs text-gray-500">{inv.instrument} · {new Date(inv.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <p className="text-sm font-bold text-green-600">{Number(inv.total_fee).toLocaleString('vi-VN')}đ</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab học viên */}
      {tab === 'students' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
              <p className="text-xs text-gray-500 mt-1">Tổng học viên</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-green-600">{stats.activeStudents}</p>
              <p className="text-xs text-gray-500 mt-1">Đang học</p>
            </div>
          </div>
          <Card title="📈 Thống kê học viên theo nhạc cụ">
            {['Piano','Guitar','Violin','Thanh nhạc'].map(inst => {
              const count = invoices.filter(inv => inv.instrument === inst).length;
              const pct   = invoices.length > 0 ? Math.round(count / invoices.length * 100) : 0;
              return (
                <div key={inst} className="flex items-center gap-3 mb-3 mt-3">
                  <p className="text-sm text-gray-700 w-24">{inst}</p>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className="bg-primary-500 h-3 rounded-full transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-sm font-medium text-gray-700 w-12 text-right">{count}</p>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* Tab giáo viên */}
      {tab === 'teachers' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.totalTeachers}</p>
              <p className="text-xs text-gray-500 mt-1">Tổng giáo viên</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.totalClasses}</p>
              <p className="text-xs text-gray-500 mt-1">Tổng lớp học</p>
            </div>
          </div>
          <Card title="👨‍🏫 Giáo viên theo chuyên môn">
            {['Piano','Guitar','Violin','Thanh nhạc'].map((inst, i) => {
              const colors = ['bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500'];
              return (
                <div key={inst} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2 mt-2">
                  <div className={`w-3 h-3 rounded-full ${colors[i]}`} />
                  <p className="text-sm font-medium text-gray-700 flex-1">{inst}</p>
                  <p className="text-sm text-gray-500">1 giáo viên</p>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </MainLayout>
  );
};

export default ReportPage;