import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import SearchBar from '../../../components/shared/SearchBar';
import Loading from '../../../components/ui/Loading';
import teacherService from '../../../services/teacherService';

const SAMPLE = [
  { id: 'GV001', name: 'Nguyễn Thị Mai',   phone: '0901111111', instrument: 'Piano',      experience: '5 năm', salary: '200,000đ/buổi', status: 'active' },
  { id: 'GV002', name: 'Trần Văn Hùng',    phone: '0902222222', instrument: 'Guitar',     experience: '3 năm', salary: '180,000đ/buổi', status: 'active' },
  { id: 'GV003', name: 'Lê Thị Hoa',       phone: '0903333333', instrument: 'Violin',     experience: '7 năm', salary: '220,000đ/buổi', status: 'active' },
  { id: 'GV004', name: 'Phạm Minh Tuấn',   phone: '0904444444', instrument: 'Thanh nhạc', experience: '4 năm', salary: '190,000đ/buổi', status: 'active' },
];

const TeacherList = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await teacherService.getAll();
        setTeachers(data.length ? data : SAMPLE);
        setFiltered(data.length ? data : SAMPLE);
      } catch {
        setTeachers(SAMPLE); setFiltered(SAMPLE);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(teachers.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.instrument?.toLowerCase().includes(q) ||
      t.phone?.includes(q)
    ));
  }, [search, teachers]);

  const columns = [
    { key: 'name', label: 'Họ tên',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          <p className="text-xs text-gray-400">{row.phone}</p>
        </div>
      )
    },
    { key: 'instrument', label: 'Chuyên môn',
      render: (val) => <Badge label={val} variant="blue" />
    },
    { key: 'experience', label: 'Kinh nghiệm' },
    { key: 'salary',     label: 'Mức lương' },
    { key: 'status',     label: 'Trạng thái',
      render: (val) => <Badge label={val === 'active' ? 'Đang dạy' : 'Nghỉ'} variant={val === 'active' ? 'green' : 'gray'} dot />
    },
    { key: 'id', label: '',
      render: (val) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`/admin/teachers/${val}`); }}>Xem</Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/admin/teachers/edit/${val}`); }}>✏️</Button>
        </div>
      )
    },
  ];

  return (
    <MainLayout title="Quản lý giáo viên">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên, nhạc cụ, SĐT..." />
        </div>
        <Button icon="➕" onClick={() => navigate('/admin/teachers/new')}>
          Thêm giáo viên
        </Button>
      </div>
      <Card subtitle={`${filtered.length} giáo viên`}>
        {loading ? <Loading /> : (
          <Table columns={columns} data={filtered}
            onRowClick={(row) => navigate(`/admin/teachers/${row.id}`)} />
        )}
      </Card>
    </MainLayout>
  );
};

export default TeacherList;