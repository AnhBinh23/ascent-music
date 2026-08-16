import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';
import scheduleService from '../../../services/scheduleService';
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

  const [form, setForm]         = useState(EMPTY);
  const [classes, setClasses]   = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms]       = useState([]);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, t, r] = await Promise.all([
          api.get('/classes'), api.get('/teachers'), api.get('/rooms'),
        ]);
        setClasses(c.rows || []);
        setTeachers(t.rows || []);
        setRooms(r.rows || []);
      } catch (err) { toast.error(err.message); }
    };
    load();
  }, []);

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  // Khi đổi giờ bắt đầu → tự nhảy giờ kết thúc +1h
  const handleTimeStartChange = (e) => {
    const start = e.target.value;
    if (!start) {
      setForm(prev => ({ ...prev, time_start: '' }));
      return;
    }
    const [h, m] = start.split(':').map(Number);
    const endH = String((h + 1) % 24).padStart(2, '0');
    const endM = String(m).padStart(2, '0');
    setForm(prev => ({ ...prev, time_start: start, time_end: `${endH}:${endM}` }));
  };

  // Khi chọn lớp → tự fill teacher
  const handleClassChange = (e) => {
    const classId = e.target.value;
    const cls = classes.find(c => c.id === classId);
    setForm(prev => ({
      ...prev,
      class_id: classId,
      teacher_id: cls?.teacher_id || prev.teacher_id,
    }));
  };

  const handleSave = async () => {
    if (!form.class_id || !form.time_start) { toast.error('Điền đầy đủ thông tin!'); return; }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Lớp học *</label>
            <select value={form.class_id} onChange={handleClassChange} className="input-field">
              <option value="">-- Chọn lớp --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Giáo viên *</label>
            <select value={form.teacher_id} onChange={handleChange('teacher_id')} className="input-field">
              <option value="">-- Chọn --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Thứ *</label>
            <select value={form.day_of_week} onChange={handleChange('day_of_week')} className="input-field">
              {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Phòng</label>
            <select value={form.room_id} onChange={handleChange('room_id')} className="input-field">
              <option value="">-- Chọn --</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Giờ bắt đầu *</label>
            <select value={form.time_start} onChange={handleTimeStartChange} className="input-field">
              {Array.from({length:35},(_,i)=>{const h=Math.floor(i/2)+6;const m=i%2*30;const v=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;return <option key={v} value={v}>{v}</option>;}).filter(o=>o.props.value<'23:30')}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Giờ kết thúc *</label>
            <select value={form.time_end} onChange={handleChange('time_end')} className="input-field">
              {Array.from({length:35},(_,i)=>{const h=Math.floor(i/2)+6;const m=i%2*30;const v=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;return <option key={v} value={v}>{v}</option>;}).filter(o=>o.props.value<='23:00')}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="secondary" onClick={() => navigate(-1)}>Hủy</Button>
          <Button onClick={handleSave} loading={saving}>✅ Lưu lịch</Button>
        </div>
      </Card>
    </MainLayout>
  );
};

export default ScheduleForm;