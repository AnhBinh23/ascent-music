import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Loading from '../../../components/ui/Loading';
import studentService from '../../../services/studentService';
import api from '../../../services/api';

const levelVariant = { 'Sơ cấp': 'blue', 'Trung cấp': 'orange', 'Nâng cao': 'purple' };
const fmt = n => n ? Number(n).toLocaleString('vi-VN') + 'đ' : '—';
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const Row = ({ label, value }) => (
  <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-800 text-right">{value || '—'}</span>
  </div>
);

const CreateAccountModal = ({ student, onClose, onSuccess }) => {
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('123456');
  const [show, setShow]       = useState(false);
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async () => {
    if (!email) { toast.error('Vui lòng nhập email!'); return; }
    if (pass.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự!'); return; }
    setSaving(true);
    try {
      await api.post('/auth/create-account', {
        link_id: student.id, link_type: 'student',
        name: student.name, email, password: pass,
      });
      toast.success(`Đã tạo tài khoản ${email}!`);
      onSuccess(email);
      onClose();
    } catch (e) { toast.error(e.message || 'Có lỗi xảy ra!'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-800">👤 Tạo tài khoản</h3>
            <p className="text-xs text-gray-400 mt-0.5">{student?.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs">✕</button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Email đăng nhập</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="VD: TenHV2010@ascentmusic.vn" className="input-field" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Mật khẩu mặc định</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={pass}
                onChange={e => setPass(e.target.value)} className="input-field pr-16" />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{show ? 'Ẩn' : 'Hiện'}</button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Hủy</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
            {saving ? '⏳...' : '✅ Tạo tài khoản'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ResetPasswordModal = ({ student, onClose }) => {
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!newPass || newPass.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự!'); return; }
    if (newPass !== confirm) { toast.error('Mật khẩu xác nhận không khớp!'); return; }
    setSaving(true);
    try {
      await api.post('/auth/reset-password', { user_id: student.user_id, new_password: newPass });
      toast.success(`Đã đặt lại mật khẩu cho ${student.name}!`);
      onClose();
    } catch (e) { toast.error(e.message || 'Có lỗi xảy ra!'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-800">🔑 Đặt lại mật khẩu</h3>
            <p className="text-xs text-gray-400 mt-0.5">{student?.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs">✕</button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Mật khẩu mới</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={newPass}
                onChange={e => setNewPass(e.target.value)} placeholder="Tối thiểu 6 ký tự" className="input-field pr-16" />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{show ? 'Ẩn' : 'Hiện'}</button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Xác nhận mật khẩu</label>
            <input type={show ? 'text' : 'password'} value={confirm}
              onChange={e => setConfirm(e.target.value)} placeholder="Nhập lại" className="input-field" />
          </div>
          {newPass && confirm && newPass !== confirm && <p className="text-xs text-red-500">Mật khẩu không khớp</p>}
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Hủy</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
            {saving ? '⏳...' : '🔑 Đặt lại'}
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/staff') ? '/staff' : '/admin';

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    studentService.getById(id)
      .then(data => setStudent(data))
      .catch(() => toast.error('Không tải được thông tin'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Xác nhận xóa học viên này?')) return;
    try {
      const res = await api.delete(`/students/${id}`);
      if (res.warning) {
        const ok = window.confirm(`${res.message}\n\nBấm OK để xóa hoàn toàn.`);
        if (!ok) return;
        await api.delete(`/students/${id}?confirm=true`);
      }
      toast.success('Đã xóa!');
      navigate('/admin/students');
    } catch { toast.error('Không thể xóa!'); }
  };

  const handleAccountCreated = (email) => {
    setStudent(prev => ({ ...prev, user_id: `student-${id}`, email }));
  };

  if (loading) return <MainLayout title="Chi tiết học viên"><Loading /></MainLayout>;

  const total = Number(student?.total_sessions || 0);
  const attended = Number(student?.attended || 0);
  const remaining = total > 0 ? total - attended : null;
  const pct = total > 0 ? Math.min(Math.round(attended / total * 100), 100) : 0;
  const hasAccount = !!student?.user_id;

  return (
    <MainLayout title="Chi tiết học viên">
      {showCreate && <CreateAccountModal student={student} onClose={() => setShowCreate(false)} onSuccess={handleAccountCreated} />}
      {showReset && <ResetPasswordModal student={student} onClose={() => setShowReset(false)} />}

      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 text-2xl font-bold">
          {student?.name?.charAt(0)}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">{student?.name}</h2>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Badge label={student?.instrument} variant="blue" />
            <Badge label={student?.level} variant={levelVariant[student?.level] || 'gray'} />
            <Badge label={student?.status === 'active' ? 'Đang học' : 'Nghỉ học'} variant={student?.status === 'active' ? 'green' : 'gray'} dot />
            {hasAccount ? <Badge label="✅ Có tài khoản" variant="green" /> : <Badge label="⚠️ Chưa có tài khoản" variant="gray" />}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {!hasAccount ? (
            <Button variant="secondary" size="sm" icon="👤" onClick={() => setShowCreate(true)}>Tạo tài khoản</Button>
          ) : (
            <Button variant="secondary" size="sm" icon="🔑" onClick={() => setShowReset(true)}>Đặt lại MK</Button>
          )}
          <Button variant="secondary" size="sm" icon="✏️" onClick={() => navigate(`${basePath}/students/edit/${id}`)}>Chỉnh sửa</Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>🗑️</Button>
        </div>
      </div>

      {hasAccount && (
        <div className="mb-4 p-3 bg-blue-50 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700">📧 Tài khoản đăng nhập</p>
            <p className="text-sm text-blue-600 mt-0.5">{student?.email || '—'}</p>
          </div>
          <button onClick={() => setShowReset(true)} className="text-xs text-blue-500 hover:text-blue-700 underline">Đổi mật khẩu</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Thông tin cá nhân">
          <Row label="Ngày sinh" value={student?.dob?.slice(0,10)} />
          <Row label="Giới tính" value={student?.gender} />
          <Row label="Số điện thoại" value={student?.phone} />
          
          <Row label="SĐT phụ huynh (2)" value={student?.parentPhone || student?.parent_phone} />
        </Card>

        <Card title="Thông tin học tập">
          <Row label="Nhạc cụ" value={student?.instrument} />
          <Row label="Trình độ" value={student?.level} />
          <Row label="Trạng thái" value={student?.status === 'active' ? 'Đang học' : student?.status === 'paused' ? 'Tạm nghỉ' : 'Nghỉ học'} />
          <Row label="Ghi chú" value={student?.note} />
          <Row label="💰 Học phí" value={student?.tuition_fee > 0 ? fmt(student.tuition_fee) : '—'} />
          <Row label="📅 Ngày bắt đầu" value={fmtDate(student?.start_date)} />
          <Row label="📅 Ngày kết thúc" value={fmtDate(student?.end_date)} />

          <div className="py-2.5 border-b border-gray-50 last:border-0">
            <div className="flex justify-between mb-1.5">
              <span className="text-sm text-gray-500">Số buổi học (khóa)</span>
              <span className="text-sm font-medium text-gray-800">
                {total > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <span>{total} buổi</span>
                    {remaining !== null && remaining <= 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">🔴 Hết khóa</span>
                    )}
                    {remaining !== null && remaining > 0 && remaining < 5 && (
                      <span className="text-xs bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded-full">⚠️ Còn {remaining}</span>
                    )}
                  </span>
                ) : '—'}
              </span>
            </div>
            {total > 0 && (
              <>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 100 ? '#dc2626' : pct >= 80 ? '#ea580c' : '#16a34a'
                    }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{pct}% hoàn thành</p>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Button variant="secondary" onClick={() => navigate(`${basePath}/students`)}>← Quay lại</Button>
      </div>
    </MainLayout>
  );
};

export default StudentDetail;