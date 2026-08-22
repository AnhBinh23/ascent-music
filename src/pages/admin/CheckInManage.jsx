import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { toast } from 'react-toastify';
import useRealtimeEvent from '../../hooks/useRealtimeEvent';

const CheckInManage = () => {
  const [history, setHistory]         = useState([]);
  const [teachers, setTeachers]       = useState([]);
  const [payments, setPayments]       = useState([]);
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading]         = useState(true);
  const [payLoading, setPayLoading]   = useState(null);
  const [tab, setTab]                 = useState('list');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [checkins, teacherList, pays] = await Promise.all([
        api.get('/checkin'),
        api.get('/teachers'),
        api.get('/salary/payments').catch(() => ({ rows: [] })),
      ]);
      setHistory(checkins.rows || checkins || []);
      setTeachers(teacherList.rows || teacherList || []);
      setPayments(pays.rows || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Real-time: GV chấm công → auto refresh ──
  useRealtimeEvent('checkin:created', (data) => {
    toast.info(`✅ ${data.teacherName || 'GV'} chấm công: ${data.className}`, { autoClose: 4000 });
    loadData();
  });

  // ── Real-time: GV điểm danh → cập nhật số lượng present/absent ──
  useRealtimeEvent('attendance:saved', () => {
    loadData();
  });

  // Lọc dữ liệu
  const filtered = history.filter(h => {
    const matchTeacher = filterTeacher === 'all' || h.teacher_id === filterTeacher;
    const matchMonth   = h.date?.slice(0, 7) === filterMonth;
    return matchTeacher && matchMonth;
  });

  const totalSalary = filtered.reduce((sum, h) => sum + Number(h.salary_earned || 0), 0);
  const todayStr    = new Date().toISOString().split('T')[0];
  const todayCount  = filtered.filter(h => h.date === todayStr).length;

  // Nhóm theo ngày
  const groupedByDate = filtered.reduce((acc, h) => {
    if (!acc[h.date]) acc[h.date] = [];
    acc[h.date].push(h);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  // Tổng hợp theo giáo viên (cho tab thanh toán)
  const teacherSummary = teachers.map(t => {
    const teacherCheckins = history.filter(h =>
      h.teacher_id === t.id && h.date?.slice(0, 7) === filterMonth
    );
    const totalEarned = teacherCheckins.reduce((sum, h) => sum + Number(h.salary_earned || 0), 0);
    const isPaid = payments.some(p => p.teacher_id === t.id && p.month === filterMonth && p.status === 'paid');
    return {
      id:        t.id,
      name:      t.name,
      sessions:  teacherCheckins.length,
      salary:    totalEarned,
      isPaid,
    };
  }).filter(t => t.sessions > 0).sort((a, b) => b.salary - a.salary);

  const totalPaid   = teacherSummary.filter(t => t.isPaid).reduce((s, t) => s + t.salary, 0);
  const totalUnpaid = teacherSummary.filter(t => !t.isPaid).reduce((s, t) => s + t.salary, 0);

  const availableMonths = [...new Set(history.map(h => h.date?.slice(0, 7)))].sort((a, b) => b.localeCompare(a));

  // Thanh toán lương
  const handlePay = async (teacherId, teacherName, amount) => {
    if (!window.confirm(`Xác nhận thanh toán ${amount.toLocaleString('vi-VN')}đ cho ${teacherName}?`)) return;
    setPayLoading(teacherId);
    try {
      await api.post('/salary/payments', {
        teacher_id: teacherId,
        month:      filterMonth,
        amount,
        status:     'paid',
        note:       `Lương tháng ${filterMonth}`,
      });
      toast.success(`Đã thanh toán lương cho ${teacherName}!`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi thanh toán!');
    } finally {
      setPayLoading(null);
    }
  };

  const handleUnpay = async (teacherId, teacherName) => {
    if (!window.confirm(`Hoàn tác thanh toán cho ${teacherName}?`)) return;
    setPayLoading(teacherId);
    try {
      await api.delete(`/salary/payments/${teacherId}/${filterMonth}`);
      toast.success('Đã hoàn tác!');
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPayLoading(null);
    }
  };

  return (
    <MainLayout title="Quản lý chấm công">

      {/* Stats */}
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
          <p className="text-base font-bold text-orange-500">{totalSalary.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-gray-500 mt-1">💰 Tổng lương</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 outline-none">
          {availableMonths.length === 0 ? (
            <option value={filterMonth}>{new Date(filterMonth+'-01').toLocaleDateString('vi-VN',{month:'long',year:'numeric'})}</option>
          ) : availableMonths.map(m => (
            <option key={m} value={m}>{new Date(m+'-01').toLocaleDateString('vi-VN',{month:'long',year:'numeric'})}</option>
          ))}
        </select>
        <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
          className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 outline-none">
          <option value="all">Tất cả giáo viên</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-2xl">
        {[
          { key:'list',    label:'📋 Chi tiết'       },
          { key:'summary', label:'📊 Tổng hợp'       },
          { key:'pay',     label:'💳 Thanh toán lương' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${tab===t.key?'bg-white shadow text-primary-600':'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-16 text-gray-400">Đang tải...</div> : (
        <>
          {/* ── CHI TIẾT ── */}
          {tab === 'list' && (
            <div className="flex flex-col gap-4">
              {sortedDates.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <p className="text-gray-400">Chưa có dữ liệu</p>
                </div>
              ) : sortedDates.map(date => {
                const items = groupedByDate[date];
                const daySalary = items.reduce((sum, h) => sum + Number(h.salary_earned || 0), 0);
                return (
                  <div key={date}>
                    <div className="flex items-center justify-between px-1 mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-600 capitalize">
                          {new Date(date).toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'numeric'})}
                        </p>
                        {date === todayStr && (
                          <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-medium">Hôm nay</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-orange-500">+{daySalary.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map((h, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-700 text-sm flex-shrink-0">
                            {h.teacher_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{h.teacher_name}</p>
                            <p className="text-xs text-gray-500 truncate">{h.class_name || 'Buổi học'} · {h.time?.slice(0,5)}</p>
                            {h.note && <p className="text-xs text-gray-400 italic truncate">💬 {h.note}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-green-600">+{Number(h.salary_earned).toLocaleString('vi-VN')}đ</p>
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

          {/* ── TỔNG HỢP ── */}
          {tab === 'summary' && (
            <div className="flex flex-col gap-3">
              {teacherSummary.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <p className="text-gray-400">Chưa có dữ liệu</p>
                </div>
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
              {teacherSummary.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100 mt-2">
                  <p className="font-bold text-gray-700">Tổng chi lương tháng này</p>
                  <p className="font-bold text-orange-600 text-lg">{totalSalary.toLocaleString('vi-VN')}đ</p>
                </div>
              )}
            </div>
          )}

          {/* ── THANH TOÁN LƯƠNG ── */}
          {tab === 'pay' && (
            <>
              {/* Tổng quan thanh toán */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                  <p className="text-xs text-green-600 font-medium">✅ Đã thanh toán</p>
                  <p className="text-xl font-bold text-green-700 mt-1">{totalPaid.toLocaleString('vi-VN')}đ</p>
                  <p className="text-xs text-green-500">{teacherSummary.filter(t=>t.isPaid).length} giáo viên</p>
                </div>
                <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                  <p className="text-xs text-red-500 font-medium">⏳ Chưa thanh toán</p>
                  <p className="text-xl font-bold text-red-600 mt-1">{totalUnpaid.toLocaleString('vi-VN')}đ</p>
                  <p className="text-xs text-red-400">{teacherSummary.filter(t=>!t.isPaid).length} giáo viên</p>
                </div>
              </div>

              {teacherSummary.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <p className="text-3xl mb-3">💳</p>
                  <p className="text-gray-400">Không có giáo viên nào chấm công tháng này</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {teacherSummary.map((t, i) => (
                    <div key={i} className={`p-4 rounded-2xl border shadow-sm transition-all ${t.isPaid ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${t.isPaid ? 'bg-green-200 text-green-800' : 'bg-primary-100 text-primary-700'}`}>
                          {t.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800">{t.name}</p>
                            {t.isPaid && <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full font-medium">✅ Đã TT</span>}
                          </div>
                          <p className="text-xs text-gray-500">{t.sessions} buổi · {filterMonth}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-lg text-orange-600">{t.salary.toLocaleString('vi-VN')}đ</p>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="mt-3 flex gap-2">
                        {!t.isPaid ? (
                          <button
                            onClick={() => handlePay(t.id, t.name, t.salary)}
                            disabled={payLoading === t.id}
                            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50">
                            {payLoading === t.id ? '⏳ Đang xử lý...' : '💳 Thanh toán ngay'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnpay(t.id, t.name)}
                            disabled={payLoading === t.id}
                            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50">
                            {payLoading === t.id ? '⏳...' : '↩️ Hoàn tác'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Thanh toán tất cả */}
                  {teacherSummary.some(t => !t.isPaid) && (
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Thanh toán lương cho tất cả ${teacherSummary.filter(t=>!t.isPaid).length} giáo viên?`)) return;
                        for (const t of teacherSummary.filter(t => !t.isPaid)) {
                          await handlePay(t.id, t.name, t.salary);
                        }
                      }}
                      className="w-full py-3 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors mt-2">
                      💰 Thanh toán tất cả ({totalUnpaid.toLocaleString('vi-VN')}đ)
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default CheckInManage;