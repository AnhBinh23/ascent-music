import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';

const jsDayToDb = d => d === 0 ? 1 : d + 1;
const fmt = n => Number(n || 0).toLocaleString('vi-VN') + 'đ';

const CheckIn = () => {
  const { user } = useAuth();
  const [todayClasses, setTodayClasses] = useState([]);
  const [checkedIn, setCheckedIn]       = useState({});
  const [notes, setNotes]               = useState({});
  const [loadingBtn, setLoadingBtn]     = useState({});
  const [history, setHistory]           = useState([]);
  const [salaryPayments, setSalaryPayments] = useState([]);
  const [now, setNow]                   = useState(new Date());
  const [tab, setTab]                   = useState('today');
  const [filterMonth, setFilterMonth]   = useState(new Date().toISOString().slice(0, 7));
  const [teacherId, setTeacherId]       = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadHistory = useCallback(async (tid) => {
    const histRes = await api.get(`/checkin/teacher/${tid}`);
    setHistory(histRes.rows || []);
  }, []);

  const loadSalaryPayments = useCallback(async () => {
    try { const res = await api.get('/salary'); setSalaryPayments(res.rows || []); }
    catch { setSalaryPayments([]); }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const teacherRes = await api.get(`/teachers/by-user/${user?.id}`);
        const teacher = teacherRes?.row;
        const tid = teacher?.id;
        if (!tid) { toast.error('Không tìm thấy giáo viên'); return; }
        setTeacherId(tid);

        const schedulesRes = await api.get(`/schedules?teacher_id=${tid}`);
        const schedules    = schedulesRes.rows || [];
        const todayDbDay   = jsDayToDb(new Date().getDay());
        setTodayClasses(schedules.filter(s => Number(s.day_of_week) === todayDbDay));

        await loadHistory(tid);
        await loadSalaryPayments();

        // Kiểm tra đã chấm công hôm nay chưa
        const histRes  = await api.get(`/checkin/teacher/${tid}`);
        const hist     = histRes.rows || [];
        const todayStr = new Date().toISOString().split('T')[0];
        const map = {};
        hist.filter(h => h.date === todayStr).forEach(c => { map[c.class_id] = c; });
        setCheckedIn(map);
      } catch (err) { console.error(err.message); }
    };
    if (user?.id) loadData();
  }, [user, loadHistory, loadSalaryPayments]);

  const handleCheckIn = async (cls) => {
    const classId = cls.class_id || cls.id;
    // Kiểm tra đã chấm công chưa
    if (checkedIn[classId]) {
      toast.info('Lớp này đã chấm công hôm nay rồi!');
      return;
    }
    setLoadingBtn(prev => ({ ...prev, [classId]: true }));
    try {
      const timeNow = now.toTimeString().slice(0, 5);
      const dateNow = new Date().toISOString().split('T')[0];

      const res = await api.post('/checkin', {
        class_id: classId,
        date:     dateNow,
        time:     timeNow,
        note:     notes[classId] || '',
      });

      setCheckedIn(prev => ({
        ...prev,
        [classId]: {
          time: timeNow,
          salary_earned: res.salary_earned || 0,
          class_type: res.class_type || cls.class_type,
        }
      }));

      toast.success(res.message || '✅ Chấm công thành công!');
      if (teacherId) await loadHistory(teacherId);
    } catch (err) { toast.error(err.message); }
    finally { setLoadingBtn(prev => ({ ...prev, [classId]: false })); }
  };

  // ── Tính toán ──
  const todaySalary = Object.values(checkedIn).reduce((sum, c) => sum + Number(c.salary_earned || 0), 0);
  const totalDone   = Object.keys(checkedIn).length;

  const filteredHistory = history.filter(h => h.date?.slice(0, 7) === filterMonth);
  const monthSalary     = filteredHistory.reduce((sum, h) => sum + Number(h.salary_earned || 0), 0);
  const monthSessions   = filteredHistory.length;

  const groupedHistory  = filteredHistory.reduce((acc, h) => {
    if (!acc[h.date]) acc[h.date] = [];
    acc[h.date].push(h);
    return acc;
  }, {});
  const sortedDates     = Object.keys(groupedHistory).sort((a, b) => b.localeCompare(a));
  const availableMonths = [...new Set(history.map(h => h.date?.slice(0, 7)).filter(Boolean))].sort((a, b) => b.localeCompare(a));

  // Thêm tháng hiện tại nếu chưa có
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (!availableMonths.includes(currentMonth)) availableMonths.unshift(currentMonth);

  const salaryPayment   = salaryPayments.find(p => p.teacher_id === teacherId && p.month === filterMonth);
  const isPaidThisMonth = !!salaryPayment;

  const monthlySummary = availableMonths.map(m => {
    const mHistory  = history.filter(h => h.date?.slice(0, 7) === m);
    const mSalary   = mHistory.reduce((sum, h) => sum + Number(h.salary_earned || 0), 0);
    const mSessions = mHistory.length;
    const mPayment  = salaryPayments.find(p => p.teacher_id === teacherId && p.month === m);
    return { month: m, salary: mSalary, sessions: mSessions, payment: mPayment };
  });

  return (
    <MainLayout title="Chấm công">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{todayClasses.length}</p>
          <p className="text-xs text-gray-500 mt-1">Buổi hôm nay</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{totalDone}/{todayClasses.length}</p>
          <p className="text-xs text-gray-500 mt-1">Đã chấm công</p>
        </div>
        <div className="card text-center col-span-2">
          <p className="text-2xl font-bold text-orange-500">{fmt(todaySalary)}</p>
          <p className="text-xs text-gray-500 mt-1">💰 Lương hôm nay</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-2xl">
        {[
          { key: 'today',   label: '📅 Hôm nay' },
          { key: 'history', label: '📋 Lịch sử' },
          { key: 'salary',  label: '💰 Lương tháng' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${tab === t.key ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Hôm nay ── */}
      {tab === 'today' && (
        <>
          <div className="flex items-center gap-3 mb-5 p-4 bg-primary-50 rounded-2xl border border-primary-100">
            <span className="text-2xl">🕐</span>
            <div>
              <p className="text-lg font-bold text-primary-700">{now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
              <p className="text-xs text-primary-500">{now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          {todayClasses.length === 0 ? (
            <Card><div className="text-center py-10"><p className="text-3xl mb-2">📅</p><p className="text-gray-400">Hôm nay không có lịch dạy</p></div></Card>
          ) : (
            <div className="flex flex-col gap-4">
              {todayClasses.map(cls => {
                const classId = cls.class_id || cls.id;
                const isDone  = !!checkedIn[classId];
                const checkin = checkedIn[classId];
                const isGroup = cls.class_type === 'group' || checkin?.class_type === 'group';
                return (
                  <Card key={classId}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-gray-800">{String(cls.time_start||'').slice(0,5)} – {String(cls.time_end||'').slice(0,5)}</p>
                          <p className="text-sm font-semibold text-gray-700">{cls.class_name}</p>
                          <Badge label={cls.class_type === '1v1' ? '1 kèm 1' : 'Nhóm'} variant={cls.class_type === '1v1' ? 'blue' : 'green'} />
                          {isDone && <Badge label="✅ Đã chấm công" variant="green" />}
                        </div>
                        <p className="text-sm text-gray-500">🚪 {cls.room_name || 'Chưa xếp phòng'}</p>
                        {isDone ? (
                          <div className={`mt-3 p-3 rounded-xl border ${isGroup && !Number(checkin?.salary_earned) ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                            <div className="flex justify-between items-center">
                              <p className={`text-sm font-medium ${isGroup && !Number(checkin?.salary_earned) ? 'text-orange-700' : 'text-green-700'}`}>
                                ✅ Đã chấm công lúc {checkin?.time}
                              </p>
                              <div className="text-right">
                                {isGroup && !Number(checkin?.salary_earned) ? (
                                  <>
                                    <p className="text-xs text-orange-600">⚠️ Lớp nhóm</p>
                                    <p className="text-sm font-semibold text-orange-600">Chờ admin xác nhận</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-xs text-green-600">Lương buổi này</p>
                                    <p className="text-lg font-bold text-green-700">+{fmt(checkin?.salary_earned)}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <input type="text" placeholder="Ghi chú (không bắt buộc)..."
                              value={notes[classId] || ''}
                              onChange={e => setNotes(prev => ({ ...prev, [classId]: e.target.value }))}
                              className="input-field text-sm" />
                          </div>
                        )}
                      </div>
                      {!isDone ? (
                        <Button loading={loadingBtn[classId]} onClick={() => handleCheckIn(cls)} icon="✅" className="flex-shrink-0">
                          Chấm công
                        </Button>
                      ) : (
                        <div className="flex-shrink-0 text-center">
                          <span className="text-3xl">✅</span>
                          <p className="text-xs text-green-600 mt-1">Xong</p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Lịch sử ── */}
      {tab === 'history' && (
        <>
          <div className="mb-4">
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 outline-none">
              {availableMonths.map(m => (
                <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-4 bg-orange-50 rounded-2xl text-center border border-orange-100">
              <p className="text-xs text-orange-600 mb-1">Tổng lương tháng</p>
              <p className="text-xl font-bold text-orange-600">{fmt(monthSalary)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl text-center border border-blue-100">
              <p className="text-xs text-blue-600 mb-1">Số buổi dạy</p>
              <p className="text-xl font-bold text-blue-600">{monthSessions} buổi</p>
            </div>
          </div>

          {/* Trạng thái thanh toán */}
          <div className={`p-3 rounded-2xl border mb-4 flex items-center justify-between
            ${isPaidThisMonth ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div>
              <p className={`text-sm font-semibold ${isPaidThisMonth ? 'text-green-700' : 'text-yellow-700'}`}>
                {isPaidThisMonth ? '✅ Lương tháng này đã được thanh toán' : '⏳ Lương tháng này chưa được thanh toán'}
              </p>
              {isPaidThisMonth && salaryPayment?.paid_at && (
                <p className="text-xs text-green-600 mt-0.5">
                  Thanh toán: {new Date(salaryPayment.paid_at).toLocaleDateString('vi-VN')}
                  {salaryPayment.amount ? ` · ${fmt(salaryPayment.amount)}` : ''}
                </p>
              )}
            </div>
            <span className="text-2xl">{isPaidThisMonth ? '💵' : '🕐'}</span>
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
                      <p className="text-sm font-bold text-orange-500">+{fmt(daySalary)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map((h, i) => {
                        const isGroup = h.class_type === 'group';
                        const hasAbsent = isGroup && Number(h.absent_count) > 0;
                        const salaryConfirmed = Number(h.salary_earned) > 0;
                        return (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border shadow-sm ${hasAbsent && !salaryConfirmed ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-100'}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${hasAbsent && !salaryConfirmed ? 'bg-orange-100' : 'bg-green-100'}`}>
                              <span className="text-lg">{hasAbsent && !salaryConfirmed ? '⚠️' : '✅'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{h.class_name || 'Buổi học'}</p>
                              <p className="text-xs text-gray-400">
                                Chấm công lúc {String(h.time||'').slice(0, 5)}{h.note ? ` · ${h.note}` : ''}
                              </p>
                              {hasAbsent && (
                                <p className="text-xs text-orange-600 mt-0.5">
                                  ⚠️ {h.present_count}/{h.total_students} có mặt · {h.absent_count} vắng
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              {isGroup && !salaryConfirmed ? (
                                <p className="text-xs text-orange-500 font-medium">Chờ xác nhận</p>
                              ) : (
                                <p className="text-sm font-bold text-green-600">+{fmt(h.salary_earned)}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Lương tháng ── */}
      {tab === 'salary' && (
        <>
          <p className="text-xs text-gray-400 mb-4">Lương được tính theo số buổi chấm công thực tế · Admin thanh toán cuối tháng</p>
          {monthlySummary.length === 0 ? (
            <Card><p className="text-center text-gray-400 py-10">Chưa có dữ liệu chấm công</p></Card>
          ) : (
            <div className="flex flex-col gap-3">
              {monthlySummary.map(({ month, salary, sessions, payment }) => {
                const isPaid = !!payment;
                return (
                  <div key={month} className={`p-4 rounded-2xl border ${isPaid ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'} shadow-sm`}
                    onClick={() => { setFilterMonth(month); setTab('history'); }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-800 capitalize">
                          {new Date(month + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{sessions} buổi dạy</p>
                      </div>
                      {isPaid ? <Badge label="✅ Đã thanh toán" variant="green" />
                        : <Badge label="⏳ Chưa thanh toán" variant="orange" />}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-white rounded-xl text-center border border-gray-100">
                        <p className="text-xs text-gray-500">Lương theo buổi</p>
                        <p className="font-bold text-gray-800">{fmt(salary)}</p>
                      </div>
                      <div className={`p-2 rounded-xl text-center border ${isPaid ? 'bg-green-100 border-green-200' : 'bg-orange-50 border-orange-100'}`}>
                        <p className={`text-xs ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>{isPaid ? 'Đã nhận' : 'Dự kiến'}</p>
                        <p className={`font-bold ${isPaid ? 'text-green-700' : 'text-orange-700'}`}>
                          {isPaid ? fmt(payment.amount) : fmt(salary)}
                        </p>
                      </div>
                    </div>
                    {isPaid && payment?.paid_at && (
                      <p className="text-xs text-green-600 mt-2 text-center">
                        💵 Thanh toán ngày {new Date(payment.paid_at).toLocaleDateString('vi-VN')}
                        {payment.note ? ` · ${payment.note}` : ''}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 text-center mt-2">Bấm để xem chi tiết →</p>
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