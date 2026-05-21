import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import SearchBar from '../../../components/shared/SearchBar';
import Loading from '../../../components/ui/Loading';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const STATUS_VARIANT = {
  'Đang tuyển sinh': 'blue',
  'Đang học':        'green',
  'Đã kết thúc':     'gray',
};

const ClassList = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await api.get('/classes');
        setClasses(data.rows || []); setFiltered(data.rows || []);
      } catch (err) { toast.error(err.message); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(classes.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.instrument?.toLowerCase().includes(q) ||
      c.teacher_name?.toLowerCase().includes(q)
    ));
  }, [search, classes]);

  const columns = [
    { key: 'name', label: 'Tên lớp',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          <p className="text-xs text-gray-400">{row.instrument} · {row.type === '1v1' ? '1 kèm 1' : 'Nhóm'}</p>
        </div>
      )
    },
    { key: 'teacher_name', label: 'Giáo viên' },
    { key: 'room_name',    label: 'Phòng' },
    { key: 'schedule',     label: 'Lịch học' },
    { key: 'tuition_fee',  label: 'Học phí',
      render: (val) => <span>{Number(val).toLocaleString('vi-VN')}đ</span>
    },
    { key: 'status', label: 'Trạng thái',
      render: (val) => <Badge label={val} variant={STATUS_VARIANT[val] || 'gray'} dot />
    },
    { key: 'id', label: '',
      render: (val) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary"
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/classes/${val}`); }}>Xem</Button>
          <Button size="sm" variant="ghost"
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/classes/edit/${val}`); }}>✏️</Button>
        </div>
      )
    },
  ];

  return (
    <MainLayout title="Quản lý lớp học">
      <div className="flex gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên lớp, môn học, giáo viên..." />
        </div>
        <Button icon="➕" onClick={() => navigate('/admin/classes/new')}>Tạo lớp học</Button>
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