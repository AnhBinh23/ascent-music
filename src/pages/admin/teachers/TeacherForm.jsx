import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Loading from '../../../components/ui/Loading';
import teacherService from '../../../services/teacherService';

const INSTRUMENTS = ['Piano', 'Guitar', 'Violin', 'Thanh nhạc'];
const SALARY_TYPES = ['Theo buổi', 'Theo giờ', 'Theo tháng'];

const EMPTY = {
  name: '', dob: '', gender: 'Nam', phone: '', email: '',
  address: '', instrument: 'Piano', experience: '',
  salaryType: 'Theo buổi', salaryAmount: '', note: '', status: 'active',
};

const TeacherForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    teacherService.getById(id)
      .then(data => { if (data) setForm(data); })
      .catch(() => toast.error('Không tải được dữ liệu'))
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Vui lòng điền đầy đủ thông tin!'); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await teacherService.update(id, form);
        toast.success('Cập nhật giáo viên thành công!');
      } else {
        await teacherService.create({ ...form, id: `GV${Date.now()}`, createdAt: new Date().toISOString() });
        toast.success('Thêm giáo viên thành công!');
      }
      navigate('/admin/teachers');
    } catch { toast.error('Có lỗi xảy ra!'); }
    finally { setLoading(false); }
  };

  if (fetching) return <MainLayout title="Giáo viên"><Loading /></MainLayout>;

  return (
    <MainLayout title={isEdit ? 'Chỉnh sửa giáo viên' : 'Thêm giáo viên'}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Thông tin cá nhân">
            <div className="flex flex-col gap-4">
              <Input label="Họ và tên" name="name" value={form.name} onChange={handleChange} required placeholder="Nguyễn Thị Mai" />
              <Input label="Ngày sinh" name="dob" type="date" value={form.dob} onChange={handleChange} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Giới tính</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
                  <option>Nam</option><option>Nữ</option>
                </select>
              </div>
              <Input label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} required placeholder="0901234567" />
              <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="giaovien@gmail.com" />
              <Input label="Địa chỉ" name="address" value={form.address} onChange={handleChange} placeholder="Địa chỉ..." />
            </div>
          </Card>

          <Card title="Thông tin giảng dạy">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Chuyên môn <span className="text-red-500">*</span></label>
                <select name="instrument" value={form.instrument} onChange={handleChange} className="input-field">
                  {INSTRUMENTS.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <Input label="Kinh nghiệm" name="experience" value={form.experience} onChange={handleChange} placeholder="VD: 5 năm" />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Hình thức tính lương</label>
                <select name="salaryType" value={form.salaryType} onChange={handleChange} className="input-field">
                  {SALARY_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <Input label="Mức lương" name="salaryAmount" value={form.salaryAmount} onChange={handleChange} placeholder="VD: 200000" />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                <select name="status" value={form.status} onChange={handleChange} className="input-field">
                  <option value="active">Đang dạy</option>
                  <option value="inactive">Nghỉ</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea name="note" value={form.note} onChange={handleChange} rows={3} className="input-field resize-none" placeholder="Ghi chú..." />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <Button variant="secondary" type="button" onClick={() => navigate('/admin/teachers')}>Hủy</Button>
          <Button type="submit" loading={loading} icon={isEdit ? '💾' : '➕'}>
            {isEdit ? 'Cập nhật' : 'Thêm giáo viên'}
          </Button>
        </div>
      </form>
    </MainLayout>
  );
};

export default TeacherForm;