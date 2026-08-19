import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const FlexibleManage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [slots, setSlots] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [showSearch, setShowSearch] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          api.get('/classes'),
          api.get('/students'),
        ]);
        const flexClasses = (cRes.rows || []).filter(c => c.is_flexible === 1 && c.status === 'Đang học');
        setClasses(flexClasses);
        setAllStudents((sRes.rows || []).filter(s => s.status === 'active'));
      } catch (err) { console.error(err.message); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const loadSlots = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const res = await api.get(
        `/flexible-sessions/available-slots/${selectedClass.id}?from=${dateRange.from}&to=${dateRange.to}`
      );
      setSlots(res.slots || []);
    } catch (err) { console.error(err.message); }
  }, [selectedClass, dateRange]);

  const loadSessions = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const res = await api.get(`/flexible-sessions?class_id=${selectedClass.id}`);
      setSessions(res.rows || []);
    } catch (err) { console.error(err.message); }
  }, [selectedClass]);

  useEffect(() => { loadSlots(); loadSessions(); }, [loadSlots, loadSessions]);

  const handleRegister = async (studentId, date) => {
    setAdding(`${studentId}_${date}`);
    try {
      await api.post('/flexible-sessions', {
        student_id: studentId,
        class_id: selectedClass.id,
        session_date: date,
      });
      toast.success('Đã đăng ký buổi học!');
      setShowSearch(null);
      setStudentSearch('');
      await loadSlots();
      await loadSessions();
    } catch (err) { toast.error(err.message); }
    finally { setAdding(null); }
  };

  const handleCancel = async (sessionId) => {
    if (!window.confirm('Hủy đăng ký buổi này?')) return;
    try {
      await api.patch(`/flexible-sessions/${sessionId}/cancel`);
      toast.success('Đã hủy!');
      await loadSlots();
      await loadSessions();
    } catch (err) { toast.error(err.message); }
  };

  const DAY = { 1: 'CN', 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5', 6: 'T6', 7: 'T7' };

  const getSessionsForDate = (date) => sessions.filter(s =>
    s.session_date === date && s.status !== 'cancelled'
  );

  const filteredStudents = allStudents.filter(s =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  if (loading) return <MainLayout title="Quản lý lớp linh hoạt"><p className="text-center py-20 text-gray-400">Đang tải...</p></MainLayout>;

  return (
    <MainLayout title="🔄 Quản lý lớp linh hoạt">
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-3">🏫 Chọn lớp linh hoạt</p>
          {classes.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa có lớp linh hoạt nào. Tạo lớp với hình thức "Nhóm linh hoạt" trong quản lý lớp.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {classes.map(c => (
                <button key={c.id} onClick={() => setSelectedClass(c)}
                  className={`px-4 py-3 rounded-2xl border transition-all ${selectedClass?.id === c.id ? 'bg-primary-600 text-white border-primary-600 shadow' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className={`text-xs mt-0.5 ${selectedClass?.id === c.id ? 'text-primary-100' : 'text-gray-400'}`}>
                    {c.teacher_name} · Tối đa {c.max_students} HV/buổi
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedClass && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-700">📅 Các buổi học — {selectedClass.name}</p>
                <div className="flex gap-2 items-center">
                  <input type="date" value={dateRange.from}
                    onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
                    className="input-field text-sm w-auto" />
                  <span className="text-gray-400">→</span>
                  <input type="date" value={dateRange.to}
                    onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
                    className="input-field text-sm w-auto" />
                </div>
              </div>

              {slots.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Không có buổi học trong khoảng này. Kiểm tra lịch học của lớp.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {slots.map(slot => {
                    const registered = getSessionsForDate(slot.date);
                    const isFull = registered.length >= (selectedClass.max_students || 5);
                    const isPast = slot.date < new Date().toISOString().split('T')[0];

                    return (
                      <div key={slot.date} className={`p-4 rounded-2xl border ${isPast ? 'bg-gray-50 border-gray-100' : isFull ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-xs font-bold text-primary-700">
                              {DAY[slot.day_of_week]}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {new Date(slot.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                              </p>
                              <p className="text-xs text-gray-500">
                                {String(slot.time_start || '').slice(0, 5)} – {String(slot.time_end || '').slice(0, 5)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                              {registered.length}/{selectedClass.max_students || '?'} HV
                            </span>
                            {!isPast && !isFull && (
                              <button onClick={() => setShowSearch(showSearch === slot.date ? null : slot.date)}
                                className="px-3 py-1.5 bg-primary-500 text-white text-xs rounded-xl font-medium hover:bg-primary-600">
                                + Thêm HV
                              </button>
                            )}
                          </div>
                        </div>

                        {registered.length > 0 && (
                          <div className="flex flex-col gap-1.5 mt-2">
                            {registered.map(s => (
                              <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">
                                    {s.student_name?.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{s.student_name}</p>
                                    <span className={`text-xs ${s.status === 'attended' ? 'text-green-600' : s.status === 'absent' ? 'text-red-500' : 'text-gray-400'}`}>
                                      {s.status === 'attended' ? '✅ Đã điểm danh' : s.status === 'absent' ? '❌ Vắng' : '⏳ Chờ điểm danh'}
                                    </span>
                                  </div>
                                </div>
                                {s.status === 'registered' && !isPast && (
                                  <button onClick={() => handleCancel(s.id)}
                                    className="text-red-400 hover:text-red-600 text-xs p-1">🗑️</button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {showSearch === slot.date && (
                          <div className="mt-3 relative">
                            <input type="text" placeholder="Tìm tên học viên..."
                              value={studentSearch}
                              onChange={e => setStudentSearch(e.target.value)}
                              className="input-field text-sm w-full" />
                            {studentSearch && (
                              <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto">
                                {filteredStudents.length === 0 ? (
                                  <p className="text-sm text-gray-400 p-3 text-center">Không tìm thấy</p>
                                ) : (
                                  filteredStudents.slice(0, 15).map(s => {
                                    const alreadyRegistered = registered.find(r => r.student_id === s.id);
                                    return (
                                      <div key={s.id}
                                        onClick={() => !alreadyRegistered && handleRegister(s.id, slot.date)}
                                        className={`flex items-center gap-2.5 p-2.5 border-b border-gray-50 last:border-0 ${alreadyRegistered ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary-50 cursor-pointer'}`}>
                                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">
                                          {s.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium text-gray-800 truncate">
                                            {s.name}{s.nickname ? ` (${s.nickname})` : ''}
                                          </p>
                                          <p className="text-xs text-gray-400">{s.instrument || ''}</p>
                                        </div>
                                        {alreadyRegistered && <span className="text-xs text-gray-400 ml-auto">Đã đăng ký</span>}
                                        {adding === `${s.id}_${slot.date}` && <span className="text-xs ml-auto">⏳</span>}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default FlexibleManage;