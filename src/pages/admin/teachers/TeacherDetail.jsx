import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Loading from '../../../components/ui/Loading';
import teacherService from '../../../services/teacherService';
import api from '../../../services/api';

const Row = ({ label, value }) => (
  <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-800">{value || '—'}</span>
  </div>
);

// Modal đặt lại mật khẩu
const ResetPasswordModal = ({ teacher, onClose }) => {
  const [newPass, setNewPass]     = useState('');
  const [confirmPass, setConfirm] = useState('');
  const [saving, setSaving]       = useState(false);
  const [show, setShow]           = useState(false);

  const handleSubmit = async () => {
    if (!newPass || newPass.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự!'); return;
    }
    if (newPass !== confirmPass) {
      toast.error('Mật khẩu xác nhận không khớp!'); return;
    }
    if (!teacher?.user_id) {
      toast.error('Giáo viên này chưa có tài khoản!'); return;
    }
    setSaving(true);
    try {
      await api.post('/auth/reset-password', {
        user_id:      teacher.user_id,
        new_password: newPass,
      });
      toast.success(`✅ Đã đặt lại mật khẩu cho ${teacher.name}!`);
      onClose();
    } catch (e) {
      toast.error(e.message || 'Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl mx-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-800">🔑 Đặt lại mật khẩu</h3>
            <p className="text-xs text-gray-400 mt-0.5">{teacher?.name}</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs">
            ✕
          </button>
        </div>

        {!teacher?.user_id && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-xl text-xs text-yellow-700">
            ⚠️ Giáo viên này chưa có tài khoản đăng nhập
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="input-field pr-16"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {show ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Xác nhận mật khẩu</label>
            <input
              type={show ? 'text' : 'password'}
              value={confirmPass}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="input-field"
            />
          </div>

          {newPass && confirmPass && newPass !== confirmPass && (
            <p className="text-xs text-red-500">❌ Mật khẩu không khớp</p>
          )}
          {newPass && confirmPass && newPass === confirmPass && (
            <p className="text-xs text-green-500">✅ Mật khẩu khớp</p>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !teacher?.user_id}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? '⏳ Đang lưu...' : '🔑 Đặt lại'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────
const TeacherDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/staff') ? '/staff' : '/admin';

  const [teacher, setTeacher]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showReset, setShowReset]   = useState(false);

  useEffect(() => {
    teacherService.getById(id)
      .then(data => setTeacher(data))
      .catch(() => toast.error('Không tải được thông tin giáo viên'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa giáo viên này?')) return;
    try {
      await teacherService.delete(id);
      toast.success('Đã xóa giáo viên!');
      navigate(`${basePath}/teachers`);
    } catch {
      toast.error('Không thể xóa!');
    }
  };

  if (loading) return <MainLayout title="Chi tiết giáo viên"><Loading /></MainLayout>;

  return (
    <MainLayout title="Chi tiết giáo viên">
      {showReset && (
        <ResetPasswordModal teacher={teacher} onClose={() => setShowReset(false)} />
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 text-2xl font-bold">
          {teacher?.name?.charAt(0)}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">{teacher?.name}</h2>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Badge label={teacher?.instrument} variant="blue" />
            <Badge
              label={teacher?.status === 'active' ? 'Đang dạy' : 'Nghỉ'}
              variant={teacher?.status === 'active' ? 'green' : 'gray'} dot
            />
            {teacher?.user_id ? (
              <Badge label="✅ Có tài khoản" variant="green" />
            ) : (
              <Badge label="⚠️ Chưa có tài khoản" variant="gray" />
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="secondary" size="sm" icon="🔑"
            onClick={() => setShowReset(true)}>
            Đặt lại MK
          </Button>
          <Button variant="secondary" size="sm" icon="✏️"
            onClick={() => navigate(`${basePath}/teachers/edit/${id}`)}>
            Chỉnh sửa
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>🗑️</Button>
        </div>
      </div>

      {/* Thông tin tài khoản */}
      {teacher?.user_id && (
        <div className="mb-4 p-3 bg-blue-50 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700">📧 Tài khoản đăng nhập</p>
            <p className="text-sm text-blue-600 mt-0.5">{teacher?.email || '—'}</p>
          </div>
          <button
            onClick={() => setShowReset(true)}
            className="text-xs text-blue-500 hover:text-blue-700 underline">
            Đổi mật khẩu
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Thông tin cá nhân">
          <Row label="Giới tính"     value={teacher?.gender} />
          <Row label="Số điện thoại" value={teacher?.phone} />
          <Row label="Email"         value={teacher?.email} />
          <Row label="Địa chỉ"       value={teacher?.address} />
        </Card>
        <Card title="Thông tin giảng dạy">
          <Row label="Chuyên môn"  value={teacher?.instrument} />
          <Row label="Kinh nghiệm" value={teacher?.experience} />
          <Row label="Ghi chú"     value={teacher?.note} />
          <Row label="Lương theo lớp"
            value="Xem trong từng lớp học" />
        </Card>
      </div>

      <div className="mt-4">
        <Button variant="secondary" onClick={() => navigate(`${basePath}/teachers`)}>
          ← Quay lại
        </Button>
      </div>
    </MainLayout>
  );
};

export default TeacherDetail;