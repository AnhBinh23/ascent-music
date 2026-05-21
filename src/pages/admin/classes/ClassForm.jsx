import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';
import teacherService from '../../../services/teacherService';
import { toast } from 'react-toastify';

const INSTRUMENTS = ['Piano', 'Guitar', 'Violin', 'Thanh nhạc'];
const LEVELS      = ['Sơ cấp', 'Trung cấp', 'Nâng cao'];
const EMPTY = {
  name: '', instrument: 'Piano', type: '1v1', teacher_id: '',
  room_id: '', max_students: 1, level: 'Sơ cấp',
  tuition_fee: 800000, schedule: '', start_date: '', end_date: '',
  status: 'Đang tuyển sinh', note: '',
};

const ClassForm = () => {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const isEdit      = !!id;
  const [form, setForm]       = useState(EMPTY);
  const [teachers, setTeachers] = useState([]);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    teacherService.getAll().then(setTeachers).catch(() => {});
    if (!isEdit) return;
    api.get(`/classes/${id}`).then(d => { if (d.row) setForm(d.row); }).catch(err => toast.error(err.message));
  }, [id, isEdit]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name) { toast.error('Nhập tên lớp!'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/classes/${id}`, form);
        toast.success('Cập nhật lớp học thành công!');
      } else {
        await api.post('/classes', form);
        toast.success('Tạo lớp học thành công!');
      }
      navigate('/admin/classes');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <MainLayout title={isEdit ? 'Chỉnh sửa lớp học' : 'Tạo lớp học mới'}>
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
          <div className="sm:col-span-2">
            <Input label="Tên lớp" name="name" value={form.name} onChange={handleChange} required placeholder="VD: Piano cơ bản 01" />
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
            <label className="text-sm font-medium text-gray-700">Giáo viên</label>
            <select name="teacher_id" value={form.teacher_id} onChange={handleChange} className="input-field">
              <option value="">-- Chọn giáo viên --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} - {t.instrument}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Trình độ</label>
            <select name="level" value={form.level} onChange={handleChange} className="input-field">
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <Input label="Lịch học" name="schedule" value={form.schedule} onChange={handleChange} placeholder="T2,T4 - 08:00-09:00" />
          <Input label="Học phí (đ)" name="tuition_fee" type="number" value={form.tuition_fee} onChange={handleChange} />
          <Input label="Ngày bắt đầu" name="start_date" type="date" value={form.start_date} onChange={handleChange} />
          <Input label="Ngày kết thúc" name="end_date" type="date" value={form.end_date} onChange={handleChange} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Trạng thái</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-field">
              <option>Đang tuyển sinh</option>
              <option>Đang học</option>
              <option>Đã kết thúc</option>
            </select>
          </div>
          <Input label="Sĩ số tối đa" name="max_students" type="number" value={form.max_students} onChange={handleChange} />
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea name="note" value={form.note} onChange={handleChange} rows={2} className="input-field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-4 p-2">
          <Button variant="secondary" onClick={() => navigate('/admin/classes')}>Hủy</Button>
          <Button loading={saving} icon={isEdit ? '💾' : '➕'} onClick={handleSave}>
            {isEdit ? 'Cập nhật' : 'Tạo lớp học'}
          </Button>
        </div>
      </Card>
    </MainLayout>
  );
};

export default ClassForm;