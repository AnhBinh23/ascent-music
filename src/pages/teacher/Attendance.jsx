import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = [
  { key: 'present', label: 'Có mặt',   icon: '✅', color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'absent',  label: 'Vắng',     icon: '❌', color: 'bg-red-100 text-red-700 border-red-200' },
  { key: 'late',    label: 'Đi muộn',  icon: '⏰', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { key: 'excused', label: 'Có phép',  icon: '📝', color: 'bg-blue-100 text-blue-700 border-blue-200' },
];

const jsDayToDb = d => d === 0 ? 1 : d + 1;

const Attendance = () => {
  const { user } = useAuth();
  const [todayClasses, setTodayClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents]         = useState([]);
  const [guestStudents, setGuestStudents] = useState([]);
  const [attendance, setAttendance]     = useState({});
  const [notes, setNotes]               = useState({});
  const [existing, setExisting]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [date, setDate]                 = useState(new Date().toISOString().split('T')[0]);
  const [guestSearch, setGuestSearch]   = useState('');
  const [guestResults, setGuestResults] = useState([]);
  const [showGuestSearch, setShowGuestSearch] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const tRes = await api.get(`/teachers/by-user/${user?.id}`);
        const tid = tRes?.row?.id;
        if (!tid) { toast.error('Không tìm thấy giáo viên'); return; }
        const schedRes = await api.get(`/schedules?teacher_id=${tid}`);
        const todayDow = jsDayToDb(new Date().getDay());
        const todayList = (schedRes.rows || []).filter(s => Number(s.day_of_week) === todayDow);
        setTodayClasses(todayList);
        if (todayList.length > 0) setSelectedClass(todayList[0]);
      } catch (err) { console.error(err.message); }
      finally { setLoading(false); }
    };
    if (user?.id) load();
  }, [user]);

  const loadClassData = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const classId = selectedClass.class_id || selectedClass.id;
      const [stuRes, attRes] = await Promise.all([
        api.get(`/classes/${classId}/students`),
        api.get(`/attendance/class/${classId}`),
      ]);
      const stuList = stuRes.rows || [];
      setStudents(stuList);

      const todayAtt = (attRes.rows || []).filter(a => a.date === date);
      setExisting(todayAtt);

      const guestAtt = todayAtt.filter(a => a.is_guest === 1);
      const guestList = [];
      for (const g of guestAtt) {
        if (!stuList.find(s => s.id === g.student_id)) {
          guestList.push({
            id: g.student_id,
            name: g.student_name || g.display_name || 'HV vãng lai',
            nickname: g.nickname,
            is_guest: true,
            home_class_id: g.home_class_id,
          });
        }
      }
      setGuestStudents(guestList);

      const attMap = {};
      const noteMap = {};
      stuList.forEach(s => {
        const found = todayAtt.find(a => a.student_id === s.id);
        attMap[s.id] = found ? found.status : 'present';
        noteMap[s.id] = found ? found.note || '' : '';
      });
      guestList.forEach(g => {
        const found = todayAtt.find(a => a.student_id === g.id);
        attMap[g.id] = found ? found.status : 'present';
        noteMap[g.id] = found ? found.note || '' : '';
      });
      setAttendance(attMap);
      setNotes(noteMap);
    } catch (err) { console.error(err.message); }
  }, [selectedClass, date]);

  useEffect(() => { loadClassData(); }, [loadClassData]);

  useEffect(() => {
    if (!guestSearch || guestSearch.length < 1 || !selectedClass) {
      setGuestResults([]);
      return;
    }
    const classId = selectedClass.class_id || selectedClass.id;
    const timer = setTimeout(() => {
      api.get(`/attendance/search-guest?class_id=${classId}&q=${guestSearch}`)
        .then(res => setGuestResults(res.rows || []))
        .catch(() => setGuestResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [guestSearch, selectedClass]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const addGuest = (guest) => {
    if (guestStudents.find(g => g.id === guest.id)) {
      toast.info('Đã thêm rồi!');
      return;
    }
    setGuestStudents(prev => [...prev, {
      id: guest.id,
      name: guest.name,
      nickname: guest.nickname,
      is_guest: true,
      home_class_id: guest.home_class_id,
      home_class_name: guest.home_class_name,
    }]);
    setAttendance(prev => ({ ...prev, [guest.id]: 'present' }));
    setNotes(prev => ({ ...prev, [guest.id]: '' }));
    setGuestSearch('');
    setGuestResults([]);
    setShowGuestSearch(false);
    toast.success(`Đã thêm ${guest.name} (vãng lai)`);
  };

  const removeGuest = (guestId) => {
    setGuestStudents(prev => prev.filter(g => g.id !== guestId));
    setAttendance(prev => { const n = { ...prev }; delete n[guestId]; return n; });
    setNotes(prev => { const n = { ...prev }; delete n[guestId]; return n; });
  };

  const handleSave = async () => {
    if (!selectedClass || (!students.length && !guestStudents.length)) return;
    setSaving(true);
    try {
      const classId = selectedClass.class_id || selectedClass.id;
      const regularList = students.map(s => ({
        class_id: classId,
        student_id: s.id,
        date,
        status: attendance[s.id] || 'present',
        note: notes[s.id] || '',
        is_guest: 0,
        home_class_id: null,
      }));
      const guestList = guestStudents.map(g => ({
        class_id: classId,
        student_id: g.id,
        date,
        status: attendance[g.id] || 'present',
        note: notes[g.id] || '',
        is_guest: 1,
        home_class_id: g.home_class_id || null,
      }));
      const attendanceList = [...regularList, ...guestList];
      await api.post('/attendance/save', { attendanceList });

      const allIds = [...students.map(s => s.id), ...guestStudents.map(g => g.id)];
      const presentCount = allIds.filter(id => attendance[id] === 'present' || attendance[id] === 'late').length;
      toast.success(`Đã lưu điểm danh! ${presentCount}/${allIds.length} có mặt`);
      await loadClassData();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const isToday = date === new Date().toISOString().split('T')[0];
  const hasSaved = existing.length > 0;
  const allStudentIds = [...students.map(s => s.id), ...guestStudents.map(g => g.id)];
  const presentCount = allStudentIds.filter(id => attendance[id] === 'present' || attendance[id] === 'late').length;
  const absentCount = allStudentIds.filter(id => attendance[id] === 'absent' || attendance[id] === 'excused').length;
  const classType = selectedClass?.class_type || selectedClass?.type;

  if (loading) return <MainLayout title="Điểm danh"><p className="text-center text-gray-400 py-20">Đang tải...</p></MainLayout>;

  return (
    <MainLayout title="Điểm danh">
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{todayClasses.length}</p>
          <p className="text-xs text-gray-500 mt-1">Lớp hôm nay</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{presentCount}</p>
          <p className="text-xs text-gray-500 mt-1">Có mặt</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-500">{absentCount}</p>
          <p className="text-xs text-gray-500 mt-1">Vắng</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-auto" />
        {isToday && <Badge label="Hôm nay" variant="green" />}
      </div>

      {todayClasses.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-gray-400">Hôm nay không có lịch dạy</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {todayClasses.map((cls, i) => {
              const isActive = selectedClass?.class_id === cls.class_id || selectedClass?.id === cls.id;
              return (
                <button key={i} onClick={() => { setSelectedClass(cls); setGuestStudents([]); }}
                  className={`flex-shrink-0 px-4 py-3 rounded-2xl border transition-all ${isActive ? 'bg-primary-600 text-white border-primary-600 shadow-lg' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                  <p className="text-sm font-semibold">{cls.class_name}</p>
                  <p className={`text-xs mt-0.5 ${isActive ? 'text-primary-100' : 'text-gray-400'}`}>
                    {String(cls.time_start||'').slice(0,5)} – {String(cls.time_end||'').slice(0,5)} · {cls.room_name || 'Chưa xếp phòng'}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedClass && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-gray-700">{selectedClass.class_name}</p>
                  <p className="text-xs text-gray-500">
                    {students.length} học viên{guestStudents.length > 0 ? ` + ${guestStudents.length} vãng lai` : ''}
                    {' · '}{String(selectedClass.time_start||'').slice(0,5)} – {String(selectedClass.time_end||'').slice(0,5)}
                  </p>
                </div>
                {hasSaved && <Badge label="✅ Đã điểm danh" variant="green" />}
              </div>

              {students.length === 0 && guestStudents.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Lớp chưa có học viên</p>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    {students.map((s, i) => {
                      const status = attendance[s.id] || 'present';
                      const statusCfg = STATUS_OPTIONS.find(o => o.key === status);
                      return (
                        <div key={s.id} className={`p-3 rounded-2xl border transition-all ${statusCfg?.color || 'bg-white border-gray-100'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-white/60 rounded-xl flex items-center justify-center text-sm font-bold text-gray-700">
                                {i + 1}
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{s.name}</p>
                                {s.nickname && <span className="text-xs opacity-70">({s.nickname})</span>}
                              </div>
                            </div>
                            <span className="text-xl">{statusCfg?.icon}</span>
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            {STATUS_OPTIONS.map(opt => (
                              <button key={opt.key}
                                onClick={() => handleStatusChange(s.id, opt.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${status === opt.key ? 'bg-white shadow-sm border-gray-300 font-bold' : 'bg-white/40 border-transparent hover:bg-white/60'}`}>
                                {opt.icon} {opt.label}
                              </button>
                            ))}
                          </div>
                          {(status === 'absent' || status === 'excused' || status === 'late') && (
                            <input type="text" placeholder="Ghi chú (lý do)..."
                              value={notes[s.id] || ''}
                              onChange={e => setNotes(prev => ({ ...prev, [s.id]: e.target.value }))}
                              className="mt-2 w-full bg-white/60 border border-white/80 rounded-xl px-3 py-1.5 text-xs outline-none" />
                          )}
                        </div>
                      );
                    })}

                    {guestStudents.map((g, i) => {
                      const status = attendance[g.id] || 'present';
                      const statusCfg = STATUS_OPTIONS.find(o => o.key === status);
                      return (
                        <div key={g.id} className={`p-3 rounded-2xl border-2 border-dashed transition-all ${statusCfg?.color || 'bg-white border-gray-100'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-sm font-bold text-orange-600">
                                V{i + 1}
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{g.name}</p>
                                <span className="text-xs text-orange-500">Vãng lai{g.home_class_name ? ` · Lớp gốc: ${g.home_class_name}` : ''}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{statusCfg?.icon}</span>
                              <button onClick={() => removeGuest(g.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 text-xs">✕</button>
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            {STATUS_OPTIONS.map(opt => (
                              <button key={opt.key}
                                onClick={() => handleStatusChange(g.id, opt.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${status === opt.key ? 'bg-white shadow-sm border-gray-300 font-bold' : 'bg-white/40 border-transparent hover:bg-white/60'}`}>
                                {opt.icon} {opt.label}
                              </button>
                            ))}
                          </div>
                          {(status === 'absent' || status === 'excused' || status === 'late') && (
                            <input type="text" placeholder="Ghi chú..."
                              value={notes[g.id] || ''}
                              onChange={e => setNotes(prev => ({ ...prev, [g.id]: e.target.value }))}
                              className="mt-2 w-full bg-white/60 border border-white/80 rounded-xl px-3 py-1.5 text-xs outline-none" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {classType === 'group' && (
                    <div className="mt-4 p-3 bg-orange-50 rounded-2xl border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-orange-700">👥 Thêm HV vãng lai</p>
                        <button onClick={() => setShowGuestSearch(!showGuestSearch)}
                          className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600">
                          {showGuestSearch ? 'Đóng' : '+ Thêm'}
                        </button>
                      </div>
                      {showGuestSearch && (
                        <div className="relative">
                          <input type="text" placeholder="Tìm tên học viên..."
                            value={guestSearch}
                            onChange={e => setGuestSearch(e.target.value)}
                            className="input-field text-sm w-full" />
                          {guestResults.length > 0 && (
                            <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto">
                              {guestResults.map(g => (
                                <div key={g.id} onClick={() => addGuest(g)}
                                  className="flex items-center gap-2.5 p-2.5 hover:bg-orange-50 cursor-pointer border-b border-gray-50 last:border-0">
                                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">
                                    {g.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{g.name}{g.nickname ? ` (${g.nickname})` : ''}</p>
                                    <p className="text-xs text-gray-400">{g.home_class_name || g.instrument || 'Chưa xếp lớp'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {guestSearch && guestResults.length === 0 && (
                            <p className="text-xs text-gray-400 mt-1">Không tìm thấy HV nào</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex gap-3">
                    <Button onClick={handleSave} loading={saving} className="flex-1">
                      {hasSaved ? '💾 Cập nhật điểm danh' : '✅ Lưu điểm danh'}
                    </Button>
                  </div>

                  <div className="mt-3 flex gap-3 justify-center flex-wrap">
                    {STATUS_OPTIONS.map(opt => {
                      const count = allStudentIds.filter(id => attendance[id] === opt.key).length;
                      if (!count) return null;
                      return (
                        <span key={opt.key} className="text-xs text-gray-500">
                          {opt.icon} {opt.label}: <strong>{count}</strong>
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default Attendance;