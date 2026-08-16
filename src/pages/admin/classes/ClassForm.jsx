import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../../../components/layout/MainLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import api from '../../../services/api';
import teacherService from '../../../services/teacherService';
import GroupSalaryRates from '../../../components/ui/GroupSalaryRates';
const INSTRUMENTS = ['Piano', 'Guitar', 'Violin', 'Thanh nhạc'];
const LEVELS      = ['Sơ cấp', 'Trung cấp', 'Nâng cao'];
const DAYS        = [
  { value: 2, label: 'Thứ 2' }, { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' }, { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' }, { value: 7, label: 'Thứ 7' },
  { value: 1, label: 'Chủ nhật' },
];
const DAY_LABEL = { 1:'CN', 2:'T2', 3:'T3', 4:'T4', 5:'T5', 6:'T6', 7:'T7' };

const COURSE_PACKAGES = [
  { sessions: 16, label: 'Khóa 16 buổi' },
  { sessions: 24, label: 'Khóa 24 buổi' },
];

const EMPTY_CLASS = {
  name: '', instrument: 'Piano', type: '1v1', teacher_id: '',
  level: 'Sơ cấp', schedule: '', tuition_fee: '', start_date: '', end_date: '',
  max_students: 1, sessions_per_week: 1, total_sessions: 16,
  status: 'Đang học', note: '',
  teacher_salary: '',
  teacher_salary_partial: '',
};
const EMPTY_SLOT = { day_of_week: 2, time_start: '08:00', time_end: '09:00', room_id: '' };

const calcEndDate = (startDate, sessionsPerWeek, totalSessions) => {
  if (!startDate || !sessionsPerWeek || !totalSessions) return '';
  const weeks = Math.ceil(totalSessions / sessionsPerWeek);
  const end   = new Date(startDate);
  end.setDate(end.getDate() + weeks * 7);
  return end.toISOString().split('T')[0];
};

const fmt = (n) => n ? Number(n).toLocaleString('vi-VN') + 'đ' : '—';

const ClassForm = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = !!id;

  const [form, setForm]         = useState(EMPTY_CLASS);
  const [slots, setSlots]       = useState([{ ...EMPTY_SLOT }]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms]       = useState([]);
  const [saving, setSaving]     = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // ── Học viên ──
  const [allStudents, setAllStudents]           = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]); // [{id, name, instrument}]
  const [originalStudentIds, setOriginalStudentIds] = useState([]); // để sync khi edit
  const [studentSearch, setStudentSearch]       = useState('');
  const [showDropdown, setShowDropdown]         = useState(false);

  useEffect(() => {
    teacherService.getAll().then(setTeachers).catch(() => {});
    api.get('/rooms').then(d => setRooms(d.rows || [])).catch(() => {});
    api.get('/students').then(d => setAllStudents(d.rows || [])).catch(() => {});

    if (isEdit) {
      Promise.all([
        api.get(`/classes/${id}`),
        api.get('/schedules'),
        api.get(`/classes/${id}/students`),
      ]).then(([cls, sched, stu]) => {
        const c = cls.row || cls.rows?.[0] || {};
        setForm({
          name:                   c.name              || '',
          instrument:             c.instrument        || 'Piano',
          type:                   c.type              || '1v1',
          teacher_id:             c.teacher_id        || '',
          level:                  c.level             || 'Sơ cấp',
          schedule:               c.schedule          || '',
          tuition_fee:            c.tuition_fee || c.fee || '',
          start_date:             c.start_date?.slice(0,10) || '',
          end_date:               c.end_date?.slice(0,10)   || '',
          max_students:           c.max_students      || 1,
          sessions_per_week:      c.sessions_per_week || 1,
          total_sessions:         c.total_sessions    || 16,
          status:                 c.status            || 'Đang học',
          note:                   c.note              || '',
          teacher_salary:         c.teacher_salary         || '',
          teacher_salary_partial: c.teacher_salary_partial || '',
        });
        const existing = (sched.rows || []).filter(s => s.class_id === id);
        if (existing.length > 0) {
          setSlots(existing.map(s => ({
            id:          s.id,
            day_of_week: s.day_of_week,
            time_start:  s.time_start?.slice(0,5) || '08:00',
            time_end:    s.time_end?.slice(0,5)   || '09:00',
            room_id:     s.room_id || '',
          })));
        }
        // Học viên hiện có
        const curStudents = stu.rows || [];
        setSelectedStudents(curStudents.map(s => ({ id: s.id, name: s.name, instrument: s.instrument })));
        setOriginalStudentIds(curStudents.map(s => s.id));
      }).catch(() => toast.error('Không tải được dữ liệu'))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleChange = e => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    if (['start_date','sessions_per_week','total_sessions'].includes(name)) {
      next.end_date = calcEndDate(
        name === 'start_date'        ? value : next.start_date,
        name === 'sessions_per_week' ? Number(value) : Number(next.sessions_per_week),
        name === 'total_sessions'    ? Number(value) : Number(next.total_sessions),
      );
    }
    if (name === 'type') {
      next.max_students = value === '1v1' ? 1 : next.max_students < 2 ? 5 : next.max_students;
    }
    setForm(next);
  };

  const addSlot    = () => setSlots([...slots, { ...EMPTY_SLOT }]);
  const removeSlot = (i) => setSlots(slots.filter((_, idx) => idx !== i));
  const updateSlot = (i, field, value) => {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };
  const buildScheduleText = (sl) =>
    sl.map(s => `${DAY_LABEL[s.day_of_week]} ${s.time_start}-${s.time_end}`).join(', ');

  const spw = Number(form.sessions_per_week) || 1;

  // ── Học viên handlers ──
  const addStudent = (s) => {
    setSelectedStudents(prev => [...prev, { id: s.id, name: s.name, instrument: s.instrument }]);
    setStudentSearch('');
    setShowDropdown(false);
  };
  const removeStudent = (sid) => {
    setSelectedStudents(prev => prev.filter(s => s.id !== sid));
  };
  const studentResults = allStudents.filter(s =>
    !selectedStudents.find(ss => ss.id === s.id) &&
    s.name?.toLowerCase().includes(studentSearch.toLowerCase())
  );
  const maxStu = form.type === '1v1' ? 1 : Number(form.max_students) || 99;
  const isFull = selectedStudents.length >= maxStu;

  const handleSubmit = async () => {
    if (!form.name || !form.teacher_id) {
      toast.error('Vui lòng điền tên lớp và chọn giáo viên!'); return;
    }
    if (slots.length !== spw) {
      toast.error(`Cần đúng ${spw} khung giờ!`); return;
    }
    setSaving(true);
    try {
      const payload = {
        name:                   form.name,
        instrument:             form.instrument,
        type:                   form.type,
        teacher_id:             form.teacher_id,
        level:                  form.level,
        schedule:               buildScheduleText(slots),
        tuition_fee:            Number(form.tuition_fee) || 0,
        fee:                    Number(form.tuition_fee) || 0,
        start_date:             form.start_date,
        end_date:               form.end_date,
        max_students:           Number(form.max_students) || 1,
        sessions_per_week:      Number(form.sessions_per_week) || 1,
        total_sessions:         Number(form.total_sessions) || 16,
        status:                 form.status,
        note:                   form.note,
        teacher_salary:         Number(form.teacher_salary)         || 0,
        teacher_salary_partial: Number(form.teacher_salary_partial) || 0,
      };

      let classId = id;
      if (isEdit) {
        await api.put(`/classes/${id}`, payload);
        toast.success('Cập nhật lớp học thành công!');
      } else {
        const res = await api.post('/classes', payload);
        classId = res.id || res.insertId;
        toast.success('Tạo lớp học thành công!');
      }

      if (classId) {
        // Lịch học
        if (isEdit) {
          const cur      = await api.get('/schedules');
          const existing = (cur.rows || []).filter(s => s.class_id === id);
          await Promise.all(existing.map(s => api.delete(`/schedules/${s.id}`).catch(() => {})));
        }
        await Promise.all(slots.map(s =>
          api.post('/schedules', {
            class_id:    classId,
            teacher_id:  form.teacher_id,
            room_id:     s.room_id || null,
            day_of_week: Number(s.day_of_week),
            time_start:  s.time_start.length === 5 ? s.time_start + ':00' : s.time_start,
            time_end:    s.time_end.length   === 5 ? s.time_end   + ':00' : s.time_end,
            type:        form.type,
            note:        '',
          }).catch(() => {})
        ));

        // ── Sync học viên ──
        const selectedIds = selectedStudents.map(s => s.id);
        // Thêm mới (có trong selected, chưa có trong original)
        const toAdd = selectedIds.filter(sid => !originalStudentIds.includes(sid));
        // Xóa (có trong original, không còn trong selected) — chỉ khi edit
        const toRemove = isEdit ? originalStudentIds.filter(sid => !selectedIds.includes(sid)) : [];

        await Promise.all([
          ...toAdd.map(sid =>
  api.post(`/classes/${classId}/students`, { student_id: sid, course_number: 1, total_sessions: Number(form.total_sessions) || 16 }).catch(() => {})
),
          ...toRemove.map(sid =>
            api.delete(`/classes/${classId}/students/${sid}`).catch(() => {})
          ),
        ]);
      }

      navigate('/admin/classes');
    } catch (err) {
      toast.error(err?.message || 'Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) return (
    <MainLayout title={isEdit ? 'Chỉnh sửa lớp học' : 'Tạo lớp học'}>
      <p className="text-center py-16 text-gray-400">Đang tải...</p>
    </MainLayout>
  );

  return (
    <MainLayout title={isEdit ? 'Chỉnh sửa lớp học' : 'Tạo lớp học'}>
      <div className="flex flex-col gap-4">

        {/* ── Thông tin lớp ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-4">📚 Thông tin lớp học</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="sm:col-span-2">
              <Input label="Tên lớp *" name="name" value={form.name}
                onChange={handleChange} placeholder="VD: Piano 1-1 Mint" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Nhạc cụ</label>
              <select name="instrument" value={form.instrument} onChange={handleChange} className="input-field">
                {INSTRUMENTS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Hình thức</label>
              <select name="type" value={form.type} onChange={handleChange} className="input-field">
                <option value="1v1">1 kèm 1</option>
                <option value="group">Nhóm</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Giáo viên *</label>
              <select name="teacher_id" value={form.teacher_id} onChange={handleChange} className="input-field">
                <option value="">-- Chọn giáo viên --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.instrument}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Trình độ</label>
              <select name="level" value={form.level} onChange={handleChange} className="input-field">
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            {/* ✅ ── CHỌN HỌC VIÊN (ngay dưới Giáo viên) ── */}
            <div className="sm:col-span-2 flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                👨‍🎓 Học viên ({selectedStudents.length}{form.type === 'group' ? `/${maxStu}` : ''})
              </label>

              {/* Search box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={isFull ? '✅ Đã đủ học viên' : '🔍 Tìm và thêm học viên...'}
                  value={studentSearch}
                  disabled={isFull}
                  onChange={e => { setStudentSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="input-field disabled:bg-gray-50 disabled:text-gray-400"
                />
                {showDropdown && studentSearch && !isFull && (
                  <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto">
                    {studentResults.length === 0 ? (
                      <p className="text-sm text-gray-400 p-3 text-center">Không tìm thấy học viên</p>
                    ) : (
                      studentResults.slice(0, 20).map(s => (
                        <div
                          key={s.id}
                          onMouseDown={() => addStudent(s)}
                          className="flex items-center gap-2.5 p-2.5 hover:bg-primary-50 cursor-pointer border-b border-gray-50 last:border-0"
                        >
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600 flex-shrink-0">
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                            {s.instrument && <p className="text-xs text-gray-400">{s.instrument}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Chips học viên đã chọn */}
              {selectedStudents.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedStudents.map(s => (
                    <div key={s.id}
                      className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-primary-50 border border-primary-200 rounded-xl">
                      <span className="text-sm text-primary-700 font-medium">{s.name}</span>
                      <button
                        type="button"
                        onClick={() => removeStudent(s.id)}
                        className="w-5 h-5 flex items-center justify-center rounded-full text-primary-400 hover:bg-red-100 hover:text-red-500 text-base leading-none"
                        title="Xóa khỏi lớp"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Chưa chọn học viên nào (có thể thêm sau)</p>
              )}
            </div>

            {/* ✅ Gói khóa học */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">📦 Gói khóa học</label>
              <select name="total_sessions" value={form.total_sessions} onChange={handleChange} className="input-field">
                {COURSE_PACKAGES.map(p => (
                  <option key={p.sessions} value={p.sessions}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">📅 Số buổi/tuần</label>
              <select name="sessions_per_week" value={form.sessions_per_week} onChange={handleChange} className="input-field">
                {[1,2,3,4,5,6,7].map(n => (
                  <option key={n} value={n}>{n} buổi/tuần</option>
                ))}
              </select>
            </div>

            <Input label="Học phí cả khóa (đ)" name="tuition_fee" type="number"
              value={form.tuition_fee} onChange={handleChange} placeholder="VD: 4800000" />

            {form.type === 'group' && (
              <Input label="Sĩ số tối đa" name="max_students" type="number"
                value={form.max_students} onChange={handleChange} />
            )}

            <Input label="Ngày bắt đầu" name="start_date" type="date"
              value={form.start_date} onChange={handleChange} />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Ngày kết thúc</label>
              <input type="date" name="end_date" value={form.end_date}
                onChange={handleChange} className="input-field bg-gray-50" />
              {form.start_date && form.end_date && (
                <p className="text-xs text-primary-500 mt-0.5">
                  📦 {form.total_sessions} buổi · {form.sessions_per_week} buổi/tuần
                  · ~{Math.ceil(Number(form.total_sessions)/Number(form.sessions_per_week))} tuần
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Trạng thái</label>
              <select name="status" value={form.status} onChange={handleChange} className="input-field">
                <option value="Đang học">Đang học</option>
                <option value="Tạm nghỉ">Tạm nghỉ</option>
                <option value="Đã kết thúc">Đã kết thúc</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Ghi chú</label>
              <textarea name="note" value={form.note} onChange={handleChange}
                rows={2} className="input-field resize-none" />
            </div>
          </div>
        </div>

        {/* ── Lương giáo viên ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-1">💰 Lương giáo viên theo lớp này</p>
          <p className="text-xs text-gray-400 mb-4">
            Mức lương riêng cho lớp này — có thể khác với các lớp khác của cùng giáo viên
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                💰 Lương/buổi {form.type === '1v1' ? '(1 kèm 1)' : '(nhóm đủ HV)'}
              </label>
              <input
                type="number"
                name="teacher_salary"
                value={form.teacher_salary}
                onChange={handleChange}
                placeholder="VD: 200000"
                className="input-field"
              />
              {form.teacher_salary > 0 && (
                <p className="text-xs text-green-600 mt-0.5">
                  ✅ {fmt(form.teacher_salary)}/buổi
                </p>
              )}
            </div>

            {form.type === 'group' && (
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">💰 Lương theo số HV có mặt</label>
                <p className="text-xs text-gray-400 mb-2">Nhập mức lương cho từng trường hợp số HV đi học</p>
                {id && <GroupSalaryRates classId={id} totalStudents={form.max_students || 3} />}
                {!id && <p className="text-xs text-orange-500">Lưu lớp trước, sau đó quay lại thiết lập bảng lương nhóm</p>}
              </div>
            )}
          </div>

          {/* Preview tổng lương cả khóa */}
          {form.teacher_salary > 0 && form.total_sessions > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-xs font-semibold text-blue-700 mb-1">📊 Dự tính lương cả khóa</p>
              <p className="text-sm text-blue-600">
                {form.total_sessions} buổi × {fmt(form.teacher_salary)} = <strong>{fmt(Number(form.teacher_salary) * Number(form.total_sessions))}</strong>
              </p>
              {form.type === 'group' && form.teacher_salary_partial > 0 && (
                <p className="text-xs text-orange-500 mt-1">
                  Nếu có HV vắng: {fmt(form.teacher_salary_partial)}/buổi
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Lịch học ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-bold text-gray-700">📅 Lịch học trong tuần</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Cần {spw} khung giờ ({spw} buổi/tuần) · Hiện có {slots.length}
              </p>
            </div>
            {slots.length < spw && (
              <button type="button" onClick={addSlot}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-600 rounded-xl text-sm font-medium hover:bg-primary-100">
                ➕ Thêm khung giờ
              </button>
            )}
          </div>

          {slots.length !== spw && (
            <div className={`mb-3 p-2 rounded-xl text-xs font-medium
              ${slots.length < spw ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
              {slots.length < spw
                ? `⚠️ Cần thêm ${spw - slots.length} khung giờ nữa`
                : `⚠️ Đang có ${slots.length} khung giờ, chỉ cần ${spw}`}
            </div>
          )}

          {slots.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm">Chưa có lịch học</p>
              <button type="button" onClick={addSlot}
                className="mt-2 text-primary-600 text-sm font-medium">
                + Thêm khung giờ
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {slots.map((slot, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-medium text-gray-500">Thứ</label>
                    <select value={slot.day_of_week}
                      onChange={e => updateSlot(i, 'day_of_week', Number(e.target.value))}
                      className="input-field text-sm py-2">
                      {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-medium text-gray-500">Giờ bắt đầu</label>
                    <select value={slot.time_start}
                      onChange={e => { const v=e.target.value; const[h,m]=v.split(':').map(Number); const end=`${String(Math.min(h+1,23)).padStart(2,'0')}:${String(m).padStart(2,'0')}`; setSlots(prev=>prev.map((s,idx)=>idx===i?{...s,time_start:v,time_end:end}:s)); }}
                      className="input-field text-sm py-2">
                      {Array.from({length:34},(_,j)=>{const h=Math.floor(j/2)+6;const m=j%2*30;const v=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;return <option key={v} value={v}>{v}</option>;})}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-medium text-gray-500">Giờ kết thúc</label>
                    <select value={slot.time_end}
                      onChange={e => updateSlot(i,'time_end',e.target.value)}
                      className="input-field text-sm py-2">
                      {Array.from({length:34},(_,j)=>{const h=Math.floor(j/2)+6;const m=j%2*30;const v=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;return <option key={v} value={v}>{v}</option>;})}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-medium text-gray-500">Phòng học</label>
                    <select value={slot.room_id}
                      onChange={e => updateSlot(i, 'room_id', e.target.value)}
                      className="input-field text-sm py-2">
                      <option value="">-- Chọn phòng --</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={() => removeSlot(i)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-100 flex-shrink-0">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slots.length > 0 && (
            <div className="mt-3 p-3 bg-primary-50 rounded-xl">
              <p className="text-xs text-primary-600 font-medium">
                📋 Lịch học: {buildScheduleText(slots)}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={() => navigate('/admin/classes')}>Hủy</Button>
          <Button loading={saving} icon={isEdit ? '💾' : '➕'} onClick={handleSubmit}>
            {isEdit ? 'Cập nhật' : 'Tạo lớp học'}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default ClassForm;