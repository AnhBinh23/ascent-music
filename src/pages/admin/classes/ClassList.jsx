import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import SearchBar from '../../../components/shared/SearchBar';
import Loading from '../../../components/ui/Loading';

const STATUS_VARIANT = {
  'Đang tuyển sinh': 'blue',
  'Đang học':        'green',
  'Đã kết thúc':     'gray',
};

const SAMPLE = [
  { id: 'LH001', name: 'Piano cơ bản 01', teacher: 'Nguyễn Thị Mai', type: '1v1',   instrument: 'Piano',    room: 'Phòng 1', students: 1, maxStudents: 1, status: 'Đang học' },
  { id: 'LH002', name: 'Guitar nhóm 01',  teacher: 'Trần Văn Hùng',  type: 'group', instrument: 'Guitar',   room: 'Phòng 2', students: 3, maxStudents: 3, status: 'Đang học' },
  { id: 'LH003', name: 'Violin cơ bản 01',teacher: 'Lê Thị Hoa',     type: '1v1',   instrument: 'Violin',   room: 'Phòng 3', students: 1, maxStudents: 1, status: 'Đang tuyển sinh' },
  { id: 'LH004', name: 'Thanh nhạc 01',   teacher: 'Phạm Minh Tuấn', type: 'group', instrument: 'Thanh nhạc', room: 'Phòng 2', students: 2, maxStudents: 3, status: 'Đang tuyển sinh' },
  { id: 'LH005', name: 'Piano nâng cao',  teacher: 'Nguyễn Thị Mai', type: '1v1',   instrument: 'Piano',    room: 'Phòng 1', students: 1, maxStudents: 1, status: 'Đã kết thúc' },
];

const ClassList = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setClasses(SAMPLE);
      setFiltered(SAMPLE);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    let result = classes;
    if (filterStatus !== 'Tất cả') result = result.filter(c => c.status === filterStatus);
    if (search) result = result.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.teacher?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, filterStatus, classes]);

  const columns = [
    { key: 'name', label: 'Tên lớp',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          <p className="text-xs text-gray-400">{row.instrument}</p>
        </div>
      )
    },
    { key: 'teacher', label: 'Giáo viên' },
    { key: 'type', label: 'Hình thức',
      render: (val) => <Badge label={val === '1v1' ? '1 kèm 1' : 'Nhóm'} variant={val === '1v1' ? 'blue' : 'green'} />
    },
    { key: 'students', label: 'Học viên',
      render: (val, row) => (
        <span className={`text-sm font-medium ${val >= row.maxStudents ? 'text-red-500' : 'text-green-600'}`}>
          {val}/{row.maxStudents}
        </span>
      )
    },
    { key: 'room', label: 'Phòng' },
    { key: 'status', label: 'Trạng thái',
      render: (val) => <Badge label={val} variant={STATUS_VARIANT[val]} dot />
    },
    { key: 'id', label: '',
      render: (val) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary"
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/classes/${val}`); }}>Xem</Button>
          <Button size="sm" variant="ghost"
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/classes/new`); }}>✏️</Button>
        </div>
      )
    },
  ];

  return (
    <MainLayout title="Quản lý lớp học">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên lớp, giáo viên..." />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto">
          <option>Tất cả</option>
          <option>Đang tuyển sinh</option>
          <option>Đang học</option>
          <option>Đã kết thúc</option>
        </select>
        <Button icon="➕" onClick={() => navigate('/admin/classes/new')}>Thêm lớp</Button>
      </div>

      <Card subtitle={`${filtered.length} lớp học`}>
        {loading ? <Loading /> : (
          <Table columns={columns} data={filtered}
            onRowClick={(row) => navigate(`/admin/classes/${row.id}`)} />
        )}
      </Card>
    </MainLayout>
  );
};

export default ClassList;