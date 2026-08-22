import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/shared/SearchBar';
import Loading from '../../components/ui/Loading';
import Pagination, { PAGE_SIZE } from '../../components/ui/Pagination';
import SalaryManage from './teachers/SalaryManage';
import teacherService from '../../services/teacherService';
import api from '../../services/api';
import { toast } from 'react-toastify';

const INSTRUMENT_VARIANT = { Piano:'blue', Guitar:'green', Violin:'purple', 'Thanh nhạc':'orange' };
const fmt = n => Number(n||0).toLocaleString('vi-VN') + 'đ';

const TeacherManage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = location.pathname.startsWith('/staff') ? '/staff' : '/admin';
  const tab = searchParams.get('tab') || 'teachers';

  // ── GV ──
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [pageTeacher, setPageTeacher] = useState(1);

  // ── Chấm công ──
  const [checkins, setCheckins]       = useState([]);
  const [loadingCk, setLoadingCk]     = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [pageCk, setPageCk]           = useState(1);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [tData, cData, sData] = await Promise.all([
          teacherService.getAll(),
          api.get('/classes'),
          api.get('/schedules'),
        ]);
        const classes = cData.rows || [];
        const scheds = sData.rows || [];

        // Gộp thông tin vào teacher
        const merged = tData.map(t => {
          const myClasses = classes.filter(c => c.teacher_id === t.id && c.status === 'Đang học');
          const myScheds = scheds.filter(s => s.teacher_id === t.id);
          const DAY = { 1:'CN', 2:'T2', 3:'T3', 4:'T4', 5:'T5', 6:'T6', 7:'T7' };
          const schedText = myScheds.map(s => `${DAY[s.day_of_week]} ${String(s.time_start||'').slice(0,5)}`).join(', ');
          return {
            ...t,
            class_count: myClasses.length,
            student_count: myClasses.reduce((s, c) => s + Number(c.student_count || 0), 0),
            schedule_text: schedText || '—',
          };
        });
        setTeachers(merged);
      } catch (err) { toast.error(err.message); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const sortedTeachers = useMemo(() => {
    const q = search.toLowerCase();
    return teachers
      .filter(t => t.name?.toLowerCase().includes(q) || t.phone?.includes(q) || t.instrument?.toLowerCase().includes(q))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
  }, [search, teachers]);

  const pagedTeachers = sortedTeachers.slice((pageTeacher - 1) * PAGE_SIZE, pageTeacher * PAGE_SIZE);
  useEffect(() => { setPageTeacher(1); }, [search]);

  useEffect(() => {
    if (tab !== 'checkin') return;
    const fetchCheckins = async () => {
      try {
        setLoadingCk(true);
        const res = await api.get('/checkin');
        setCheckins(res.rows || []);
      } catch (err) { toast.error(err.message); }
      finally { setLoadingCk(false); }
    };
    fetchCheckins();
  }, [tab]);

  const filteredCheckins = useMemo(() => {
    return checkins
      .filter(c => c.date?.slice(0, 7) === filterMonth)
      .sort((a, b) => (a.teacher_name || '').localeCompare(b.teacher_name || '', 'vi'));
  }, [checkins, filterMonth]);

  const pagedCheckins = filteredCheckins.slice((pageCk - 1) * PAGE_SIZE, pageCk * PAGE_SIZE);
  useEffect(() => { setPageCk(1); }, [filterMonth]);

  const availableMonths = [...new Set(checkins.map(c => c.date?.slice(0, 7)).filter(Boolean))].sort((a,b) => b.localeCompare(a));

  const columns = [
    { key: 'name', label: 'Giáo viên',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          <p className="text-xs text-gray-400">{row.phone}</p>
        </div>
      )
    },
    { key: 'instrument', label: 'Chuyên môn', render: (val) => <Badge label={val} variant={INSTRUMENT_VARIANT[val]||'gray'} /> },
    { key: 'salary_amount', label: 'Lương/buổi', render: (val) => <span className="font-medium">{fmt(val)}</span> },
    { key: 'status', label: 'Trạng thái',
      render: (val) => <Badge label={val==='active'?'Đang dạy':'Nghỉ'} variant={val==='active'?'green':'gray'} dot />
    },
    { key: 'id', label: '',
      render: (val) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/teachers/${val}`); }}>Xem</Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/teachers/edit/${val}`); }}>✏️</Button>
        </div>
      )
    },
  ];

  const tabTitle = tab === 'salary' ? 'Lương giáo viên' : tab === 'checkin' ? 'Chấm công giáo viên' : 'Quản lý giáo viên';

  return (
    <MainLayout title={tabTitle}>
      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 bg-gray-100 p-1 rounded-2xl">
        {[
          { key:'teachers', label:'👨‍🏫 Giáo viên' },
          { key:'salary',   label:'💰 Lương' },
          { key:'checkin',  label:'📋 Chấm công' },
        ].map(t => (
          <button key={t.key} onClick={() => setSearchParams({ tab: t.key })}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab===t.key?'bg-white shadow text-primary-600':'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Giáo viên */}
      {tab === 'teachers' && (
        <>
          <div className="flex gap-3 mb-5">
            <div className="flex-1">
              <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên, SĐT, chuyên môn..." />
            </div>
            <Button icon="➕" onClick={() => navigate(`${basePath}/teachers/new`)}>Thêm giáo viên</Button>
          </div>
          <Card subtitle={`${sortedTeachers.length} giáo viên · A → Z`}>
            {loading ? <Loading /> : (
              <>
                <Table columns={columns} data={pagedTeachers} onRowClick={(row) => navigate(`${basePath}/teachers/${row.id}`)} />
                <Pagination page={pageTeacher} totalItems={sortedTeachers.length} onPageChange={setPageTeacher} />
              </>
            )}
          </Card>
        </>
      )}

      {/* Tab Lương */}
      {tab === 'salary' && <SalaryManage embedded />}

      {/* Tab Chấm công */}
      {tab === 'checkin' && (
        <>
          <div className="mb-4">
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
              className="input-field w-auto">
              {(availableMonths.length ? availableMonths : [filterMonth]).map(m => (
                <option key={m} value={m}>{new Date(m+'-01').toLocaleDateString('vi-VN', { month:'long', year:'numeric' })}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="card text-center">
              <p className="text-2xl font-bold text-primary-600">{filteredCheckins.length}</p>
              <p className="text-xs text-gray-500 mt-1">Buổi chấm công</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-orange-600">{fmt(filteredCheckins.reduce((s,c) => s + Number(c.salary_earned||0), 0))}</p>
              <p className="text-xs text-gray-500 mt-1">Tổng lương</p>
            </div>
          </div>
          {loadingCk ? <Loading /> : filteredCheckins.length === 0 ? (
            <Card><p className="text-center text-gray-400 py-10">Chưa có dữ liệu chấm công tháng này</p></Card>
          ) : (
            <>
            <div className="flex flex-col gap-2">
              {pagedCheckins.map((c, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-sm font-bold text-primary-700">
                    {String(c.time||'').slice(0,5) || '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{c.teacher_name}</p>
                    <p className="text-xs text-gray-500">{c.class_name} · {new Date(c.date).toLocaleDateString('vi-VN', { weekday:'short', day:'numeric', month:'numeric' })}</p>
                    {c.note && <p className="text-xs text-gray-400 italic">{c.note}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-green-600">{Number(c.salary_earned) ? fmt(c.salary_earned) : '—'}</p>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={pageCk} totalItems={filteredCheckins.length} onPageChange={setPageCk} />
            </>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default TeacherManage;