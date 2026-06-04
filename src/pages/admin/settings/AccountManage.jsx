import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ── Modal tạo tài khoản ───────────────────────────────────────
const CreateModal = ({ tab, onClose, onDone }) => {
  const [type, setType]       = useState(tab);
  const [list, setList]       = useState([]);
  const [selected, setSelected] = useState('');
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('123456');
  const [show, setShow]       = useState(false);
  const [saving, setSaving]   = useState(false);

  // Load danh sách chưa có tài khoản
  useEffect(() => {
    setSelected(''); setEmail('');
    api.get(`/auth/no-account?type=${type}`)
      .then(r => setList(r.rows || []))
      .catch(() => setList([]));
  }, [type]);

  // Khi chọn người, gợi ý email
  const handleSelect = (id) => {
    setSelected(id);
    const person = list.find(p => p.id === id);
    if (person) {
      // Gợi ý email từ tên: loại bỏ dấu, lấy tên + id
      const suggestion = `${person.name.split(' ').pop()}${id}@ascentmusic.vn`
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/gi, 'd').replace(/\s+/g, '');
      setEmail(suggestion);
    }
  };

  const handleSubmit = async () => {
    if (!selected) { toast.error('Vui lòng chọn người!'); return; }
    if (!email)    { toast.error('Vui lòng nhập email!'); return; }
    if (pass.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự!'); return; }

    const person = list.find(p => p.id === selected);
    setSaving(true);
    try {
      await api.post('/auth/create-account', {
        link_id:   selected,
        link_type: type,
        name:      person?.name || '',
        email,
        password:  pass,
      });
      toast.success(`✅ Đã tạo tài khoản ${email}!`);
      onDone();
      onClose();
    } catch (e) {
      toast.error(e.message || 'Có lỗi xảy ra!');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl mx-4"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800">👤 Tạo tài khoản mới</h3>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs">✕</button>
        </div>

        {/* Chọn loại */}
        <div className="flex gap-2 mb-4">
          {['teacher','student'].map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors
                ${type === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t === 'teacher' ? '👨‍🏫 Giáo viên' : '👨‍🎓 Học viên'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {/* Chọn người */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">
              Chọn {type === 'teacher' ? 'giáo viên' : 'học viên'}
            </label>
            {list.length === 0 ? (
              <div className="p-3 bg-green-50 rounded-xl text-xs text-green-700 text-center">
                ✅ Tất cả đã có tài khoản!
              </div>
            ) : (
              <select value={selected} onChange={e => handleSelect(e.target.value)}
                className="input-field">
                <option value="">-- Chọn --</option>
                {list.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Email đăng nhập</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="VD: TenHV2010@ascentmusic.vn" className="input-field" />
          </div>

          {/* Mật khẩu */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Mật khẩu mặc định</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={pass}
                onChange={e => setPass(e.target.value)} className="input-field pr-16" />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {show ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            <p className="text-xs text-gray-400">Nên đổi mật khẩu sau khi đăng nhập lần đầu</p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Hủy</button>
          <button onClick={handleSubmit}
            disabled={saving || !selected || !email || list.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-40">
            {saving ? '⏳ Đang tạo...' : '✅ Tạo tài khoản'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Modal đặt lại mật khẩu ────────────────────────────────────
const ResetModal = ({ user, onClose, onDone }) => {
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow]       = useState(false);
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async () => {
    if (newPass.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự!'); return; }
    if (newPass !== confirm)  { toast.error('Mật khẩu xác nhận không khớp!'); return; }
    setSaving(true);
    try {
      await api.post('/auth/reset-password', { user_id: user.id, new_password: newPass });
      toast.success(`✅ Đã đặt lại mật khẩu cho ${user.name}!`);
      onDone();
      onClose();
    } catch (e) {
      toast.error(e.message || 'Có lỗi xảy ra!');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl mx-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-800">🔑 Đặt lại mật khẩu</h3>
            <p className="text-xs text-gray-400 mt-0.5">{user?.name} · {user?.email}</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs">✕</button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Mật khẩu mới</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Tối thiểu 6 ký tự" className="input-field pr-16" />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {show ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Xác nhận mật khẩu</label>
            <input type={show ? 'text' : 'password'} value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu" className="input-field" />
          </div>
          {newPass && confirm && (
            <p className={`text-xs ${newPass === confirm ? 'text-green-500' : 'text-red-500'}`}>
              {newPass === confirm ? '✅ Mật khẩu khớp' : '❌ Mật khẩu không khớp'}
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Hủy</button>
          <button onClick={handleSubmit}
            disabled={saving || newPass !== confirm || newPass.length < 6}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-40">
            {saving ? '⏳ Đang lưu...' : '🔑 Đặt lại'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Bảng tài khoản ────────────────────────────────────────────
const AccountTable = ({ accounts, loading, onReset, onToggle }) => {
  if (loading) return <div className="text-center py-12 text-gray-400">Đang tải...</div>;
  if (!accounts.length) return <div className="text-center py-12 text-gray-400">Không có tài khoản nào</div>;

  return (
    <div className="flex flex-col gap-2">
      {accounts.map(u => (
        <div key={u.id}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
            ${u.status === 'active'
              ? 'bg-gray-50 border-gray-100 hover:border-primary-100'
              : 'bg-red-50/40 border-red-100'}`}>

          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
            ${u.role === 'teacher' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
            {u.name?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-800">{u.name}</p>
              <Badge
                label={u.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                variant={u.status === 'active' ? 'green' : 'gray'} dot
              />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-gray-400">🕐 Tạo: {fmt(u.created_at)}</span>
              <span className={`text-xs font-medium ${u.password_updated_at ? 'text-orange-500' : 'text-gray-400'}`}>
                🔑 MK: {fmt(u.password_updated_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => onReset(u)}
              className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg">
              🔑 Đặt lại MK
            </button>
            <button onClick={() => onToggle(u)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg
                ${u.status === 'active'
                  ? 'bg-red-50 text-red-500 hover:bg-red-100'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
              {u.status === 'active' ? '🔒 Khóa' : '🔓 Mở'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────
const AccountManage = () => {
  const [tab, setTab]             = useState('teacher');
  const [teachers, setTeachers]   = useState([]);
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [resetUser, setResetUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch]       = useState('');

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const [tvRes, hvRes] = await Promise.all([
        api.get('/auth/accounts?role=teacher'),
        api.get('/auth/accounts?role=student'),
      ]);
      setTeachers(tvRes.rows || []);
      setStudents(hvRes.rows || []);
    } catch (e) {
      toast.error(e.message || 'Không tải được dữ liệu!');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const handleToggle = async (u) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    const label     = newStatus === 'active' ? 'mở' : 'khóa';
    if (!window.confirm(`Bạn có chắc muốn ${label} tài khoản của ${u.name}?`)) return;
    try {
      await api.patch(`/auth/accounts/${u.id}/status`, { status: newStatus });
      toast.success(`✅ Đã ${label} tài khoản ${u.name}!`);
      await loadAccounts();
    } catch (e) { toast.error(e.message || 'Có lỗi xảy ra!'); }
  };

  const list     = tab === 'teacher' ? teachers : students;
  const filtered = list.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout title="Quản lý tài khoản">
      {showCreate && (
        <CreateModal
          tab={tab}
          onClose={() => setShowCreate(false)}
          onDone={loadAccounts}
        />
      )}
      {resetUser && (
        <ResetModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onDone={loadAccounts}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-2">
          {['teacher','student'].map(t => (
            <button key={t} onClick={() => { setTab(t); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors
                ${tab === t
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {t === 'teacher' ? '👨‍🏫 Giáo viên' : '👨‍🎓 Học viên'}
              <span className={`text-xs px-1.5 py-0.5 rounded-full
                ${tab === t ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {t === 'teacher' ? teachers.length : students.length}
              </span>
            </button>
          ))}
        </div>
        <Button icon="➕" onClick={() => setShowCreate(true)}>
          Tạo tài khoản
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xl font-bold text-primary-600">{list.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Tổng</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xl font-bold text-green-600">{list.filter(u => u.status === 'active').length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Hoạt động</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xl font-bold text-red-500">{list.filter(u => u.status !== 'active').length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Đã khóa</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={`Tìm ${tab === 'teacher' ? 'giáo viên' : 'học viên'}...`}
          className="input-field pl-9" />
      </div>

      {/* Danh sách */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-700">
            {tab === 'teacher' ? '👨‍🏫 Tài khoản giáo viên' : '👨‍🎓 Tài khoản học viên'}
            {search && <span className="text-gray-400 font-normal"> · {filtered.length} kết quả</span>}
          </p>
          <button onClick={loadAccounts}
            className="text-xs text-gray-400 hover:text-primary-600 px-2 py-1 rounded-lg hover:bg-gray-50">
            🔄 Tải lại
          </button>
        </div>
        <AccountTable
          accounts={filtered}
          loading={loading}
          onReset={setResetUser}
          onToggle={handleToggle}
        />
      </div>
    </MainLayout>
  );
};

export default AccountManage;