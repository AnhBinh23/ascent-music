import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';

const jsDayToDb = d => d === 0 ? 1 : d + 1;

const CheckIn = () => {
  const { user } = useAuth();
  const [todayClasses, setTodayClasses] = useState([]);
  const [checkedIn, setCheckedIn]       = useState({});
  const [notes, setNotes]               = useState({});
  const [loading, setLoading]           = useState({});
  const [history, setHistory]           = useState([]);
  const [now, setNow]                   = useState(new Date());
  const [tab, setTab]                   = useState('today');
  const [filterMonth, setFilterMonth]   = useState(new Date().toISOString().slice(0, 7));
  const [teacherId, setTeacherId]       = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Bước 1: Lấy teachers.id từ user.id
        const teacherRes = await api.get(`/teachers/by-user/${user?.id}`);
        const tid = teacherRes?.row?.id;
        if (!tid) { toast.error('Không tìm thấy giáo viên'); return; }
        setTeacherId(tid);

        // Bước 2: Lấy lịch dạy hôm nay theo teachers.id
        const schedulesRes = await api.get(`/schedules?teacher_id=${tid}`);
        const schedules    = schedulesRes.rows || [];
        const todayDbDay   = jsDayToDb(new Date().getDay());
        setTodayClasses(schedules.filter(s => Number(s.day_of_week) === todayDbDay));

        // Bước 3: Lấy lịch sử chấm công
        const histRes = await api.get(`/checkin/teacher/${tid}`);
        const hist    = histRes.rows || [];
        setHistory(hist);

        // Bước 4: Map lớp đã chấm công hôm nay
        const todayStr = new Date().toISOString().split('T')[0];
        const map = {};
        hist.filter(h => h.date === todayStr).forEach(c => { map[c.class_id] = c; });
        setCheckedIn(map);
      } catch (err) {
        console.error(err.message);
      }
    };
    if (user?.id) loadData();
  }, [user]);

  const handleCheckIn = async (cls) => {
    setLoading(prev => ({ ...prev, [cls.id]: true }));
    try {
      const timeNow      = now.toTimeString().slice(0, 5);
      const dateNow      = new Date().toISOString().split('T')[0];
      const salaryEarned = 200000;

      // ✅ Gọi trực tiếp api.post — backend tự lookup teacher_id từ req.user.id
      await api.post('/checkin', {
        class_id:      cls.class_id || cls.id,
        date:          dateNow,
        time:          timeNow,
        salary_earned: salaryEarned,
        note:          notes[cls.id] || '',
      });

      setCheckedIn(prev => ({
        ...prev,
        [cls.id]: { time: timeNow, salary_earned: salaryEarned }
      }));
      toast.success(`✅ Chấm công thành công! Lương: ${salaryEarned.toLocaleString('vi-VN')}đ`);

      // Reload history
      if (teacherId) {
        const histRes = await api.get(`/checkin/teacher/${teacherId}`);
        setHistory(histRes.rows || []);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(prev => ({ ...prev, [cls.id]: false }));
    }
  };

  const todaySalary = Object.values(checkedIn).reduce((sum, c) => sum + Number(c.salary_earned || 0), 0);
  const totalDone   = Object.keys(checkedIn).length;

  const filteredHistory  = history.filter(h => h.date?.slice(0, 7) === filterMonth);
  const monthSalary      = filteredHistory.reduce((sum, h) => sum + Number(h.salary_earned || 0), 0);
  const groupedHistory   = filteredHistory.reduce((acc, h) => {
    if (!acc[h.date]) acc[h.date] = [];
    acc[h.date].push(h);
    return acc;
  }, {});
  const sortedDates      = Object.keys(groupedHistory).sort((a, b) => b.localeCompare(a));
  const availableMonths  = [...new Set(history.map(h => h.date?.slice(0, 7)))].sort((a, b) => b.localeCompare(a));

  return (
    <MainLayout title="Chấm công">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{todayClasses.length}</p>
          <p className="text-xs text-gray-500 mt-1">Buổi hôm nay</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{totalDone}</p>
          <p className="text-xs text-gray-500 mt-1">Đã chấm công</p>
        </div>
        <div className="card text-center col-span-2">
          <p className="text-2xl font-bold text-orange-500">{todaySalary.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-gray-500 mt-1">💰 Lương hôm nay</p>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-2xl">
        <button onClick={() => setTab('today')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'today' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
          📅 Hôm nay
        </button>
        <button onClick={() => setTab('history')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'history' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
          📋 Lịch sử chấm công
        </button>
      </div>

      {/* Tab: Hôm nay */}
      {tab === 'today' && (
        <>
          <div className="flex items-center gap-3 mb-5 p-4 bg-primary-50 rounded-2xl border border-primary-100">
            <span className="text-2xl">🕐</span>
            <div>
              <p className="text-lg font-bold text-primary-700">
                {now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-primary-500">
                {now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {todayClasses.length === 0 ? (
            <Card>
              <div className="text-center py-10">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-gray-400">Hôm nay không có lịch dạy</p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {todayClasses.map(cls => {
                const isDone  = !!checkedIn[cls.id];
                const checkin = checkedIn[cls.id];
                return (
                  <Card key={cls.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-gray-800">
                            {cls.time_start?.slice(0, 5)} – {cls.time_end?.slice(0, 5)}
                          </p>
                          <p className="text-sm font-semibold text-gray-700">{cls.class_name}</p>
                          <Badge label={cls.class_type === '1v1' ? '1 kèm 1' : 'Nhóm'} variant={cls.class_type === '1v1' ? 'blue' : 'green'} />
                          {isDone && <Badge label="✅ Đã chấm công" variant="green" />}
                        </div>
                        <p className="text-sm text-gray-500">🚪 {cls.room_name}</p>

                        {isDone ? (
                          <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-medium text-green-700">✅ Chấm công lúc {checkin?.time}</p>
                              <div className="text-right">
                                <p className="text-xs text-green-600">Lương nhận được</p>
                                <p className="text-lg font-bold text-green-700">
                                  +{Number(checkin?.salary_earned).toLocaleString('vi-VN')}đ
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <input
                              type="text"
                              placeholder="Ghi chú (không bắt buộc)..."
                              value={notes[cls.id] || ''}
                              onChange={e => setNotes(prev => ({ ...prev, [cls.id]: e.target.value }))}
                              className="input-field text-sm"
                            />
                          </div>
                        )}
                      </div>
                      {!isDone && (
                        <Button loading={loading[cls.id]} onClick={() => handleCheckIn(cls)} icon="✅" className="flex-shrink-0">
                          Chấm công
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab: Lịch sử */}
      {tab === 'history' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 outline-none"
            >
              {availableMonths.length === 0 && (
                <option value={filterMonth}>
                  {new Date(filterMonth + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                </option>
              )}
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {new Date(m + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-4 bg-orange-50 rounded-2xl text-center border border-orange-100">
              <p className="text-xs text-orange-600 mb-1">Tổng lương tháng</p>
              <p className="text-xl font-bold text-orange-600">{monthSalary.toLocaleString('vi-VN')}đ</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl text-center border border-blue-100">
              <p className="text-xs text-blue-600 mb-1">Số buổi dạy</p>
              <p className="text-xl font-bold text-blue-600">{filteredHistory.length} buổi</p>
            </div>
          </div>

          {sortedDates.length === 0 ? (
            <Card><p className="text-center text-gray-400 py-10">Chưa có dữ liệu tháng này</p></Card>
          ) : (
            <div className="flex flex-col gap-4">
              {sortedDates.map(date => {
                const items     = groupedHistory[date];
                const daySalary = items.reduce((sum, h) => sum + Number(h.salary_earned || 0), 0);
                return (
                  <div key={date}>
                    <div className="flex items-center justify-between px-1 mb-2">
                      <p className="text-sm font-semibold text-gray-600 capitalize">
                        {new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                      </p>
                      <p className="text-sm font-bold text-orange-500">+{daySalary.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map((h, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">✅</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{h.class_name || 'Buổi học'}</p>
                            <p className="text-xs text-gray-400">
                              Chấm công lúc {h.time?.slice(0, 5)}{h.note ? ` · ${h.note}` : ''}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-green-600 flex-shrink-0">
                            +{Number(h.salary_earned).toLocaleString('vi-VN')}đ
                          </p>
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

export default CheckIn;