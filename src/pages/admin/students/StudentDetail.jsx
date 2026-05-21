import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await studentService.getById(id);
        setStudent(data);
      } catch {
        setStudent({
          id, name: 'Nguyễn Văn An', dob: '2010-05-12', gender: 'Nam',
          phone: '0901234567', instrument: 'Piano', level: 'Sơ cấp',
          status: 'active', parentName: 'Nguyễn Thị B', address: 'Hà Nội',
        });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa học viên này?')) return;
    try {
      await studentService.delete(id);
      toast.success('Đã xóa học viên!');
      navigate('/admin/students');
    } catch {
      toast.error('Không thể xóa!');
    }
  };

  if (loading) return <MainLayout title="Chi tiết học viên"><Loading /></MainLayout>;

  return (
    <MainLayout title="Chi tiết học viên">
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 text-2xl font-bold">
          {student?.name?.charAt(0)}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">{student?.name}</h2>
          <div className="flex gap-2 mt-1">
            <Badge label={student?.instrument} variant="blue" />
            <Badge label={student?.level} variant={levelVariant[student?.level] || 'gray'} />
            <Badge label={student?.status === 'active' ? 'Đang học' : 'Nghỉ học'}
              variant={student?.status === 'active' ? 'green' : 'gray'} dot />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon="✏️"
            onClick={() => navigate(`/admin/students/edit/${id}`)}>
            Chỉnh sửa
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>🗑️</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Thông tin cá nhân">
          <Row label="Ngày sinh" value={student?.dob} />
          <Row label="Giới tính" value={student?.gender} />
          <Row label="SĐT" value={student?.phone} />
          <Row label="Địa chỉ" value={student?.address} />
          <Row label="Tên phụ huynh" value={student?.parentName} />
        </Card>
        <Card title="Thông tin học tập">
          <Row label="Nhạc cụ" value={student?.instrument} />
          <Row label="Trình độ" value={student?.level} />
          <Row label="Trạng thái" value={student?.status === 'active' ? 'Đang học' : 'Nghỉ học'} />
          <Row label="Ghi chú" value={student?.note} />
        </Card>
      </div>

      <div className="mt-4">
        <Button variant="secondary" onClick={() => navigate('/admin/students')}>
          ← Quay lại
        </Button>
      </div>
    </MainLayout>
  );
};

export default StudentDetail;