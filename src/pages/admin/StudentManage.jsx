import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/shared/SearchBar';
import Loading from '../../components/ui/Loading';
import studentService from '../../services/studentService';
import api from '../../services/api';
import { toast } from 'react-toastify';

const levelVariant = { 'Sơ cấp': 'blue', 'Trung cấp': 'orange', 'Nâng cao': 'purple' };
const STATUS_VARIANT = { 'Đang tuyển sinh':'blue', 'Đang học':'green', 'Tạm nghỉ':'orange', 'Đã kết thúc':'gray' };

const StudentManage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = location.pathname.startsWith('/staff') ? '/staff' : '/admin';
  const tab = searchParams.get('tab') || 'students';

  // ── Học viên ──
  const [students, setStudents]     = useState([]);
  const [filteredStu, setFilteredStu] = useState([]);
  const [searchStu, setSearchStu]   = useState('');
  const [loadingStu, setLoadingStu] = useState(true);

  // ── Lớp học ──
  const [classes, setClasses]       = useState([]);
  const [filteredCls, setFilteredCls] = useState([]);
  const [searchCls, setSearchCls]   = useState('');
  const [loadingCls, setLoadingCls] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStu(true);
        const data = await studentService.getAll();
        setStudents(data); setFilteredStu(data);
      } catch (err) { toast.error('Lỗi tải HV: ' + err.message); }
      finally { setLoadingStu(false); }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingCls(true);
        const data = await api.get('/classes');
        setClasses(data.rows || []); setFilteredCls(data.rows || []);
      } catch (err) { toast.error(err.message); }
      finally { setLoadingCls(false); }
    };
    if (tab === 'classes') fetchClasses();
  }, [tab]);

  useEffect(() => {
    const q = searchStu.toLowerCase();
    setFilteredStu(students.filter(s =>
      s.name?.toLowerCase().includes(q) || s.phone?.includes(q) || s.instrument?.toLowerCase().includes(q)
    ));
  }, [searchStu, students]);

  useEffect(() => {
    const q = searchCls.toLowerCase();
    setFilteredCls(classes.filter(c =>
      c.name?.toLowerCase().includes(q) || c.instrument?.toLowerCase().includes(q) || c.teacher_name?.toLowerCase().includes(q)
    ));
  }, [searchCls, classes]);

  const stuColumns = [
    { key: 'name', label: 'Họ tên',
      render: (val, row) => (
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-gray-800">{val}</p>
            {row.nickname && <span className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full border border-primary-100">{row.nickname}</span>}
          </div>
          <p className="text-xs text-gray-400">{row.phone}</p>
        </div>
      )
    },
    { key: 'instrument', label: 'Nhạc cụ' },
    { key: 'level', label: 'Trình độ', render: (val) => <Badge label={val} variant={levelVariant[val] || 'gray'} /> },
    { key: 'status', label: 'Trạng thái',
      render: (val) => <Badge label={val === 'active' ? 'Đang học' : val === 'paused' ? 'Tạm nghỉ' : 'Nghỉ học'} variant={val === 'active' ? 'green' : val === 'paused' ? 'orange' : 'gray'} dot />
    },
    { key: 'id', label: '',
      render: (val) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/students/${val}`); }}>Xem</Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/students/edit/${val}`); }}>✏️</Button>
        </div>
      )
    },
  ];

  const clsColumns = [
    { key: 'name', label: 'Tên lớp',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          <p className="text-xs text-gray-400">{row.instrument} · {row.type === '1v1' ? '1 kèm 1' : 'Nhóm'}</p>
        </div>
      )
    },
    { key: 'teacher_name', label: 'Giáo viên' },
    { key: 'schedule', label: 'Lịch học' },
    { key: 'tuition_fee', label: 'Học phí', render: (val) => <span>{Number(val||0).toLocaleString('vi-VN')}đ</span> },
    { key: 'status', label: 'Trạng thái', render: (val) => <Badge label={val} variant={STATUS_VARIANT[val] || 'gray'} dot /> },
    { key: 'id', label: '',
      render: (val) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`/admin/classes/${val}`); }}>Xem</Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/admin/classes/edit/${val}`); }}>✏️</Button>
        </div>
      )
    },
  ];

  return (
    <MainLayout title={tab === 'classes' ? 'Quản lý lớp học' : 'Quản lý học viên'}>
      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 bg-gray-100 p-1 rounded-2xl">
        <button onClick={() => setSearchParams({ tab: 'students' })}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab==='students'?'bg-white shadow text-primary-600':'text-gray-500'}`}>
          👨‍🎓 Học viên ({students.length})
        </button>
        <button onClick={() => setSearchParams({ tab: 'classes' })}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab==='classes'?'bg-white shadow text-primary-600':'text-gray-500'}`}>
          🎵 Lớp học ({classes.length})
        </button>
      </div>

      {/* Tab Học viên */}
      {tab === 'students' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex-1">
              <SearchBar value={searchStu} onChange={setSearchStu} placeholder="Tìm theo tên, SĐT, nhạc cụ..." />
            </div>
            <Button icon="➕" onClick={() => navigate(`${basePath}/students/new`)}>Thêm học viên</Button>
          </div>
          <Card subtitle={`${filteredStu.length} học viên`}>
            {loadingStu ? <Loading /> : (
              <Table columns={stuColumns} data={filteredStu} onRowClick={(row) => navigate(`${basePath}/students/${row.id}`)} />
            )}
          </Card>
        </>
      )}

      {/* Tab Lớp học */}
      {tab === 'classes' && (
        <>
          <div className="flex gap-3 mb-5">
            <div className="flex-1">
              <SearchBar value={searchCls} onChange={setSearchCls} placeholder="Tìm tên lớp, môn học, giáo viên..." />
            </div>
            <Button icon="➕" onClick={() => navigate('/admin/classes/new')}>Tạo lớp học</Button>
          </div>
          <Card subtitle={`${filteredCls.length} lớp học`}>
            {loadingCls ? <Loading /> : (
              <Table columns={clsColumns} data={filteredCls} onRowClick={(row) => navigate(`/admin/classes/${row.id}`)} />
            )}
          </Card>
        </>
      )}
    </MainLayout>
  );
};

export default StudentManage;