import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';

const STATUS_VARIANT = { 'Đang tuyển sinh': 'blue', 'Đang học': 'green', 'Đã kết thúc': 'gray' };

const SAMPLE = {
  id: 'LH001', name: 'Piano cơ bản 01', instrument: 'Piano',
  type: '1v1', teacher: 'Nguyễn Thị Mai', room: 'Phòng 1',
  schedule: 'Thứ 2, 4 - 08:00~09:00', level: 'Sơ cấp',
  tuitionFee: 800000, startDate: '2025-03-01', status: 'Đang học',
  students: [
    { id: 'HV001', name: 'Nguyễn Văn An', phone: '0901234567', level: 'Sơ cấp', status: 'active' },
  ],
};

const ClassDetail = () => {
  useParams();
  const navigate = useNavigate();
  const cls = SAMPLE;

  const columns = [
    { key: 'name',   label: 'Học viên' },
    { key: 'phone',  label: 'SĐT' },
    { key: 'level',  label: 'Trình độ', render: val => <Badge label={val} variant="blue" /> },
    { key: 'status', label: 'Trạng thái', render: val => <Badge label={val === 'active' ? 'Đang học' : 'Nghỉ'} variant={val === 'active' ? 'green' : 'gray'} dot /> },
  ];

  return (
    <MainLayout title="Chi tiết lớp học">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-3xl">🎵</div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">{cls.name}</h2>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Badge label={cls.instrument} variant="blue" />
            <Badge label={cls.type === '1v1' ? '1 kèm 1' : 'Nhóm'} variant={cls.type === '1v1' ? 'purple' : 'green'} />
            <Badge label={cls.status} variant={STATUS_VARIANT[cls.status]} dot />
          </div>
        </div>
        <Button variant="secondary" size="sm" icon="✏️" onClick={() => navigate('/admin/classes/new')}>Chỉnh sửa</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title="Thông tin lớp">
          {[
            ['Giáo viên', cls.teacher],
            ['Phòng học', cls.room],
            ['Lịch học', cls.schedule],
            ['Trình độ', cls.level],
            ['Học phí', `${cls.tuitionFee?.toLocaleString('vi-VN')}đ/tháng`],
            ['Ngày khai giảng', cls.startDate],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium text-gray-800">{value || '—'}</span>
            </div>
          ))}
        </Card>
        <Card title={`Học viên (${cls.students.length}/${cls.type === '1v1' ? 1 : 3})`}>
          <Table columns={columns} data={cls.students} />
        </Card>
      </div>

      <Button variant="secondary" onClick={() => navigate('/admin/classes')}>← Quay lại</Button>
    </MainLayout>
  );
};

export default ClassDetail;