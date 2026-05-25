import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

const STATUS_CONFIG = {
  present: { label: 'Có mặt',   variant: 'green',  icon: '✅' },
  absent:  { label: 'Vắng mặt', variant: 'red',    icon: '❌' },
  late:    { label: 'Đi muộn',  variant: 'orange', icon: '⏰' },
  excused: { label: 'Có phép',  variant: 'blue',   icon: '📝' },
};

const AttendanceManage = () => {
  const [classes, setClasses]             = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate]                   = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords]             = useState([]);
  const [loading, setLoading]             = useState(false);
  const [tab, setTab]                     = useState('date');

  useEffect(() => {
    api.get('/classes').then(d => setClasses(d.rows || [])).catch(() => {});
  }, []);

  const loadAttendance = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const data = await api.get(`/attendance/class/${selectedClass}`);
      setRecords(data.rows || data || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const filtered = tab === 'date'
    ? records.filter(r => r.date === date)
    : records;

  const stats = {
    present: filtered.filter(r => r.status === 'present').length,
    absent:  filtered.filter(r => r.status === 'absent').length,
    late:    filtered.filter(r => r.status === 'late').length,
    excused: filtered.filter(r => r.status === 'excused').length,
  };

  const groupedByDate = filtered.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = [];
    acc[r.date].push(r);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <MainLayout title="Quản lý điểm danh">
      {/* Bộ lọc */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
          className="input-field flex-1">
          <option value="">-- Chọn lớp học --</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {tab === 'date' && (
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="input-field w-auto" />
        )}
      </div>

      {!selectedClass ? (
        <Card>
          <p className="text-center text-gray-400 py-10">Chọn lớp học để xem điểm danh</p>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="card text-center">
                <p className="text-xl">{cfg.icon}</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{stats[key]}</p>
                <p className="text-xs text-gray-500">{cfg.label}</p>
              </div>
            ))}
          </div>

          {/* Tab */}
          <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-2xl">
            <button onClick={() => setTab('date')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all
                ${tab === 'date' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
              📅 Theo ngày
            </button>
            <button onClick={() => setTab('all')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all
                ${tab === 'all' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
              📋 Tất cả
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400">Đang tải...</div>
          ) : tab === 'date' ? (
            <Card title={`Điểm danh ngày ${new Date(date).toLocaleDateString('vi-VN')}`}>
              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Chưa có điểm danh ngày này</p>
              ) : (
                <div className="flex flex-col gap-2 mt-3">
                  {filtered.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-sm font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{r.student_name}</p>
                          {r.note && <p className="text-xs text-gray-400 italic">"{r.note}"</p>}
                        </div>
                      </div>
                      <Badge
                        label={STATUS_CONFIG[r.status]?.label || r.status}
                        variant={STATUS_CONFIG[r.status]?.variant || 'gray'}
                        dot
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {sortedDates.length === 0 ? (
                <Card>
                  <p className="text-center text-gray-400 py-8">Chưa có dữ liệu điểm danh</p>
                </Card>
              ) : sortedDates.map(d => {
                const items        = groupedByDate[d];
                const presentCount = items.filter(r => r.status === 'present').length;
                return (
                  <div key={d}>
                    <div className="flex items-center justify-between px-1 mb-2">
                      <p className="text-sm font-semibold text-gray-600 capitalize">
                        {new Date(d).toLocaleDateString('vi-VN', {
                          weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-400">{presentCount}/{items.length} có mặt</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700 text-sm font-bold">
                              {r.student_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{r.student_name}</p>
                              {r.note && <p className="text-xs text-gray-400 italic">"{r.note}"</p>}
                            </div>
                          </div>
                          <Badge
                            label={STATUS_CONFIG[r.status]?.label || r.status}
                            variant={STATUS_CONFIG[r.status]?.variant || 'gray'}
                            dot
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default AttendanceManage;