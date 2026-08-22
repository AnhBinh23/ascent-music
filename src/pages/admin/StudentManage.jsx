import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Pagination, { PAGE_SIZE } from '../../components/ui/Pagination';
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

  const [students, setStudents] = useState([]);
  const [searchStu, setSearchStu] = useState('');
  const [loadingStu, setLoadingStu] = useState(true);
  const [pageStu, setPageStu] = useState(1);

  const [classes, setClasses] = useState([]);
  const [searchCls, setSearchCls] = useState('');
  const [loadingCls, setLoadingCls] = useState(true);
  const [pageCls, setPageCls] = useState(1);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStu(true);
        const [stuData, progressData] = await Promise.all([
          studentService.getAll(),
          api.get('/attendance/course-progress'),
        ]);
        const progressMap = {};
        (progressData.rows || []).forEach(p => {
          progressMap[p.student_id] = {
            class_name: p.class_name, teacher_name: p.teacher_name,
            current_course: p.current_course, attended: p.attended, total_sessions: p.total_sessions,
          };
        });
        setStudents(stuData.map(s => ({ ...s, ...(progressMap[s.id] || {}) })));
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
        setClasses(data.rows || []);
      } catch (err) { toast.error(err.message); }
      finally { setLoadingCls(false); }
    };
    if (tab === 'classes') fetchClasses();
  }, [tab]);

  const sortedStu = useMemo(() => {
    const q = searchStu.toLowerCase();
    return students
      .filter(s => s.name?.toLowerCase().includes(q) || s.phone?.includes(q) || s.instrument?.toLowerCase().includes(q) || s.class_name?.toLowerCase().includes(q) || s.teacher_name?.toLowerCase().includes(q))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
  }, [searchStu, students]);

  const pagedStu = sortedStu.slice((pageStu - 1) * PAGE_SIZE, pageStu * PAGE_SIZE);
  useEffect(() => { setPageStu(1); }, [searchStu]);

  const sortedCls = useMemo(() => {
    const q = searchCls.toLowerCase();
    return classes
      .filter(c => c.name?.toLowerCase().includes(q) || c.instrument?.toLowerCase().includes(q) || c.teacher_name?.toLowerCase().includes(q))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
  }, [searchCls, classes]);

  const pagedCls = sortedCls.slice((pageCls - 1) * PAGE_SIZE, pageCls * PAGE_SIZE);
  useEffect(() => { setPageCls(1); }, [searchCls]);

  const stuColumns = [
    { key: 'name', label: 'Họ tên', render: (val, row) => (<div><div className="flex items-center gap-1.5"><p className="font-medium text-gray-800">{val}</p>{row.nickname && <span className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full border border-primary-100">{row.nickname}</span>}</div><p className="text-xs text-gray-400">{row.phone}</p></div>) },
    { key: 'instrument', label: 'Nhạc cụ' },
    { key: 'level', label: 'Trình độ', render: (val) => <Badge label={val} variant={levelVariant[val] || 'gray'} /> },
    { key: 'class_name', label: 'Lớp', render: (val) => <span className="text-xs text-gray-600">{val || '—'}</span> },
    { key: 'teacher_name', label: 'Giáo viên', render: (val) => <span className="text-xs text-gray-600">{val || '—'}</span> },
    { key: 'current_course', label: 'Khóa', render: (val) => val ? <Badge label={`K${val}`} variant="blue" /> : <span className="text-xs text-gray-400">—</span> },
    { key: 'tuition_fee', label: 'Học phí', render: (val) => val > 0 ? <span>{Number(val).toLocaleString('vi-VN')}đ</span> : <span className="text-gray-400">—</span> },
    { key: 'gender', label: 'Giới tính' },
    { key: 'status', label: 'Trạng thái', render: (val) => <Badge label={val === 'active' ? 'Đang học' : val === 'paused' ? 'Tạm nghỉ' : 'Nghỉ học'} variant={val === 'active' ? 'green' : val === 'paused' ? 'orange' : 'gray'} dot /> },
    { key: 'id', label: '', render: (val) => (<div className="flex gap-2"><Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/students/${val}`); }}>Xem</Button><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/students/edit/${val}`); }}>✏️</Button></div>) },
  ];

  const clsColumns = [
    { key: 'name', label: 'Tên lớp', render: (val, row) => (<div><p className="font-medium text-gray-800">{val}</p><p className="text-xs text-gray-400">{row.instrument} · {row.type === '1v1' ? '1 kèm 1' : 'Nhóm'}</p></div>) },
    { key: 'teacher_name', label: 'Giáo viên' },
    { key: 'schedule', label: 'Lịch học' },
    { key: 'status', label: 'Trạng thái', render: (val) => <Badge label={val} variant={STATUS_VARIANT[val] || 'gray'} dot /> },
    { key: 'id', label: '', render: (val) => (<div className="flex gap-2"><Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`/admin/classes/${val}`); }}>Xem</Button><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/admin/classes/edit/${val}`); }}>✏️</Button></div>) },
  ];

  return (
    <MainLayout title={tab === 'classes' ? 'Quản lý lớp học' : 'Quản lý học viên'}>
      <div className="flex gap-1.5 mb-5 bg-gray-100 p-1 rounded-2xl">
        <button onClick={() => setSearchParams({ tab: 'students' })} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab==='students'?'bg-white shadow text-primary-600':'text-gray-500'}`}>👨‍🎓 Học viên ({students.length})</button>
        <button onClick={() => setSearchParams({ tab: 'classes' })} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab==='classes'?'bg-white shadow text-primary-600':'text-gray-500'}`}>🎵 Lớp học ({classes.length})</button>
      </div>

      {tab === 'students' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex-1"><SearchBar value={searchStu} onChange={setSearchStu} placeholder="Tìm theo tên, SĐT, nhạc cụ..." /></div>
            <Button icon="➕" onClick={() => navigate(`${basePath}/students/new`)}>Thêm học viên</Button>
          </div>
          <Card subtitle={`${sortedStu.length} học viên · A → Z`}>
            {loadingStu ? <Loading /> : (
              <>
                <Table columns={stuColumns} data={pagedStu} onRowClick={(row) => navigate(`${basePath}/students/${row.id}`)} />
                <Pagination page={pageStu} totalItems={sortedStu.length} onPageChange={setPageStu} />
              </>
            )}
          </Card>
        </>
      )}

      {tab === 'classes' && (
        <>
          <div className="flex gap-3 mb-5">
            <div className="flex-1"><SearchBar value={searchCls} onChange={setSearchCls} placeholder="Tìm tên lớp, môn học, giáo viên..." /></div>
            <Button icon="➕" onClick={() => navigate('/admin/classes/new')}>Tạo lớp học</Button>
          </div>
          <Card subtitle={`${sortedCls.length} lớp học · A → Z`}>
            {loadingCls ? <Loading /> : (
              <>
                <Table columns={clsColumns} data={pagedCls} onRowClick={(row) => navigate(`/admin/classes/${row.id}`)} />
                <Pagination page={pageCls} totalItems={sortedCls.length} onPageChange={setPageCls} />
              </>
            )}
          </Card>
        </>
      )}
    </MainLayout>
  );
};

export default StudentManage;