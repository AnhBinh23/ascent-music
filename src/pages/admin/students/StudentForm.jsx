import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Loading from '../../../components/ui/Loading';
import studentService from '../../../services/studentService';

const INSTRUMENTS = ['Piano', 'Guitar', 'Violin', 'Thanh nhạc'];
const LEVELS      = ['Sơ cấp', 'Trung cấp', 'Nâng cao'];

const EMPTY = {
  name: '', dob: '', gender: 'Nam', phone: '',
  address: '', instrument: 'Piano', level: 'Sơ cấp',
  parentName: '', parentPhone: '', note: '', status: 'active',
};

const StudentForm = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/staff') ? '/staff' : '/admin';
  const isEdit   = !!id;

  const [form, setForm]         = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const data = await studentService.getById(id);
        if (data) setForm({
          ...data,
          dob: data.dob ? data.dob.slice(0, 10) : '', // ← cắt về YYYY-MM-DD
        });
      } catch {
        toast.error('Không tải được dữ liệu');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [id, isEdit]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        dob: form.dob ? form.dob.slice(0, 10) : null, // ← đảm bảo YYYY-MM-DD
      };
      if (isEdit) {
        await studentService.update(id, payload);
        toast.success('Cập nhật học viên thành công!');
      } else {
        await studentService.create(payload);
        toast.success('Thêm học viên thành công!');
      }
      navigate(`${basePath}/students`);
    } catch (err) {
      toast.error(err?.message || 'Có lỗi xảy ra, thử lại!');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <MainLayout title={isEdit ? 'Chỉnh sửa học viên' : 'Thêm học viên'}>
      <Loading />
    </MainLayout>
  );

  return (
    <MainLayout title={isEdit ? 'Chỉnh sửa học viên' : 'Thêm học viên'}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <Card title="Thông tin cá nhân">
            <div className="flex flex-col gap-4">
              <Input label="Họ và tên" name="name" value={form.name}
                onChange={handleChange} required placeholder="Nguyễn Văn A" />
              <Input label="Ngày sinh" name="dob" type="date"
                value={form.dob} onChange={handleChange} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Giới tính</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
                  <option>Nam</option>
                  <option>Nữ</option>
                </select>
              </div>
              <Input label="SĐT phụ huynh" name="phone" value={form.phone}
                onChange={handleChange} required placeholder="0901234567" />
              <Input label="Địa chỉ" name="address" value={form.address}
                onChange={handleChange} placeholder="Số nhà, đường, phường..." />
            </div>
          </Card>

          <Card title="Thông tin học tập">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Nhạc cụ học <span className="text-red-500">*</span>
                </label>
                <select name="instrument" value={form.instrument} onChange={handleChange} className="input-field">
                  {INSTRUMENTS.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Trình độ</label>
                <select name="level" value={form.level} onChange={handleChange} className="input-field">
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <Input label="Tên phụ huynh" name="parentName" value={form.parentName}
                onChange={handleChange} placeholder="Nguyễn Thị B" />
              <Input label="SĐT phụ huynh (2)" name="parentPhone" value={form.parentPhone}
                onChange={handleChange} placeholder="0912345678" />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                <select name="status" value={form.status} onChange={handleChange} className="input-field">
                  <option value="active">Đang học</option>
                  <option value="inactive">Nghỉ học</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea name="note" value={form.note} onChange={handleChange}
                  rows={3} placeholder="Ghi chú thêm..."
                  className="input-field resize-none" />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <Button variant="secondary" type="button"
            onClick={() => navigate(`${basePath}/students`)}>
            Hủy
          </Button>
          <Button type="submit" loading={loading} icon={isEdit ? '💾' : '➕'}>
            {isEdit ? 'Cập nhật' : 'Thêm học viên'}
          </Button>
        </div>
      </form>
    </MainLayout>
  );
};

export default StudentForm;