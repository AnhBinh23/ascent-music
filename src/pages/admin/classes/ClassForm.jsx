import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const INSTRUMENTS = ['Piano', 'Guitar', 'Violin', 'Thanh nhạc'];
const ROOMS = ['Phòng 1', 'Phòng 2', 'Phòng 3', 'Phòng 4'];
const LEVELS = ['Sơ cấp', 'Trung cấp', 'Nâng cao'];

const EMPTY = {
  name: '', instrument: 'Piano', type: '1v1', teacher: '',
  room: 'Phòng 1', maxStudents: 1, level: 'Sơ cấp',
  startDate: '', endDate: '', tuitionFee: '',
  schedule: '', status: 'Đang tuyển sinh', note: '',
};

const ClassForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'type' ? { maxStudents: value === '1v1' ? 1 : 3 } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.teacher) { toast.error('Vui lòng điền đầy đủ thông tin!'); return; }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      toast.success('Tạo lớp học thành công!');
      navigate('/admin/classes');
    } catch { toast.error('Có lỗi xảy ra!'); }
    finally { setLoading(false); }
  };

  return (
    <MainLayout title="Thêm lớp học">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Thông tin lớp học">
            <div className="flex flex-col gap-4">
              <Input label="Tên lớp" name="name" value={form.name} onChange={handleChange}
                required placeholder="VD: Piano cơ bản 01" />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Nhạc cụ</label>
                <select name="instrument" value={form.instrument} onChange={handleChange} className="input-field">
                  {INSTRUMENTS.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Hình thức</label>
                <div className="grid grid-cols-2 gap-2">
                  {['1v1', 'group'].map(t => (
                    <button key={t} type="button"
                      onClick={() => handleChange({ target: { name: 'type', value: t } })}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all
                        ${form.type === t ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                      {t === '1v1' ? '🎹 1 kèm 1' : '👥 Nhóm (tối đa 3)'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Trình độ</label>
                <select name="level" value={form.level} onChange={handleChange} className="input-field">
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <Input label="Học phí (VNĐ/tháng)" name="tuitionFee" value={form.tuitionFee}
                onChange={handleChange} placeholder="VD: 800000" />
            </div>
          </Card>

          <Card title="Lịch & Phân công">
            <div className="flex flex-col gap-4">
              <Input label="Giáo viên phụ trách" name="teacher" value={form.teacher}
                onChange={handleChange} required placeholder="Tên giáo viên" />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Phòng học</label>
                <select name="room" value={form.room} onChange={handleChange} className="input-field">
                  {ROOMS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <Input label="Lịch học" name="schedule" value={form.schedule}
                onChange={handleChange} placeholder="VD: Thứ 2, 4 - 08:00~09:00" />
              <Input label="Ngày khai giảng" name="startDate" type="date"
                value={form.startDate} onChange={handleChange} />
              <Input label="Ngày kết thúc dự kiến" name="endDate" type="date"
                value={form.endDate} onChange={handleChange} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                <select name="status" value={form.status} onChange={handleChange} className="input-field">
                  <option>Đang tuyển sinh</option>
                  <option>Đang học</option>
                  <option>Đã kết thúc</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea name="note" value={form.note} onChange={handleChange}
                  rows={3} className="input-field resize-none" placeholder="Ghi chú..." />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <Button variant="secondary" type="button" onClick={() => navigate('/admin/classes')}>Hủy</Button>
          <Button type="submit" loading={loading} icon="➕">Tạo lớp học</Button>
        </div>
      </form>
    </MainLayout>
  );
};

export default ClassForm;