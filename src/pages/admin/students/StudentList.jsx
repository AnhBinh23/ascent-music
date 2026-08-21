import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import SearchBar from '../../../components/shared/SearchBar';
import Loading from '../../../components/ui/Loading';
import studentService from '../../../services/studentService';
import { toast } from 'react-toastify';

const levelVariant = { 'Sơ cấp': 'blue', 'Trung cấp': 'orange', 'Nâng cao': 'purple' };

const StudentList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/staff') ? '/staff' : '/admin';

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await studentService.getAll();
        setStudents(data);
        setFiltered(data);
      } catch (err) {
        toast.error('Lỗi tải dữ liệu: ' + err.message);
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
    { key: 'name', label: 'Họ tên',
  render: (val, row) => (
    <div>
      <div className="flex items-center gap-1.5">
        <p className="font-medium text-gray-800">{val}</p>
        {row.nickname && (
          <span className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full border border-primary-100">
            {row.nickname}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400">{row.phone}</p>
    </div>
  )
},
    { key: 'instrument', label: 'Nhạc cụ' },
    { key: 'level', label: 'Trình độ',
      render: (val) => <Badge label={val} variant={levelVariant[val] || 'gray'} />
    },
    { key: 'tuition_fee', label: 'Học phí',
      render: (val) => val > 0 ? <span>{Number(val).toLocaleString('vi-VN')}đ</span> : <span className="text-gray-400">—</span>
    },
    { key: 'gender', label: 'Giới tính' },
    { key: 'status', label: 'Trạng thái',
      render: (val) => <Badge label={val === 'active' ? 'Đang học' : 'Nghỉ học'} variant={val === 'active' ? 'green' : 'gray'} dot />
    },
    { key: 'id', label: '',
      render: (val) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary"
            onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/students/${val}`); }}>
            Xem
          </Button>
          <Button size="sm" variant="ghost"
            onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/students/edit/${val}`); }}>
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
        <Button icon="➕" onClick={() => navigate(`${basePath}/students/new`)}>
          Thêm học viên
        </Button>
      </div>
      <Card subtitle={`${filtered.length} học viên`}>
        {loading ? <Loading /> : (
          <Table columns={columns} data={filtered}
            onRowClick={(row) => navigate(`${basePath}/students/${row.id}`)} />
        )}
      </Card>
    </MainLayout>
  );
};

export default StudentList;