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
  const [teacherId, setTeacherId]       = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents]         = useState([]);
  const [attendance, setAttendance]     = useState({});
  const [notes, setNotes]               = useState({});
  const [existing, setExisting]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [date, setDate]                 = useState(new Date().toISOString().split('T')[0]);
  const [tab, setTab]                   = useState('today'); // today | history

  // Load dữ liệu
  useEffect(() => {
    const load = async () => {
      try {
        const tRes = await api.get(`/teachers/by-user/${user?.id}`);
        const tid = tRes?.row?.id;
        if (!tid) { toast.error('Không tìm thấy giáo viên'); return; }
        setTeacherId(tid);

        // Lịch dạy hôm nay
        const schedRes = await api.get(`/schedules?teacher_id=${tid}`);
        const todayDow = jsDayToDb(new Date().getDay());
        const todayList = (schedRes.rows || []).filter(s => Number(s.day_of_week) === todayDow);
        setTodayClasses(todayList);

        // Tự chọn lớp đầu tiên
        if (todayList.length > 0) {
          setSelectedClass(todayList[0]);
        }
      } catch (err) { console.error(err.message); }
      finally { setLoading(false); }
    };
    if (user?.id) load();
  }, [user]);

  // Load HV + điểm danh khi chọn lớp hoặc đổi ngày
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

      // Điểm danh đã lưu cho ngày này
      const todayAtt = (attRes.rows || []).filter(a => a.date === date);
      setExisting(todayAtt);

      // Set trạng thái mặc định
      const attMap = {};
      const noteMap = {};
      stuList.forEach(s => {
        const found = todayAtt.find(a => a.student_id === s.id);
        attMap[s.id] = found ? found.status : 'present'; // mặc định có mặt
        noteMap[s.id] = found ? found.note || '' : '';
      });
      setAttendance(attMap);
      setNotes(noteMap);
    } catch (err) { console.error(err.message); }
  }, [selectedClass, date]);

  useEffect(() => { loadClassData(); }, [loadClassData]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedClass || !students.length) return;
    setSaving(true);
    try {
      const classId = selectedClass.class_id || selectedClass.id;
      const attendanceList = students.map(s => ({
        class_id: classId,
        student_id: s.id,
        date,
        status: attendance[s.id] || 'present',
        note: notes[s.id] || '',
      }));

      await api.post('/attendance/save', { attendanceList });

      // Đếm có mặt
      const presentCount = Object.values(attendance).filter(v => v === 'present' || v === 'late').length;
      toast.success(`✅ Đã lưu điểm danh! ${presentCount}/${students.length} có mặt`);

      await loadClassData();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const isToday = date === new Date().toISOString().split('T')[0];
  const hasSaved = existing.length > 0;
  const presentCount = Object.values(attendance).filter(v => v === 'present' || v === 'late').length;
  const absentCount = Object.values(attendance).filter(v => v === 'absent' || v === 'excused').length;

  if (loading) return <MainLayout title="Điểm danh"><p className="text-center text-gray-400 py-20">Đang tải...</p></MainLayout>;

  return (
    <MainLayout title="Điểm danh">
      {/* Stats */}
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

      {/* Ngày + lớp */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="input-field w-auto" />
        {isToday && <Badge label="Hôm nay" variant="green" />}
      </div>

      {/* Danh sách lớp hôm nay */}
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
                <button key={i} onClick={() => setSelectedClass(cls)}
                  className={`flex-shrink-0 px-4 py-3 rounded-2xl border transition-all ${isActive ? 'bg-primary-600 text-white border-primary-600 shadow-lg' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                  <p className="text-sm font-semibold">{cls.class_name}</p>
                  <p className={`text-xs mt-0.5 ${isActive ? 'text-primary-100' : 'text-gray-400'}`}>
                    {String(cls.time_start||'').slice(0,5)} – {String(cls.time_end||'').slice(0,5)} · {cls.room_name || 'Chưa xếp phòng'}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Danh sách HV */}
          {selectedClass && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-gray-700">{selectedClass.class_name}</p>
                  <p className="text-xs text-gray-500">{students.length} học viên · {String(selectedClass.time_start||'').slice(0,5)} – {String(selectedClass.time_end||'').slice(0,5)}</p>
                </div>
                {hasSaved && <Badge label="✅ Đã điểm danh" variant="green" />}
              </div>

              {students.length === 0 ? (
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

                          {/* Nút chọn trạng thái */}
                          <div className="flex gap-1.5 flex-wrap">
                            {STATUS_OPTIONS.map(opt => (
                              <button key={opt.key}
                                onClick={() => handleStatusChange(s.id, opt.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${status === opt.key ? 'bg-white shadow-sm border-gray-300 font-bold' : 'bg-white/40 border-transparent hover:bg-white/60'}`}>
                                {opt.icon} {opt.label}
                              </button>
                            ))}
                          </div>

                          {/* Ghi chú nếu vắng */}
                          {(status === 'absent' || status === 'excused' || status === 'late') && (
                            <input type="text" placeholder="Ghi chú (lý do)..."
                              value={notes[s.id] || ''}
                              onChange={e => setNotes(prev => ({ ...prev, [s.id]: e.target.value }))}
                              className="mt-2 w-full bg-white/60 border border-white/80 rounded-xl px-3 py-1.5 text-xs outline-none" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Nút lưu */}
                  <div className="mt-4 flex gap-3">
                    <Button onClick={handleSave} loading={saving} className="flex-1">
                      {hasSaved ? '💾 Cập nhật điểm danh' : '✅ Lưu điểm danh'}
                    </Button>
                  </div>

                  {/* Tóm tắt */}
                  <div className="mt-3 flex gap-3 justify-center flex-wrap">
                    {STATUS_OPTIONS.map(opt => {
                      const count = Object.values(attendance).filter(v => v === opt.key).length;
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