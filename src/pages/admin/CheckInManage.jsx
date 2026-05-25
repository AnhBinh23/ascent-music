import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

const CheckInManage = () => {
  const [history, setHistory]         = useState([]);
  const [teachers, setTeachers]       = useState([]);
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('list'); // 'list' | 'summary'

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [checkins, teacherList] = await Promise.all([
        api.get('/checkin'),
        api.get('/teachers'),
      ]);
      setHistory(checkins.rows || checkins || []);
      setTeachers(teacherList.rows || teacherList || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Lọc dữ liệu
  const filtered = history.filter(h => {
    const matchTeacher = filterTeacher === 'all' || h.teacher_id === filterTeacher;
    const matchMonth   = h.date?.slice(0, 7) === filterMonth;
    return matchTeacher && matchMonth;
  });

  // Thống kê tháng
  const totalSalary  = filtered.reduce((sum, h) => sum + Number(h.salary_earned || 0), 0);
  const todayStr     = new Date().toISOString().split('T')[0];
  const todayCount   = filtered.filter(h => h.date === todayStr).length;

  // Nhóm theo ngày (tab list)
  const groupedByDate = filtered.reduce((acc, h) => {
    if (!acc[h.date]) acc[h.date] = [];
    acc[h.date].push(h);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  // Nhóm theo giáo viên (tab summary)
  const groupedByTeacher = filtered.reduce((acc, h) => {
    const key = h.teacher_id;
    if (!acc[key]) acc[key] = { name: h.teacher_name, sessions: 0, salary: 0 };
    acc[key].sessions++;
    acc[key].salary += Number(h.salary_earned || 0);
    return acc;
  }, {});
  const teacherSummary = Object.values(groupedByTeacher).sort((a, b) => b.salary - a.salary);

  // Tháng có dữ liệu
  const availableMonths = [...new Set(history.map(h => h.date?.slice(0, 7)))].sort((a, b) => b.localeCompare(a));

  return (
    <MainLayout title="Quản lý chấm công">

      {/* Tổng quan */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{filtered.length}</p>
          <p className="text-xs text-gray-500 mt-1">Buổi trong tháng</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{todayCount}</p>
          <p className="text-xs text-gray-500 mt-1">Hôm nay</p>
        </div>
        <div className="card text-center">
          <p className="text-lg font-bold text-orange-500">{totalSalary.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-gray-500 mt-1">💰 Tổng lương</p>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="flex gap-2 mb-4">
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 outline-none"
        >
          {availableMonths.length === 0 ? (
            <option value={filterMonth}>
              {new Date(filterMonth + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </option>
          ) : availableMonths.map(m => (
            <option key={m} value={m}>
              {new Date(m + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </option>
          ))}
        </select>

        <select
          value={filterTeacher}
          onChange={e => setFilterTeacher(e.target.value)}
          className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 outline-none"
        >
          <option value="all">Tất cả giáo viên</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-2xl">
        <button
          onClick={() => setTab('list')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'list' ? 'bg-white shadow text-primary-600' : 'text-gray-500'
          }`}
        >
          📋 Chi tiết
        </button>
        <button
          onClick={() => setTab('summary')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'summary' ? 'bg-white shadow text-primary-600' : 'text-gray-500'
          }`}
        >
          📊 Tổng hợp
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      ) : (
        <>
          {/* ── TAB CHI TIẾT ── */}
          {tab === 'list' && (
            <div className="flex flex-col gap-4">
              {sortedDates.length === 0 ? (
                <Card>
                  <p className="text-center text-gray-400 py-10">Chưa có dữ liệu</p>
                </Card>
              ) : sortedDates.map(date => {
                const items     = groupedByDate[date];
                const daySalary = items.reduce((sum, h) => sum + Number(h.salary_earned || 0), 0);
                const dateLabel = new Date(date).toLocaleDateString('vi-VN', {
                  weekday: 'long', day: 'numeric', month: 'numeric'
                });
                const isToday = date === todayStr;
                return (
                  <div key={date}>
                    {/* Header ngày */}
                    <div className="flex items-center justify-between px-1 mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-600 capitalize">{dateLabel}</p>
                        {isToday && (
                          <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                            Hôm nay
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-orange-500">
                        +{daySalary.toLocaleString('vi-VN')}đ
                      </p>
                    </div>

                    {/* Danh sách buổi */}
                    <div className="flex flex-col gap-2">
                      {items.map((h, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-700 text-sm flex-shrink-0">
                            {h.teacher_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{h.teacher_name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {h.class_name || 'Buổi học'} · {h.time?.slice(0, 5)}
                            </p>
                            {h.note && (
                              <p className="text-xs text-gray-400 italic truncate">💬 {h.note}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-green-600">
                              +{Number(h.salary_earned).toLocaleString('vi-VN')}đ
                            </p>
                            <Badge label="✅ Đã chấm" variant="green" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TAB TỔNG HỢP ── */}
          {tab === 'summary' && (
            <div className="flex flex-col gap-3">
              {teacherSummary.length === 0 ? (
                <Card>
                  <p className="text-center text-gray-400 py-10">Chưa có dữ liệu</p>
                </Card>
              ) : teacherSummary.map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-700 flex-shrink-0">
                    {t.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.sessions} buổi dạy</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-500">{t.salary.toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs text-gray-400">tổng lương</p>
                  </div>
                </div>
              ))}

              {/* Tổng cộng */}
              {teacherSummary.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100 mt-2">
                  <p className="font-bold text-gray-700">Tổng chi lương tháng này</p>
                  <p className="font-bold text-orange-600 text-lg">{totalSalary.toLocaleString('vi-VN')}đ</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default CheckInManage;