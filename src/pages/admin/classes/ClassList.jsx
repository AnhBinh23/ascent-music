import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Pagination, { PAGE_SIZE } from '../../../components/ui/Pagination';
import SearchBar from '../../../components/shared/SearchBar';
import Loading from '../../../components/ui/Loading';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const STATUS_VARIANT = { 'Đang tuyển sinh': 'blue', 'Đang học': 'green', 'Đã kết thúc': 'gray' };

const ClassList = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);

  useEffect(() => {
    api.get('/classes')
      .then(data => setClasses(data.rows || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    return classes
      .filter(c => c.name?.toLowerCase().includes(q) || c.instrument?.toLowerCase().includes(q) || c.teacher_name?.toLowerCase().includes(q))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
  }, [search, classes]);

  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search]);

  const columns = [
    { key: 'name', label: 'Tên lớp', render: (val, row) => (<div><p className="font-medium text-gray-800">{val}</p><p className="text-xs text-gray-400">{row.instrument} · {row.type === '1v1' ? '1 kèm 1' : 'Nhóm'}</p></div>) },
    { key: 'teacher_name', label: 'Giáo viên' },
    { key: 'room_name', label: 'Phòng' },
    { key: 'schedule', label: 'Lịch học' },
    { key: 'status', label: 'Trạng thái', render: (val) => <Badge label={val} variant={STATUS_VARIANT[val] || 'gray'} dot /> },
    { key: 'id', label: '', render: (val) => (<div className="flex gap-2"><Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`/admin/classes/${val}`); }}>Xem</Button><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/admin/classes/edit/${val}`); }}>✏️</Button></div>) },
  ];

  return (
    <MainLayout title="Quản lý lớp học">
      <div className="flex gap-3 mb-5">
        <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Tìm tên lớp, môn học, giáo viên..." /></div>
        <Button icon="➕" onClick={() => navigate('/admin/classes/new')}>Tạo lớp học</Button>
      </div>
      <Card subtitle={`${sorted.length} lớp học · A → Z`}>
        {loading ? <Loading /> : (
          <>
            <Table columns={columns} data={paged} onRowClick={(row) => navigate(`/admin/classes/${row.id}`)} />
            <Pagination page={page} totalItems={sorted.length} onPageChange={setPage} />
          </>
        )}
      </Card>
    </MainLayout>
  );
};

export default ClassList;