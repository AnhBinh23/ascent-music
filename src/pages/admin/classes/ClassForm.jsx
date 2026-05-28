import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../../../components/layout/MainLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import api from '../../../services/api';
import teacherService from '../../../services/teacherService';

const INSTRUMENTS = ['Piano', 'Guitar', 'Violin', 'Thanh nhạc'];
const LEVELS      = ['Sơ cấp', 'Trung cấp', 'Nâng cao'];
const DAYS        = [
  { value: 2, label: 'Thứ 2' }, { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' }, { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' }, { value: 7, label: 'Thứ 7' },
  { value: 1, label: 'Chủ nhật' },
];
const DAY_LABEL = { 1:'CN', 2:'T2', 3:'T3', 4:'T4', 5:'T5', 6:'T6', 7:'T7' };

const EMPTY_CLASS = {
  name: '', instrument: 'Piano', type: '1v1', teacher_id: '',
  level: 'Sơ cấp', schedule: '', fee: '', start_date: '', end_date: '',
  max_students: 1, status: 'active', note: '',
};

const EMPTY_SLOT = { day_of_week: 2, time_start: '08:00', time_end: '09:00', room_id: '' };

const ClassForm = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = !!id;

  const [form, setForm]       = useState(EMPTY_CLASS);
  const [slots, setSlots]     = useState([{ ...EMPTY_SLOT }]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms]     = useState([]);
  const [saving, setSaving]   = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    teacherService.getAll().then(setTeachers).catch(() => {});
    api.get('/rooms').then(d => setRooms(d.rows || [])).catch(() => {});

    if (isEdit) {
      Promise.all([
        api.get(`/classes/${id}`),
        api.get('/schedules'),
      ]).then(([cls, sched]) => {
        const c = cls.row || cls.rows?.[0] || {};
        setForm({
          name:         c.name         || '',
          instrument:   c.instrument   || 'Piano',
          type:         c.type         || '1v1',
          teacher_id:   c.teacher_id   || '',
          level:        c.level        || 'Sơ cấp',
          schedule:     c.schedule     || '',
          fee:          c.fee          || '',
          start_date:   c.start_date?.slice(0,10) || '',
          end_date:     c.end_date?.slice(0,10)   || '',
          max_students: c.max_students || 1,
          status:       c.status       || 'active',
          note:         c.note         || '',
        });
        // Load existing schedules for this class
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
      }).catch(() => toast.error('Không tải được dữ liệu'))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  // ── Slots (schedule) ─────────────────────────────────────────────────────────
  const addSlot = () => setSlots([...slots, { ...EMPTY_SLOT }]);
  const removeSlot = (i) => setSlots(slots.filter((_, idx) => idx !== i));
  const updateSlot = (i, field, value) => {
    const next = [...slots];
    next[i] = { ...next[i], [field]: value };
    setSlots(next);
  };

  // Auto-generate schedule text from slots
  const buildScheduleText = (sl) => {
    if (!sl.length) return '';
    return sl.map(s => `${DAY_LABEL[s.day_of_week]} ${s.time_start}-${s.time_end}`).join(', ');
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name || !form.teacher_id) { toast.error('Vui lòng điền tên lớp và chọn giáo viên!'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        schedule: buildScheduleText(slots),
        fee: Number(form.fee) || 0,
        max_students: Number(form.max_students) || 1,
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

      // Save schedules
      if (classId) {
        // Delete old schedules if editing
        if (isEdit) {
          // Get current schedules and delete them
          const cur = await api.get('/schedules');
          const existing = (cur.rows || []).filter(s => s.class_id === id);
          await Promise.all(existing.map(s => api.delete(`/schedules/${s.id}`).catch(() => {})));
        }
        // Create new schedules
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
              <Input label="Tên lớp *" name="name" value={form.name} onChange={handleChange} placeholder="VD: Piano 1-1 Mint" required />
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

            <Input label="Học phí (đ)" name="fee" type="number" value={form.fee} onChange={handleChange} placeholder="800000" />
            <Input label="Sĩ số tối đa" name="max_students" type="number" value={form.max_students} onChange={handleChange} />
            <Input label="Ngày bắt đầu" name="start_date" type="date" value={form.start_date} onChange={handleChange} />
            <Input label="Ngày kết thúc" name="end_date"   type="date" value={form.end_date}   onChange={handleChange} />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Trạng thái</label>
              <select name="status" value={form.status} onChange={handleChange} className="input-field">
                <option value="active">Đang học</option>
                <option value="inactive">Tạm dừng</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Ghi chú</label>
              <textarea name="note" value={form.note} onChange={handleChange} rows={2} className="input-field resize-none" />
            </div>
          </div>
        </div>

        {/* ── Lịch học ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-gray-700">📅 Lịch học trong tuần</p>
              <p className="text-xs text-gray-400 mt-0.5">Có thể thêm nhiều khung giờ khác nhau</p>
            </div>
            <button type="button" onClick={addSlot}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-600 rounded-xl text-sm font-medium hover:bg-primary-100 transition-colors">
              ➕ Thêm khung giờ
            </button>
          </div>

          {slots.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm">Chưa có lịch học</p>
              <button type="button" onClick={addSlot} className="mt-2 text-primary-600 text-sm font-medium">+ Thêm khung giờ</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {slots.map((slot, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  {/* Thứ */}
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-medium text-gray-500">Thứ</label>
                    <select value={slot.day_of_week}
                      onChange={e => updateSlot(i, 'day_of_week', Number(e.target.value))}
                      className="input-field text-sm py-2">
                      {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>

                  {/* Giờ bắt đầu */}
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-medium text-gray-500">Giờ bắt đầu</label>
                    <input type="time" value={slot.time_start}
                      onChange={e => updateSlot(i, 'time_start', e.target.value)}
                      className="input-field text-sm py-2" />
                  </div>

                  {/* Giờ kết thúc */}
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-medium text-gray-500">Giờ kết thúc</label>
                    <input type="time" value={slot.time_end}
                      onChange={e => updateSlot(i, 'time_end', e.target.value)}
                      className="input-field text-sm py-2" />
                  </div>

                  {/* Phòng */}
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-medium text-gray-500">Phòng học</label>
                    <select value={slot.room_id}
                      onChange={e => updateSlot(i, 'room_id', e.target.value)}
                      className="input-field text-sm py-2">
                      <option value="">-- Chọn phòng --</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>

                  {/* Xóa */}
                  <div className="flex items-end">
                    <button type="button" onClick={() => removeSlot(i)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors flex-shrink-0">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preview lịch */}
          {slots.length > 0 && (
            <div className="mt-3 p-3 bg-primary-50 rounded-xl">
              <p className="text-xs text-primary-600 font-medium">
                📋 Lịch học: {buildScheduleText(slots)}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
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