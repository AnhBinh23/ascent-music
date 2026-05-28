import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Loading from '../../../components/ui/Loading';
import studentService from '../../../services/studentService';

const levelVariant = { 'Sơ cấp': 'blue', 'Trung cấp': 'orange', 'Nâng cao': 'purple' };

const Row = ({ label, value }) => (
  <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-800 text-right">{value || '—'}</span>
  </div>
);

const StudentDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/staff') ? '/staff' : '/admin';

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await studentService.getById(id);
        setStudent(data);
      } catch {
        toast.error('Không tải được thông tin học viên');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa học viên này?')) return;
    try {
      await studentService.delete(id);
      toast.success('Đã xóa học viên!');
      navigate(`${basePath}/students`);
    } catch {
      toast.error('Không thể xóa!');
    }
  };

  if (loading) return <MainLayout title="Chi tiết học viên"><Loading /></MainLayout>;

  const total    = Number(student?.total_sessions || 0);
  const attended = Number(student?.attended || 0);
  const remaining = total > 0 ? total - attended : null;
  const pct      = total > 0 ? Math.min(Math.round(attended / total * 100), 100) : 0;

  return (
    <MainLayout title="Chi tiết học viên">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 text-2xl font-bold">
          {student?.name?.charAt(0)}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">{student?.name}</h2>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Badge label={student?.instrument} variant="blue" />
            <Badge label={student?.level} variant={levelVariant[student?.level] || 'gray'} />
            <Badge
              label={student?.status === 'active' ? 'Đang học' : 'Nghỉ học'}
              variant={student?.status === 'active' ? 'green' : 'gray'} dot
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon="✏️"
            onClick={() => navigate(`${basePath}/students/edit/${id}`)}>
            Chỉnh sửa
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>🗑️</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Thông tin cá nhân">
          <Row label="Ngày sinh"     value={student?.dob?.slice(0, 10)} />
          <Row label="Giới tính"     value={student?.gender} />
          <Row label="SĐT"           value={student?.phone} />
          <Row label="Địa chỉ"       value={student?.address} />
          <Row label="Tên phụ huynh" value={student?.parentName || student?.parent_name} />
        </Card>

        <Card title="Thông tin học tập">
          <Row label="Nhạc cụ"    value={student?.instrument} />
          <Row label="Trình độ"   value={student?.level} />
          <Row label="Trạng thái" value={student?.status === 'active' ? 'Đang học' : 'Nghỉ học'} />
          <Row label="Ghi chú"    value={student?.note} />

          {/* Số buổi học */}
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
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct >= 100 ? '#dc2626' : pct >= 80 ? '#ea580c' : '#16a34a'
                  }} />
              </div>
            )}
            {total > 0 && (
              <p className="text-xs text-gray-400 mt-1">{pct}% hoàn thành</p>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Button variant="secondary" onClick={() => navigate(`${basePath}/students`)}>
          ← Quay lại
        </Button>
      </div>
    </MainLayout>
  );
};

export default StudentDetail;