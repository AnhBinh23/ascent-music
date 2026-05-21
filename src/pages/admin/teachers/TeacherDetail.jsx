import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Loading from '../../../components/ui/Loading';
import teacherService from '../../../services/teacherService';

const Row = ({ label, value }) => (
  <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-800">{value || '—'}</span>
  </div>
);

const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherService.getById(id)
      .then(data => setTeacher(data))
      .catch(() => setTeacher({
        id, name: 'Nguyễn Thị Mai', phone: '0901111111',
        email: 'mai@ascentmusic.vn', instrument: 'Piano',
        experience: '5 năm', salaryType: 'Theo buổi',
        salaryAmount: '200000', status: 'active', gender: 'Nữ',
      }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa giáo viên này?')) return;
    try {
      await teacherService.delete(id);
      toast.success('Đã xóa giáo viên!');
      navigate('/admin/teachers');
    } catch { toast.error('Không thể xóa!'); }
  };

  if (loading) return <MainLayout title="Chi tiết giáo viên"><Loading /></MainLayout>;

  return (
    <MainLayout title="Chi tiết giáo viên">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 text-2xl font-bold">
          {teacher?.name?.charAt(0)}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">{teacher?.name}</h2>
          <div className="flex gap-2 mt-1">
            <Badge label={teacher?.instrument} variant="blue" />
            <Badge label={teacher?.status === 'active' ? 'Đang dạy' : 'Nghỉ'} variant={teacher?.status === 'active' ? 'green' : 'gray'} dot />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon="✏️" onClick={() => navigate(`/admin/teachers/edit/${id}`)}>Chỉnh sửa</Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>🗑️</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Thông tin cá nhân">
          <Row label="Giới tính" value={teacher?.gender} />
          <Row label="Số điện thoại" value={teacher?.phone} />
          <Row label="Email" value={teacher?.email} />
          <Row label="Địa chỉ" value={teacher?.address} />
        </Card>
        <Card title="Thông tin giảng dạy">
          <Row label="Chuyên môn" value={teacher?.instrument} />
          <Row label="Kinh nghiệm" value={teacher?.experience} />
          <Row label="Hình thức lương" value={teacher?.salaryType} />
          <Row label="Mức lương" value={teacher?.salaryAmount ? `${Number(teacher.salaryAmount).toLocaleString('vi-VN')}đ` : ''} />
          <Row label="Ghi chú" value={teacher?.note} />
        </Card>
      </div>

      <div className="mt-4">
        <Button variant="secondary" onClick={() => navigate('/admin/teachers')}>← Quay lại</Button>
      </div>
    </MainLayout>
  );
};

export default TeacherDetail;