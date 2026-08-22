import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Pagination, { PAGE_SIZE } from '../../../components/ui/Pagination';
import SearchBar from '../../../components/shared/SearchBar';
import Loading from '../../../components/ui/Loading';
import teacherService from '../../../services/teacherService';
import { toast } from 'react-toastify';

const INSTRUMENT_VARIANT = { Piano: 'blue', Guitar: 'green', Violin: 'purple', 'Thanh nhạc': 'orange' };

const TeacherList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/staff') ? '/staff' : '/admin';

  const [teachers, setTeachers] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);

  useEffect(() => {
    teacherService.getAll()
      .then(data => { setTeachers(data); })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    return teachers
      .filter(t => t.name?.toLowerCase().includes(q) || t.phone?.includes(q) || t.instrument?.toLowerCase().includes(q))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
  }, [search, teachers]);

  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search]);

  const columns = [
    { key: 'name', label: 'Giáo viên', render: (val, row) => (<div><p className="font-medium text-gray-800">{val}</p><p className="text-xs text-gray-400">{row.phone}</p></div>) },
    { key: 'instrument', label: 'Chuyên môn', render: (val) => <Badge label={val} variant={INSTRUMENT_VARIANT[val] || 'gray'} /> },
    { key: 'experience', label: 'Kinh nghiệm' },
    { key: 'salary_type', label: 'Hình thức lương' },
    { key: 'salary_amount', label: 'Lương/buổi', render: (val) => <span className="font-medium">{Number(val).toLocaleString('vi-VN')}đ</span> },
    { key: 'status', label: 'Trạng thái', render: (val) => <Badge label={val === 'active' ? 'Đang dạy' : 'Nghỉ'} variant={val === 'active' ? 'green' : 'gray'} dot /> },
    { key: 'id', label: '', render: (val) => (<div className="flex gap-2"><Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/teachers/${val}`); }}>Xem</Button><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/teachers/edit/${val}`); }}>✏️</Button></div>) },
  ];

  return (
    <MainLayout title="Quản lý giáo viên">
      <div className="flex gap-3 mb-5">
        <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Tìm tên, SĐT, chuyên môn..." /></div>
        {basePath === '/admin' && <Button icon="💰" variant="secondary" onClick={() => navigate('/admin/salary')}>Bảng lương</Button>}
        <Button icon="➕" onClick={() => navigate(`${basePath}/teachers/new`)}>Thêm giáo viên</Button>
      </div>
      <Card subtitle={`${sorted.length} giáo viên · A → Z`}>
        {loading ? <Loading /> : (
          <>
            <Table columns={columns} data={paged} onRowClick={(row) => navigate(`${basePath}/teachers/${row.id}`)} />
            <Pagination page={page} totalItems={sorted.length} onPageChange={setPage} />
          </>
        )}
      </Card>
    </MainLayout>
  );
};

export default TeacherList;