import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import scheduleService from '../../../services/scheduleService';
import teacherService from '../../../services/teacherService';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const DAYS = [
  { value: 2, label: 'Thứ 2' }, { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' }, { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' }, { value: 7, label: 'Thứ 7' },
  { value: 1, label: 'Chủ nhật' },
];

const EMPTY = {
  class_id: '', teacher_id: '', room_id: '',
  day_of_week: 2, time_start: '08:00', time_end: '09:00',
  type: '1v1', note: '',
};

const ScheduleForm = () => {
  const navigate = useNavigate();
  const [form, setForm]       = useState(EMPTY);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [rooms, setRooms]     = useState([]);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    teacherService.getAll().then(setTeachers).catch(() => {});
    api.get('/classes').then(d => setClasses(d.rows || [])).catch(() => {});
    api.get('/rooms').then(d => setRooms(d.rows || [])).catch(() => {});
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.teacher_id || !form.time_start) { toast.error('Điền đầy đủ thông tin!'); return; }
    setSaving(true);
    try {
      await scheduleService.create(form);
      toast.success('Thêm lịch học thành công!');
      navigate('/admin/schedule');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <MainLayout title="Thêm lịch học">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Lớp học</label>
            <select name="class_id" value={form.class_id} onChange={handleChange} className="input-field">
              <option value="">-- Chọn lớp --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Giáo viên <span className="text-red-500">*</span></label>
            <select name="teacher_id" value={form.teacher_id} onChange={handleChange} className="input-field">
              <option value="">-- Chọn giáo viên --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} - {t.instrument}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Phòng học</label>
            <select name="room_id" value={form.room_id} onChange={handleChange} className="input-field">
              <option value="">-- Chọn phòng --</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Thứ trong tuần</label>
            <select name="day_of_week" value={form.day_of_week} onChange={handleChange} className="input-field">
              {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <Input label="Giờ bắt đầu" name="time_start" type="time" value={form.time_start} onChange={handleChange} />
          <Input label="Giờ kết thúc" name="time_end"   type="time" value={form.time_end}   onChange={handleChange} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Hình thức</label>
            <select name="type" value={form.type} onChange={handleChange} className="input-field">
              <option value="1v1">1 kèm 1</option>
              <option value="group">Nhóm</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea name="note" value={form.note} onChange={handleChange} rows={2} className="input-field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-4 p-2">
          <Button variant="secondary" onClick={() => navigate('/admin/schedule')}>Hủy</Button>
          <Button loading={saving} icon="➕" onClick={handleSave}>Thêm lịch học</Button>
        </div>
      </Card>
    </MainLayout>
  );
};

export default ScheduleForm;