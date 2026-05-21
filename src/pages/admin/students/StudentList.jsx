import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import SearchBar from '../../../components/shared/SearchBar';
import Loading from '../../../components/ui/Loading';
import studentService from '../../../services/studentService';

const levelVariant = { 'Sơ cấp': 'blue', 'Trung cấp': 'orange', 'Nâng cao': 'purple' };

const SAMPLE = [
  { id: '1', name: 'Nguyễn Văn An',   dob: '2010-05-12', gender: 'Nam', phone: '0901234567', instrument: 'Piano',    level: 'Sơ cấp',   status: 'active' },
  { id: '2', name: 'Trần Thị Bình',   dob: '2008-09-20', gender: 'Nữ',  phone: '0912345678', instrument: 'Guitar',   level: 'Trung cấp', status: 'active' },
  { id: '3', name: 'Lê Minh Châu',    dob: '2012-03-08', gender: 'Nam', phone: '0923456789', instrument: 'Violin',   level: 'Sơ cấp',   status: 'active' },
  { id: '4', name: 'Phạm Thị Dung',   dob: '2005-11-15', gender: 'Nữ',  phone: '0934567890', instrument: 'Thanh nhạc', level: 'Nâng cao', status: 'inactive' },
  { id: '5', name: 'Hoàng Văn Em',    dob: '2011-07-22', gender: 'Nam', phone: '0945678901', instrument: 'Piano',    level: 'Trung cấp', status: 'active' },
];

const StudentList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await studentService.getAll();
        setStudents(data.length ? data : SAMPLE);
        setFiltered(data.length ? data : SAMPLE);
      } catch {
        setStudents(SAMPLE);
        setFiltered(SAMPLE);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(students.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.instrument?.toLowerCase().includes(q)
    ));
  }, [search, students]);

  const columns = [
    { key: 'name',       label: 'Họ tên',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          <p className="text-xs text-gray-400">{row.phone}</p>
        </div>
      )
    },
    { key: 'instrument', label: 'Nhạc cụ' },
    { key: 'level',      label: 'Trình độ',
      render: (val) => <Badge label={val} variant={levelVariant[val] || 'gray'} />
    },
    { key: 'gender',     label: 'Giới tính' },
    { key: 'status',     label: 'Trạng thái',
      render: (val) => <Badge label={val === 'active' ? 'Đang học' : 'Nghỉ học'} variant={val === 'active' ? 'green' : 'gray'} dot />
    },
    { key: 'id',         label: '',
      render: (val) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`/admin/students/${val}`); }}>
            Xem
          </Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/admin/students/edit/${val}`); }}>
            ✏️
          </Button>
        </div>
      )
    },
  ];

  return (
    <MainLayout title="Quản lý học viên">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên, SĐT, nhạc cụ..." />
        </div>
        <Button icon="➕" onClick={() => navigate('/admin/students/new')}>
          Thêm học viên
        </Button>
      </div>

      <Card subtitle={`${filtered.length} học viên`}>
        {loading ? <Loading /> : (
          <Table
            columns={columns}
            data={filtered}
            onRowClick={(row) => navigate(`/admin/students/${row.id}`)}
          />
        )}
      </Card>
    </MainLayout>
  );
};

export default StudentList;