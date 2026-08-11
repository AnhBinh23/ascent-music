import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const INSTRUMENTS = ['Piano', 'Guitar', 'Violin', 'Thanh nhạc'];

const TeacherForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', phone: '', email: '', instrument: '',
    experience: '', salary_type: 'per_session', salary_amount: 0,
    status: 'active', note: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/teachers/${id}`).then(res => {
        if (res.row) setForm(res.row);
      }).catch(err => toast.error(err.message));
    }
  }, [id, isEdit]);

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const toggleInstrument = (inst) => {
    const selected = (form.instrument || '').split(', ').filter(Boolean);
    const updated = selected.includes(inst)
      ? selected.filter(i => i !== inst)
      : [...selected, inst];
    setForm(prev => ({ ...prev, instrument: updated.join(', ') }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.instrument) {
      toast.error('Vui lòng nhập tên và chọn nhạc cụ!');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/teachers/${id}`, form);
        toast.success('Cập nhật thành công!');
      } else {
        await api.post('/teachers', form);
        toast.success('Thêm giáo viên thành công!');
      }
      navigate(-1);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <MainLayout title={isEdit ? 'Chỉnh sửa giáo viên' : 'Thêm giáo viên'}>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Họ và tên *</label>
            <input value={form.name} onChange={handleChange('name')} className="input-field" placeholder="Nhập họ tên" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Số điện thoại</label>
            <input value={form.phone} onChange={handleChange('phone')} className="input-field" placeholder="0xxx xxx xxx" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <input value={form.email} onChange={handleChange('email')} className="input-field" placeholder="email@..." />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Kinh nghiệm</label>
            <input value={form.experience} onChange={handleChange('experience')} className="input-field" placeholder="VD: 3 năm" />
          </div>

          {/* Nhạc cụ - chọn nhiều */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Chuyên môn *</label>
            <div className="flex flex-wrap gap-3">
              {INSTRUMENTS.map(inst => {
                const selected = (form.instrument || '').split(', ').filter(Boolean);
                const isChecked = selected.includes(inst);
                return (
                  <label key={inst}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-primary-50 border-primary-400 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <input type="checkbox" className="hidden" checked={isChecked}
                      onChange={() => toggleInstrument(inst)} />
                    <span className="text-sm font-medium">{inst}</span>
                    {isChecked && <span className="text-primary-600">✓</span>}
                  </label>
                );
              })}
            </div>
            {form.instrument && (
              <p className="text-xs text-primary-500 mt-2">Đã chọn: {form.instrument}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Trạng thái</label>
            <select value={form.status} onChange={handleChange('status')} className="input-field">
              <option value="active">Đang dạy</option>
              <option value="inactive">Nghỉ</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Ghi chú</label>
            <textarea value={form.note || ''} onChange={handleChange('note')} className="input-field" rows={3} placeholder="Ghi chú thêm..." />
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="secondary" onClick={() => navigate(-1)}>Hủy</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEdit ? '💾 Cập nhật' : '➕ Thêm giáo viên'}
          </Button>
        </div>
      </Card>
    </MainLayout>
  );
};

export default TeacherForm;