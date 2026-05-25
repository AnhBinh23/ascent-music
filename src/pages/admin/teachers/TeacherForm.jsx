import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import teacherService from '../../../services/teacherService';
import { toast } from 'react-toastify';

const INSTRUMENTS  = ['Piano', 'Guitar', 'Violin', 'Thanh nhạc'];
const SALARY_TYPES = ['Theo buổi', 'Theo giờ', 'Theo tháng'];
const EMPTY = {
  name: '', dob: '', gender: 'Nam', phone: '', email: '',
  address: '', instrument: 'Piano', experience: '',
  salary_type: 'Theo buổi', salary_amount: 200000, note: '', status: 'active',
};

const TeacherForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id }   = useParams();
  const basePath = location.pathname.startsWith('/staff') ? '/staff' : '/admin';
  const isEdit   = !!id;

  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    teacherService.getById(id)
      .then(data => { if (data) setForm(data); })
      .catch(err => toast.error(err.message));
  }, [id, isEdit]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name || !form.phone) { toast.error('Điền đầy đủ thông tin!'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await teacherService.update(id, form);
        toast.success('Cập nhật giáo viên thành công!');
      } else {
        await teacherService.create(form);
        toast.success('Thêm giáo viên thành công!');
      }
      navigate(`${basePath}/teachers`);
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra, thử lại!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title={isEdit ? 'Chỉnh sửa giáo viên' : 'Thêm giáo viên mới'}>
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
          <Input label="Họ và tên"     name="name"    value={form.name}    onChange={handleChange} required />
          <Input label="Số điện thoại" name="phone"   value={form.phone}   onChange={handleChange} required />
          <Input label="Ngày sinh"     name="dob"     type="date" value={form.dob?.slice(0, 10)} onChange={handleChange} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Giới tính</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
              <option>Nam</option><option>Nữ</option>
            </select>
          </div>
          <Input label="Email"      name="email"      type="email" value={form.email}      onChange={handleChange} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Chuyên môn</label>
            <select name="instrument" value={form.instrument} onChange={handleChange} className="input-field">
              {INSTRUMENTS.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <Input label="Kinh nghiệm"  name="experience"    value={form.experience}    onChange={handleChange} placeholder="VD: 5 năm" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Hình thức lương</label>
            <select name="salary_type" value={form.salary_type} onChange={handleChange} className="input-field">
              {SALARY_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Input label="Mức lương (đ)" name="salary_amount" type="number" value={form.salary_amount} onChange={handleChange} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Trạng thái</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-field">
              <option value="active">Đang dạy</option>
              <option value="inactive">Nghỉ</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Input label="Địa chỉ" name="address" value={form.address} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea name="note" value={form.note} onChange={handleChange}
              rows={3} className="input-field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-4 p-2">
          <Button variant="secondary" onClick={() => navigate(`${basePath}/teachers`)}>Hủy</Button>
          <Button loading={saving} icon={isEdit ? '💾' : '➕'} onClick={handleSave}>
            {isEdit ? 'Cập nhật' : 'Thêm giáo viên'}
          </Button>
        </div>
      </Card>
    </MainLayout>
  );
};

export default TeacherForm;