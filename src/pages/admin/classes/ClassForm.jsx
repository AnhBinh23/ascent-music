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
  schedule: '', max_students: 1, sessions_per_week: 1,
  status: 'Đang học', note: '',
  teacher_salary: '', teacher_salary_partial: '', is_flexible: 0,
};
const EMPTY_SLOT = { day_of_week: 2, time_start: '08:00', time_end: '09:00', room_id: '' };
const EMPTY_STUDENT_INFO = { level: 'Sơ cấp', tuition_fee: '', total_sessions: 16, start_date: '', end_date: '' };

const calcEndDate = (startDate, sessionsPerWeek, totalSessions) => {
  if (!startDate || !sessionsPerWeek || !totalSessions) return '';
  const weeks = Math.ceil(totalSessions / sessionsPerWeek);
  const end = new Date(startDate);
  end.setDate(end.getDate() + weeks * 7);
  return end.toISOString().split('T')[0];
};

const fmt = (n) => n ? Number(n).toLocaleString('vi-VN') + 'đ' : '—';

const ClassForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(EMPTY_CLASS);
  const [slots, setSlots] = useState([{ ...EMPTY_SLOT }]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [originalStudentIds, setOriginalStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [studentInfo, setStudentInfo] = useState({});
  const [expandedStudent, setExpandedStudent] = useState(null);

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
          name: c.name || '', instrument: c.instrument || 'Piano',
          type: c.is_flexible ? 'flexible' : (c.type || '1v1'),
          teacher_id: c.teacher_id || '', schedule: c.schedule || '',
          max_students: c.max_students || 1, sessions_per_week: c.sessions_per_week || 1,
          status: c.status || 'Đang học', note: c.note || '',
          teacher_salary: c.teacher_salary || '', teacher_salary_partial: c.teacher_salary_partial || '',
          is_flexible: c.is_flexible || 0,
        });
        const existing = (sched.rows || []).filter(s => s.class_id === id);
        if (existing.length > 0) {
          setSlots(existing.map(s => ({
            id: s.id, day_of_week: s.day_of_week,
            time_start: s.time_start?.slice(0,5) || '08:00',
            time_end: s.time_end?.slice(0,5) || '09:00',
            room_id: s.room_id || '',
          })));
        }
        const curStudents = stu.rows || [];
        setSelectedStudents(curStudents.map(s => ({ id: s.id, name: s.name, instrument: s.instrument })));
        setOriginalStudentIds(curStudents.map(s => s.id));
        const infoMap = {};
        curStudents.forEach(s => {
          infoMap[s.id] = {
            level: s.cs_level || 'Sơ cấp',
            tuition_fee: s.cs_tuition_fee || '',
            total_sessions: s.cs_total_sessions || 16,
            start_date: s.cs_start_date?.slice(0,10) || '',
            end_date: s.cs_end_date?.slice(0,10) || '',
          };
        });
        setStudentInfo(infoMap);
      }).catch(() => toast.error('Không tải được dữ liệu'))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleChange = e => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    if (name === 'type') {
      next.max_students = value === '1v1' ? 1 : next.max_students < 2 ? 5 : next.max_students;
      next.is_flexible = value === 'flexible' ? 1 : 0;
    }
    if (name === 'sessions_per_week') {
      const count = Number(value) || 1;
      setSlots(prev => {
        if (prev.length < count) return [...prev, ...Array.from({ length: count - prev.length }, () => ({ ...EMPTY_SLOT }))];
        if (prev.length > count) return prev.slice(0, count);
        return prev;
      });
    }
    setForm(next);
  };

  const updateStudentInfo = (sid, field, value) => {
    setStudentInfo(prev => {
      const cur = prev[sid] || { ...EMPTY_STUDENT_INFO };
      const next = { ...cur, [field]: value };
      if (['start_date', 'total_sessions'].includes(field)) {
        next.end_date = calcEndDate(
          field === 'start_date' ? value : next.start_date,
          Number(form.sessions_per_week) || 1,
          field === 'total_sessions' ? Number(value) : Number(next.total_sessions)
        );
      }
      return { ...prev, [sid]: next };
    });
  };

  const addSlot = () => setSlots([...slots, { ...EMPTY_SLOT }]);
  const removeSlot = (i) => setSlots(slots.filter((_, idx) => idx !== i));
  const updateSlot = (i, field, value) => {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };
  const buildScheduleText = (sl) =>
    sl.map(s => `${DAY_LABEL[s.day_of_week]} ${s.time_start}-${s.time_end}`).join(', ');

  const spw = Number(form.sessions_per_week) || 1;
  const isGroup = form.type === 'group' || form.type === 'flexible';

  const addStudent = (s) => {
    setSelectedStudents(prev => [...prev, { id: s.id, name: s.name, instrument: s.instrument }]);
    setStudentInfo(prev => ({ ...prev, [s.id]: { ...EMPTY_STUDENT_INFO } }));
    setStudentSearch('');
    setShowDropdown(false);
    setExpandedStudent(s.id);
  };
  const removeStudent = (sid) => {
    setSelectedStudents(prev => prev.filter(s => s.id !== sid));
    setStudentInfo(prev => { const n = { ...prev }; delete n[sid]; return n; });
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
        name: form.name, instrument: form.instrument,
        type: form.type === 'flexible' ? 'group' : form.type,
        is_flexible: form.type === 'flexible' ? 1 : 0,
        teacher_id: form.teacher_id, schedule: buildScheduleText(slots),
        max_students: Number(form.max_students) || 1,
        sessions_per_week: Number(form.sessions_per_week) || 1,
        status: form.status, note: form.note,
        teacher_salary: Number(form.teacher_salary) || 0,
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
        if (isEdit) {
          const cur = await api.get('/schedules');
          const existing = (cur.rows || []).filter(s => s.class_id === id);
          await Promise.all(existing.map(s => api.delete(`/schedules/${s.id}`).catch(() => {})));
        }
        await Promise.all(slots.map(s =>
          api.post('/schedules', {
            class_id: classId, teacher_id: form.teacher_id,
            room_id: s.room_id || null, day_of_week: Number(s.day_of_week),
            time_start: s.time_start.length === 5 ? s.time_start + ':00' : s.time_start,
            time_end: s.time_end.length === 5 ? s.time_end + ':00' : s.time_end,
            type: form.type, note: '',
          }).catch(() => {})
        ));

        const selectedIds = selectedStudents.map(s => s.id);
        const toAdd = selectedIds.filter(sid => !originalStudentIds.includes(sid));
        const toRemove = isEdit ? originalStudentIds.filter(sid => !selectedIds.includes(sid)) : [];
        const toUpdate = selectedIds.filter(sid => originalStudentIds.includes(sid));

        await Promise.all([
          ...toAdd.map(sid => {
            const info = studentInfo[sid] || EMPTY_STUDENT_INFO;
            return api.post(`/classes/${classId}/students`, {
              student_id: sid, course_number: 1,
              total_sessions: Number(info.total_sessions) || 16,
              level: info.level, tuition_fee: Number(info.tuition_fee) || 0,
              start_date: info.start_date, end_date: info.end_date,
            }).catch(() => {});
          }),
          ...toUpdate.map(sid => {
            const info = studentInfo[sid] || EMPTY_STUDENT_INFO;
            return api.put(`/classes/${classId}/students/${sid}`, {
              total_sessions: Number(info.total_sessions) || 16,
              level: info.level, tuition_fee: Number(info.tuition_fee) || 0,
              start_date: info.start_date, end_date: info.end_date,
            }).catch(() => {});
          }),
          ...toRemove.map(sid =>
            api.delete(`/classes/${classId}/students/${sid}`).catch(() => {})
          ),
        ]);
      }

      navigate('/admin/classes');
    } catch (err) {
      toast.error(err?.message || 'Có lỗi xảy ra!');
    } finally { setSaving(false); }
  };

  if (fetching) return (
    <MainLayout title={isEdit ? 'Chỉnh sửa lớp học' : 'Tạo lớp học'}>
      <p className="text-center py-16 text-gray-400">Đang tải...</p>
    </MainLayout>
  );

  return (
    <MainLayout title={isEdit ? 'Chỉnh sửa lớp học' : 'Tạo lớp học'}>
      <div className="flex flex-col gap-4">

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
                <option value="group">Nhóm cố định</option>
                <option value="flexible">🔄 Nhóm linh hoạt</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Giáo viên *</label>
              <select name="teacher_id" value={form.teacher_id} onChange={handleChange} className="input-field">
                <option value="">-- Chọn giáo viên --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.instrument}</option>)}
              </select>
            </div>
            {isGroup && (
              <Input label="Sĩ số tối đa" name="max_students" type="number"
                value={form.max_students} onChange={handleChange} />
            )}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">📅 Số buổi/tuần</label>
              <select name="sessions_per_week" value={form.sessions_per_week} onChange={handleChange} className="input-field">
                {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} buổi/tuần</option>)}
              </select>
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
              <textarea name="note" value={form.note} onChange={handleChange} rows={2} className="input-field resize-none" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-4">👨‍🎓 Học viên ({selectedStudents.length}{isGroup ? `/${maxStu}` : ''})</p>

          <div className="relative mb-3">
            <input type="text" placeholder={isFull ? '✅ Đã đủ học viên' : '🔍 Tìm và thêm học viên...'}
              value={studentSearch} disabled={isFull}
              onChange={e => { setStudentSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="input-field disabled:bg-gray-50 disabled:text-gray-400" />
            {showDropdown && studentSearch && !isFull && (
              <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto">
                {studentResults.length === 0 ? (
                  <p className="text-sm text-gray-400 p-3 text-center">Không tìm thấy</p>
                ) : (
                  studentResults.slice(0, 20).map(s => (
                    <div key={s.id} onMouseDown={() => addStudent(s)}
                      className="flex items-center gap-2.5 p-2.5 hover:bg-primary-50 cursor-pointer border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">
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

          {selectedStudents.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Chưa chọn học viên nào</p>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedStudents.map(s => {
                const info = studentInfo[s.id] || EMPTY_STUDENT_INFO;
                const isOpen = expandedStudent === s.id;
                return (
                  <div key={s.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedStudent(isOpen ? null : s.id)}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">
                          {s.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                          <p className="text-xs text-gray-400">
                            {info.level} · {info.total_sessions} buổi{info.tuition_fee ? ` · ${fmt(info.tuition_fee)}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{isOpen ? '▲' : '▼'}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeStudent(s.id); }}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:bg-red-100 hover:text-red-500">×</button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="p-3 bg-white border-t border-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">Trình độ</label>
                            <select value={info.level} onChange={e => updateStudentInfo(s.id, 'level', e.target.value)} className="input-field text-sm">
                              {LEVELS.map(l => <option key={l}>{l}</option>)}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">Gói khóa học</label>
                            <select value={info.total_sessions} onChange={e => updateStudentInfo(s.id, 'total_sessions', e.target.value)} className="input-field text-sm">
                              {COURSE_PACKAGES.map(p => <option key={p.sessions} value={p.sessions}>{p.label}</option>)}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">Học phí (đ)</label>
                            <input type="number" value={info.tuition_fee} placeholder="VD: 4800000"
                              onChange={e => updateStudentInfo(s.id, 'tuition_fee', e.target.value)} className="input-field text-sm" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">Ngày bắt đầu</label>
                            <input type="date" value={info.start_date}
                              onChange={e => updateStudentInfo(s.id, 'start_date', e.target.value)} className="input-field text-sm" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">Ngày kết thúc</label>
                            <input type="date" value={info.end_date} className="input-field text-sm bg-gray-50"
                              onChange={e => updateStudentInfo(s.id, 'end_date', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-1">💰 Lương giáo viên</p>
          <p className="text-xs text-gray-400 mb-4">Mức lương riêng cho lớp này</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                💰 Lương/buổi {form.type === '1v1' ? '(1 kèm 1)' : '(nhóm đủ HV)'}
              </label>
              <input type="number" name="teacher_salary" value={form.teacher_salary}
                onChange={handleChange} placeholder="VD: 200000" className="input-field" />
              {form.teacher_salary > 0 && (
                <p className="text-xs text-green-600 mt-0.5">✅ {fmt(form.teacher_salary)}/buổi</p>
              )}
            </div>
            {isGroup && (
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">💰 Lương khi có HV vắng</label>
                <p className="text-xs text-gray-400 mb-2">Nhập mức lương cho từng trường hợp</p>
                {id && <GroupSalaryRates classId={id} totalStudents={form.max_students || 3} />}
                {!id && <p className="text-xs text-orange-500">Lưu lớp trước, sau đó quay lại thiết lập bảng lương nhóm</p>}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-bold text-gray-700">📅 Lịch học trong tuần</p>
              <p className="text-xs text-gray-400 mt-0.5">Cần {spw} khung giờ · Hiện có {slots.length}</p>
            </div>
            {slots.length < spw && (
              <button type="button" onClick={addSlot}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-600 rounded-xl text-sm font-medium hover:bg-primary-100">
                ➕ Thêm khung giờ
              </button>
            )}
          </div>
          {slots.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm">Chưa có lịch học</p>
              <button type="button" onClick={addSlot} className="mt-2 text-primary-600 text-sm font-medium">+ Thêm</button>
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
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-100">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {slots.length > 0 && (
            <div className="mt-3 p-3 bg-primary-50 rounded-xl">
              <p className="text-xs text-primary-600 font-medium">📋 Lịch học: {buildScheduleText(slots)}</p>
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