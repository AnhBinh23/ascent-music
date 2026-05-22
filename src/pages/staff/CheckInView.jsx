import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import checkinService from '../../services/checkinService';
import teacherService from '../../services/teacherService';
import { toast } from 'react-toastify';

const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];

const CheckInView = () => {
  const [tab, setTab]           = useState('checkin');
  const [checkins, setCheckins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [month, setMonth]       = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear]         = useState(String(new Date().getFullYear()));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [checkinData, teacherData] = await Promise.all([
          checkinService.getAll(),
          teacherService.getAll(),
        ]);
        setCheckins(checkinData);
        setTeachers(teacherData);
        setFiltered(checkinData);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = checkins.filter(c => {
      if (!c.date) return false;
      const d = new Date(c.date);
      return (
        String(d.getMonth() + 1).padStart(2, '0') === month &&
        String(d.getFullYear()) === year
      );
    });
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.teacher_name?.toLowerCase().includes(q) ||
        c.class_name?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [checkins, month, year, search]);

  const salaryByTeacher = teachers.map(t => {
    const tc = checkins.filter(c => {
      if (!c.date) return false;
      const d = new Date(c.date);
      return (
        c.teacher_name === t.name &&
        String(d.getMonth() + 1).padStart(2, '0') === month &&
        String(d.getFullYear()) === year
      );
    });
    return {
      ...t,
      totalSalary:   tc.reduce((sum, c) => sum + Number(c.salary_earned || 0), 0),
      totalSessions: tc.length,
    };
  });

  const totalMonthSalary   = salaryByTeacher.reduce((sum, t) => sum + t.totalSalary, 0);
  const totalMonthSessions = salaryByTeacher.reduce((sum, t) => sum + t.totalSessions, 0);

  const handleExport = () => {
    const rows = [
      ['Giáo viên', 'Chuyên môn', 'Số buổi', 'Tổng lương'],
      ...salaryByTeacher.map(t => [t.name, t.instrument, t.totalSessions, t.totalSalary]),
      ['', 'TỔNG', totalMonthSessions, totalMonthSalary],
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `luong-gv-thang-${month}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('✅ Xuất Excel thành công!');
  };

  return (
    <MainLayout title="Chấm công & Lương giáo viên">
      {/* Bộ lọc */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select value={month} onChange={e => setMonth(e.target.value)} className="input-field w-auto">
          {MONTHS.map(m => <option key={m} value={m}>Tháng {m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(e.target.value)} className="input-field w-auto">
          {['2024','2025','2026'].map(y => <option key={y}>{y}</option>)}
        </select>
        <button onClick={handleExport}
          className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600">
          📥 Xuất Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-gray-100">
        {[
          { key: 'checkin', label: '📋 Lịch sử chấm công' },
          { key: 'salary',  label: '💰 Bảng lương'        },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all
              ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab lịch sử */}
      {tab === 'checkin' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="card text-center">
              <p className="text-2xl font-bold text-primary-600">{filtered.length}</p>
              <p className="text-xs text-gray-500 mt-1">Lượt chấm công</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-blue-600">
                {[...new Set(filtered.map(c => c.teacher_name))].length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Giáo viên</p>
            </div>
            <div className="card text-center">
              <p className="text-lg font-bold text-orange-600">
                {filtered.reduce((sum, c) => sum + Number(c.salary_earned || 0), 0).toLocaleString('vi-VN')}đ
              </p>
              <p className="text-xs text-gray-500 mt-1">Tổng lương</p>
            </div>
          </div>

          <div className="mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm giáo viên, lớp học..."
              className="input-field w-full" />
          </div>

          {loading ? (
            <p className="text-center text-gray-400 py-10">Đang tải...</p>
          ) : filtered.length === 0 ? (
            <Card>
              <p className="text-center text-gray-400 py-10">
                Không có dữ liệu tháng {month}/{year}
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((c, i) => (
                <Card key={i}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
                        {c.teacher_name?.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-800">{c.teacher_name}</p>
                          <Badge label="✅ Đã chấm công" variant="green" />
                        </div>
                        <p className="text-sm text-gray-500">🎵 {c.class_name || 'Lớp học'}</p>
                        <p className="text-xs text-gray-400">📅 {c.date} · 🕐 {c.time?.slice(0,5)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">
                        {Number(c.salary_earned || 0).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab lương */}
      {tab === 'salary' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="card text-center">
              <p className="text-2xl font-bold text-primary-600">{teachers.length}</p>
              <p className="text-xs text-gray-500 mt-1">Giáo viên</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-blue-600">{totalMonthSessions}</p>
              <p className="text-xs text-gray-500 mt-1">Tổng buổi</p>
            </div>
            <div className="card text-center">
              <p className="text-lg font-bold text-orange-600">
                {totalMonthSalary.toLocaleString('vi-VN')}đ
              </p>
              <p className="text-xs text-gray-500 mt-1">Tổng lương</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {salaryByTeacher.map(t => (
              <Card key={t.id}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                    {t.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-gray-800">{t.name}</p>
                      <Badge label={t.instrument} variant="blue" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2 bg-gray-50 rounded-xl text-center">
                        <p className="text-xs text-gray-500">Đơn giá/buổi</p>
                        <p className="font-bold text-sm">{Number(t.salary_amount).toLocaleString('vi-VN')}đ</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-xl text-center">
                        <p className="text-xs text-gray-500">Số buổi</p>
                        <p className="font-bold text-sm">{t.totalSessions}</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-xl text-center">
                        <p className="text-xs text-blue-600">Lương CB</p>
                        <p className="font-bold text-blue-700 text-sm">
                          {(Number(t.salary_amount) * t.totalSessions).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                      <div className="p-2 bg-orange-50 rounded-xl text-center">
                        <p className="text-xs text-orange-600">Tổng lương</p>
                        <p className="font-bold text-orange-700 text-sm">
                          {t.totalSalary.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800">💰 Tổng lương tháng {month}/{year}</p>
                <p className="text-xs text-gray-500">{totalMonthSessions} buổi · {teachers.length} GV</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {totalMonthSalary.toLocaleString('vi-VN')}đ
              </p>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default CheckInView;