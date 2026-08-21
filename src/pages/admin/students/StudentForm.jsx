import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Loading from '../../../components/ui/Loading';
import studentService from '../../../services/studentService';
import MoneyInput from '../../../components/ui/MoneyInput';
const INSTRUMENTS = ['Piano', 'Guitar', 'Violin', 'Thanh nhạc'];
const LEVELS      = ['Sơ cấp', 'Trung cấp', 'Nâng cao'];
const COURSE_PACKAGES = [
  { sessions: 16, label: 'Khóa 16 buổi' },
  { sessions: 24, label: 'Khóa 24 buổi' },
];

const EMPTY = {
  name: '', dob: '', gender: 'Nam', phone: '', email: '',
  address: '', instrument: 'Piano', level: 'Sơ cấp',
  parentName: '', parentPhone: '', note: '', status: 'active',
    total_sessions: 16, tuition_fee: '', start_date: '', end_date: '', bonus_sessions: 0,
};

const fmt = (n) => n ? Number(n).toLocaleString('vi-VN') + 'đ' : '';

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
          dob: data.dob ? data.dob.slice(0, 10) : '',
          start_date: data.start_date ? data.start_date.slice(0, 10) : '',
          end_date: data.end_date ? data.end_date.slice(0, 10) : '',
          total_sessions: data.total_sessions || 16,
          bonus_sessions: data.bonus_sessions || 0,
          tuition_fee: data.tuition_fee || '',
        });
      } catch {
        toast.error('Không tải được dữ liệu');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [id, isEdit]);

  const handleChange = e => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    if (name === 'start_date' || name === 'total_sessions') {
      const startDate = name === 'start_date' ? value : next.start_date;
      const total = Number(name === 'total_sessions' ? value : next.total_sessions) || 16;
      if (startDate) {
        const weeks = Math.ceil(total / 1);
        const end = new Date(startDate);
        end.setDate(end.getDate() + weeks * 7);
        next.end_date = end.toISOString().split('T')[0];
      }
    }
    setForm(next);
  };

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
        dob: form.dob ? form.dob.slice(0, 10) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        total_sessions: Number(form.total_sessions) || 0,
        tuition_fee: Number(form.tuition_fee) || 0,
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
              <Input label="Số điện thoại *" name="phone" value={form.phone}
                onChange={handleChange} required placeholder="0901234567" />
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
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">📦 Gói khóa học</label>
                <select name="total_sessions" value={form.total_sessions} onChange={handleChange} className="input-field">
                  {COURSE_PACKAGES.map(p => <option key={p.sessions} value={p.sessions}>{p.label}</option>)}
                </select>
              </div>
                            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">🎁 Buổi tặng thêm</label>
                <input type="number" name="bonus_sessions" value={form.bonus_sessions || 0}
                  onChange={handleChange} min="0" className="input-field" />
                {form.bonus_sessions > 0 && (
                  <p className="text-xs text-green-600 mt-0.5">
                    Tổng: {Number(form.total_sessions||0) + Number(form.bonus_sessions||0)} buổi ({form.total_sessions} + {form.bonus_sessions} tặng)
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">💰 Học phí (đ)</label>
                <MoneyInput name="tuition_fee" value={form.tuition_fee} onChange={handleChange} />
                {form.tuition_fee > 0 && (
                  <p className="text-xs text-green-600 mt-0.5">{fmt(form.tuition_fee)}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">📅 Ngày bắt đầu</label>
                <input type="date" name="start_date" value={form.start_date}
                  onChange={handleChange} className="input-field" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">📅 Ngày kết thúc</label>
                <input type="date" name="end_date" value={form.end_date}
                  onChange={handleChange} className="input-field bg-gray-50" />
                {form.start_date && form.end_date && (
                  <p className="text-xs text-primary-500 mt-0.5">
                    📦 {form.total_sessions} buổi · ~{Math.ceil(Number(form.total_sessions)/1)} tuần
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                <select name="status" value={form.status} onChange={handleChange} className="input-field">
                  <option value="active">Đang học</option>
                  <option value="paused">Tạm nghỉ</option>
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
