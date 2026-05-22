import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';

const ROLE_LABEL = {
  admin:   '🔴 Super Admin',
  staff:   '🟠 Nhân viên',
  teacher: '🔵 Giáo viên',
  student: '🟢 Học viên',
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab]         = useState('info');
  const [form, setForm]       = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [saving, setSaving]   = useState(false);
  const [showPw, setShowPw]   = useState({});

  const handleChange   = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePwChange = e => setPwForm({ ...pwForm, [e.target.name]: e.target.value });

  const handleSaveInfo = async () => {
    if (!form.name || !form.phone) { toast.error('Điền đầy đủ thông tin!'); return; }
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      updateUser(form);
      toast.success('✅ Cập nhật thông tin thành công!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) { toast.error('Điền đầy đủ!'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Mật khẩu mới không khớp!'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Mật khẩu ít nhất 6 ký tự!'); return; }
    setSaving(true);
    try {
      await api.put('/auth/password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success('✅ Đổi mật khẩu thành công!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Hồ sơ cá nhân">
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6 p-5 bg-white rounded-2xl border border-gray-100">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-2xl">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="text-xl font-bold text-gray-800">{user?.name}</p>
          <p className="text-sm text-gray-500">{ROLE_LABEL[user?.role]}</p>
          <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-gray-100">
        {[
          { key: 'info',     label: '👤 Thông tin'   },
          { key: 'password', label: '🔒 Mật khẩu'    },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all
              ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab thông tin */}
      {tab === 'info' && (
        <Card title="Thông tin cá nhân">
          <div className="flex flex-col gap-4 mt-3">
            <Input label="Họ và tên" name="name" value={form.name}
              onChange={handleChange} required />
            <Input label="Số điện thoại" name="phone" value={form.phone}
              onChange={handleChange} icon="📱" />
            <Input label="Email" name="email" type="email" value={form.email}
              onChange={handleChange} icon="📧" />
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">Vai trò: <span className="font-medium">{ROLE_LABEL[user?.role]}</span></p>
              <p className="text-xs text-gray-400 mt-0.5">Không thể thay đổi vai trò</p>
            </div>
            <Button loading={saving} icon="💾" onClick={handleSaveInfo}>
              Lưu thông tin
            </Button>
          </div>
        </Card>
      )}

      {/* Tab đổi mật khẩu */}
      {tab === 'password' && (
        <Card title="Đổi mật khẩu">
          <div className="flex flex-col gap-4 mt-3">
            {[
              { name: 'currentPassword', label: 'Mật khẩu hiện tại' },
              { name: 'newPassword',     label: 'Mật khẩu mới'      },
              { name: 'confirmPassword', label: 'Xác nhận mật khẩu' },
            ].map(field => (
              <div key={field.name} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{field.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                  <input
                    type={showPw[field.name] ? 'text' : 'password'}
                    name={field.name}
                    value={pwForm[field.name]}
                    onChange={handlePwChange}
                    className="input-field pl-10 pr-12"
                    placeholder="••••••••"
                  />
                  <button type="button"
                    onClick={() => setShowPw(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    {showPw[field.name] ? '🙈 Ẩn' : '👁️ Hiện'}
                  </button>
                </div>
              </div>
            ))}

            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-700">💡 Mật khẩu phải có ít nhất 6 ký tự</p>
            </div>

            <Button loading={saving} icon="🔒" onClick={handleChangePassword}>
              Đổi mật khẩu
            </Button>
          </div>
        </Card>
      )}
    </MainLayout>
  );
};

export default ProfilePage;