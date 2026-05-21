import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ROLE_LABEL   = { admin: 'Super Admin', staff: 'Nhân viên', teacher: 'Giáo viên', student: 'Học viên' };
const ROLE_VARIANT = { admin: 'red', staff: 'orange', teacher: 'blue', student: 'green' };

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [info, setInfo] = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  const [showPw, setShowPw]     = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPw, setSavingPw]   = useState(false);
  const [tab, setTab] = useState('info');

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!info.name || !info.phone) { toast.error('Điền đầy đủ thông tin!'); return; }
    setSavingInfo(true);
    await new Promise(r => setTimeout(r, 600));
    updateUser(info);
    toast.success('Cập nhật thông tin thành công!');
    setSavingInfo(false);
  };

  const handleSavePw = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword) { toast.error('Nhập mật khẩu hiện tại!'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Mật khẩu mới tối thiểu 6 ký tự!'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Mật khẩu không khớp!'); return; }
    setSavingPw(true);
    await new Promise(r => setTimeout(r, 600));
    toast.success('Đổi mật khẩu thành công!');
    setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setSavingPw(false);
  };

  return (
    <MainLayout title="Tài khoản của tôi">
      {/* Avatar & Info */}
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 text-3xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="mt-1">
              <Badge label={ROLE_LABEL[user?.role]} variant={ROLE_VARIANT[user?.role]} />
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-100">
        {[
          { key: 'info', label: '👤 Thông tin cá nhân' },
          { key: 'password', label: '🔒 Đổi mật khẩu' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all
              ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab thông tin */}
      {tab === 'info' && (
        <Card title="Chỉnh sửa thông tin">
          <form onSubmit={handleSaveInfo} className="flex flex-col gap-4 mt-2">
            <Input label="Họ và tên" name="name" value={info.name}
              onChange={e => setInfo({ ...info, name: e.target.value })}
              required placeholder="Nguyễn Văn A" />
            <Input label="Email" name="email" type="email" value={info.email}
              onChange={e => setInfo({ ...info, email: e.target.value })}
              required placeholder="email@gmail.com" icon="📧" />
            <Input label="Số điện thoại" name="phone" value={info.phone}
              onChange={e => setInfo({ ...info, phone: e.target.value })}
              required placeholder="0901234567" icon="📱" />
            <div className="flex justify-end">
              <Button type="submit" loading={savingInfo} icon="💾">Lưu thông tin</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab đổi mật khẩu */}
      {tab === 'password' && (
        <Card title="Đổi mật khẩu">
          <form onSubmit={handleSavePw} className="flex flex-col gap-4 mt-2">

            {/* Mật khẩu hiện tại */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Mật khẩu hiện tại <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  placeholder="••••••••" className="input-field pr-20" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">
                  {showPw ? '🙈 Ẩn' : '👁️ Hiện'}
                </button>
              </div>
            </div>

            <Input label="Mật khẩu mới" name="newPassword" type="password"
              value={pwForm.newPassword}
              onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
              placeholder="Tối thiểu 6 ký tự" />

            <Input label="Xác nhận mật khẩu mới" name="confirmPassword" type="password"
              value={pwForm.confirmPassword}
              onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              placeholder="Nhập lại mật khẩu mới" />

            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-700">💡 Mật khẩu tối thiểu 6 ký tự, nên kết hợp chữ và số.</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={savingPw} icon="🔒">Đổi mật khẩu</Button>
            </div>
          </form>
        </Card>
      )}
    </MainLayout>
  );
};

export default ProfilePage;