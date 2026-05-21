import React, { useState } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';

const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];

const SAMPLE_REVENUE = [
  { month: 'T1', revenue: 12000000, expense: 5000000 },
  { month: 'T2', revenue: 15000000, expense: 5500000 },
  { month: 'T3', revenue: 13500000, expense: 5200000 },
  { month: 'T4', revenue: 17000000, expense: 6000000 },
  { month: 'T5', revenue: 19500000, expense: 6500000 },
];

const SAMPLE_STUDENTS = [
  { name: 'Nguyễn Văn An',  instrument: 'Piano',    attendance: 95, status: 'active' },
  { name: 'Trần Thị Bình',  instrument: 'Guitar',   attendance: 88, status: 'active' },
  { name: 'Lê Minh Châu',   instrument: 'Violin',   attendance: 100, status: 'active' },
  { name: 'Hoàng Văn Em',   instrument: 'Piano',    attendance: 72, status: 'active' },
  { name: 'Phạm Thị Dung',  instrument: 'Thanh nhạc', attendance: 65, status: 'inactive' },
];

const SAMPLE_TEACHERS = [
  { name: 'Nguyễn Thị Mai', instrument: 'Piano',    sessions: 22, hours: 22, salary: 4400000 },
  { name: 'Trần Văn Hùng',  instrument: 'Guitar',   sessions: 18, hours: 18, salary: 3240000 },
  { name: 'Lê Thị Hoa',     instrument: 'Violin',   sessions: 20, hours: 20, salary: 4400000 },
  { name: 'Phạm Minh Tuấn', instrument: 'Thanh nhạc', sessions: 16, hours: 16, salary: 3040000 },
];

const maxRevenue = Math.max(...SAMPLE_REVENUE.map(r => r.revenue));

const ReportPage = () => {
  const [tab, setTab] = useState('revenue');
  const [month, setMonth] = useState('05');
  const [year, setYear] = useState('2025');

  const totalRevenue  = SAMPLE_REVENUE.reduce((s, r) => s + r.revenue, 0);
  const totalExpense  = SAMPLE_REVENUE.reduce((s, r) => s + r.expense, 0);
  const totalProfit   = totalRevenue - totalExpense;
  const totalSalary   = SAMPLE_TEACHERS.reduce((s, t) => s + t.salary, 0);

  const tabs = [
    { key: 'revenue',  label: '💰 Doanh thu' },
    { key: 'students', label: '🎓 Học viên' },
    { key: 'teachers', label: '👨‍🏫 Giáo viên' },
  ];

  return (
    <MainLayout title="Báo cáo & Thống kê">
      {/* Bộ lọc */}
      <div className="flex gap-3 mb-5">
        <select value={month} onChange={e => setMonth(e.target.value)} className="input-field w-auto">
          {MONTHS.map(m => <option key={m} value={m}>Tháng {m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(e.target.value)} className="input-field w-auto">
          {['2024','2025','2026'].map(y => <option key={y}>{y}</option>)}
        </select>
        <Button variant="secondary" icon="🔄">Làm mới</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-gray-100">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all
              ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Doanh thu */}
      {tab === 'revenue' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-xs text-gray-500 mb-1">Tổng thu</p>
              <p className="text-xl font-bold text-green-600">{totalRevenue.toLocaleString('vi-VN')}đ</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 mb-1">Chi phí</p>
              <p className="text-xl font-bold text-red-500">{totalExpense.toLocaleString('vi-VN')}đ</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 mb-1">Lợi nhuận</p>
              <p className="text-xl font-bold text-blue-600">{totalProfit.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>

          {/* Biểu đồ cột đơn giản */}
          <Card title="Doanh thu theo tháng">
            <div className="flex items-end gap-3 h-48 mt-4">
              {SAMPLE_REVENUE.map((r, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs text-gray-500">{(r.revenue / 1000000).toFixed(1)}M</p>
                  <div className="w-full flex flex-col gap-1">
                    <div className="w-full bg-primary-500 rounded-t-lg transition-all"
                      style={{ height: `${(r.revenue / maxRevenue) * 140}px` }} />
                    <div className="w-full bg-red-200 rounded-b-lg transition-all"
                      style={{ height: `${(r.expense / maxRevenue) * 140}px` }} />
                  </div>
                  <p className="text-xs font-medium text-gray-600">{r.month}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-3 bg-primary-500 rounded" /> Doanh thu
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-3 bg-red-200 rounded" /> Chi phí
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Học viên */}
      {tab === 'students' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-2xl font-bold text-blue-600">{SAMPLE_STUDENTS.filter(s => s.status === 'active').length}</p>
              <p className="text-xs text-gray-500 mt-1">Đang học</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-gray-400">{SAMPLE_STUDENTS.filter(s => s.status === 'inactive').length}</p>
              <p className="text-xs text-gray-500 mt-1">Nghỉ học</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-green-600">
                {Math.round(SAMPLE_STUDENTS.reduce((s, st) => s + st.attendance, 0) / SAMPLE_STUDENTS.length)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Chuyên cần TB</p>
            </div>
          </div>

          <Card title="Chuyên cần học viên">
            <div className="flex flex-col gap-3 mt-2">
              {[...SAMPLE_STUDENTS].sort((a, b) => b.attendance - a.attendance).map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-medium text-gray-800">{s.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${s.attendance >= 80 ? 'text-green-600' : 'text-red-500'}`}>
                          {s.attendance}%
                        </span>
                        <Badge label={s.instrument} variant="blue" />
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${s.attendance >= 80 ? 'bg-green-500' : 'bg-red-400'}`}
                        style={{ width: `${s.attendance}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Giáo viên */}
      {tab === 'teachers' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="card text-center">
              <p className="text-2xl font-bold text-purple-600">{SAMPLE_TEACHERS.reduce((s, t) => s + t.sessions, 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Tổng buổi dạy</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-orange-600">{totalSalary.toLocaleString('vi-VN')}đ</p>
              <p className="text-xs text-gray-500 mt-1">Tổng lương tháng</p>
            </div>
          </div>

          <Card title="Lương giáo viên tháng này">
            <div className="flex flex-col gap-3 mt-2">
              {SAMPLE_TEACHERS.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.instrument} · {t.sessions} buổi</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{t.salary.toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs text-gray-400">{t.hours} giờ</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};

export default ReportPage;