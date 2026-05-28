import React, { useEffect, useState, useCallback, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

const STATUS_CONFIG = {
  present: { label: 'Có mặt',   variant: 'green',  icon: '✅', bg: '#fed7aa', text: '#9a3412' },
  absent:  { label: 'Vắng mặt', variant: 'red',    icon: '❌', bg: '#fecaca', text: '#991b1b' },
  late:    { label: 'Đi muộn',  variant: 'orange', icon: '⏰', bg: '#fef08a', text: '#713f12' },
  excused: { label: 'Có phép',  variant: 'blue',   icon: '📝', bg: '#bfdbfe', text: '#1e3a8a' },
};

const getWarning = (attended, total) => {
  if (!total) return null;
  const rem = total - attended;
  if (rem <= 0) return { label: 'Hết khóa',        color: 'bg-red-100 text-red-600 border-red-200',         icon: '🔴' };
  if (rem <= 2) return { label: `Còn ${rem} buổi`, color: 'bg-red-50 text-red-500 border-red-100',          icon: '🚨' };
  if (rem < 5)  return { label: `Còn ${rem} buổi`, color: 'bg-orange-50 text-orange-500 border-orange-100', icon: '⚠️' };
  return null;
};

const fmtDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}`;
};

// ── Session Detail Modal ───────────────────────────────────────────────────────
const SessionModal = ({ student, classId, className, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!student || !classId) return;
    api.get(`/attendance/student-sessions/${student.student_id}/${classId}`)
      .then(d => setSessions(d.rows || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [student, classId]);

  if (!student) return null;
  const attended = sessions.filter(s => ['present','late'].includes(s.status)).length;
  const total    = student.total_sessions || 0;
  const pct      = total > 0 ? Math.round(attended / total * 100) : 0;
  const warning  = getWarning(attended, total);
  const barColor = pct >= 100 ? '#dc2626' : pct >= 80 ? '#ea580c' : '#16a34a';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col shadow-xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{student.student_name}</h3>
            <p className="text-sm text-gray-500">{className} · {student.teacher_name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-sm">✕</button>
        </div>
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">Tiến độ</p>
            <div className="flex items-center gap-2">
              {warning && <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${warning.color}`}>{warning.icon} {warning.label}</span>}
              <span className="text-sm font-bold text-gray-800">{attended}/{total} buổi</span>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width:`${Math.min(pct,100)}%`, backgroundColor: barColor }} />
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-400">{pct}% hoàn thành</p>
            {total > 0 && <p className="text-xs text-gray-400">Còn {Math.max(0, total-attended)} buổi</p>}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="text-center p-2 bg-gray-50 rounded-xl">
                <p className="text-lg">{cfg.icon}</p>
                <p className="text-sm font-bold text-gray-800">{sessions.filter(s => s.status === key).length}</p>
                <p className="text-xs text-gray-400">{cfg.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Lịch sử điểm danh</p>
          {loading ? <p className="text-center text-gray-400 py-6">Đang tải...</p> :
            sessions.length === 0 ? <p className="text-center text-gray-400 py-6">Chưa có buổi học</p> : (
            <div className="flex flex-col gap-2">
              {sessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: STATUS_CONFIG[s.status]?.bg || '#f9fafb' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: 'rgba(0,0,0,0.1)', color: STATUS_CONFIG[s.status]?.text || '#374151' }}>
                      {i+1}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: STATUS_CONFIG[s.status]?.text || '#374151' }}>
                        {new Date(s.date).toLocaleDateString('vi-VN', { weekday:'short', day:'numeric', month:'numeric', year:'numeric' })}
                      </p>
                      {s.time_start && <p className="text-xs opacity-70" style={{ color: STATUS_CONFIG[s.status]?.text }}>{s.time_start?.slice(0,5)} – {s.time_end?.slice(0,5)}</p>}
                      {s.note && <p className="text-xs italic opacity-60" style={{ color: STATUS_CONFIG[s.status]?.text }}>"{s.note}"</p>}
                    </div>
                  </div>
                  <span className="text-lg">{STATUS_CONFIG[s.status]?.icon || '•'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Attendance Table ───────────────────────────────────────────────────────────
const AttendanceTable = ({ classId, filterMonth }) => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading]     = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    const url = (!classId || classId === 'all')
      ? '/attendance/all-table'
      : `/attendance/table/${classId}`;
    api.get(url)
      .then(d => setTableData(d.rows || []))
      .catch(err => console.error(err.message))
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading)         return <p className="text-center text-gray-400 py-8">Đang tải bảng...</p>;
  if (!tableData.length) return <p className="text-center text-gray-400 py-8">Chưa có dữ liệu</p>;

  // Lọc sessions theo tháng
  const displayData = tableData.map(student => ({
    ...student,
    sessions: (!filterMonth || filterMonth === 'all')
      ? student.sessions
      : student.sessions.filter(s => s.date?.slice(0,7) === filterMonth),
  }));

  const maxSess = Math.max(
    ...displayData.map(r => Math.max(
      r.sessions.length,
      (!filterMonth || filterMonth === 'all') ? (r.total_sessions || 0) : 0
    )), 0
  );
  const sessionNums = Array.from({ length: Math.max(maxSess, 1) }, (_, i) => i + 1);

  return (
    <div ref={scrollRef} className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
      <table className="border-collapse text-xs" style={{ minWidth: Math.max(500, sessionNums.length * 52 + 360) }}>
        <thead>
          <tr className="bg-gray-100">
            <th className="sticky left-0 z-20 bg-gray-100 border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap" style={{ minWidth: 130 }}>Học viên</th>
            <th className="sticky bg-gray-100 border border-gray-200 px-2 py-2 font-semibold text-gray-600 whitespace-nowrap" style={{ left: 130, minWidth: 90, zIndex: 20 }}>Lớp học</th>
            <th className="sticky bg-gray-100 border border-gray-200 px-2 py-2 font-semibold text-gray-600 whitespace-nowrap" style={{ left: 220, minWidth: 60, zIndex: 20 }}>H.thức</th>
            <th className="sticky bg-gray-100 border border-gray-200 px-2 py-2 font-semibold text-gray-600 whitespace-nowrap" style={{ left: 280, minWidth: 60, zIndex: 20 }}>Gói học</th>
            {sessionNums.map(n => (
              <th key={n} className="border border-gray-200 px-1 py-2 font-semibold text-gray-500 text-center" style={{ minWidth: 48, width: 48 }}>{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.map((student, si) => {
            const attended = student.sessions.filter(s => ['present','late'].includes(s.status)).length;
            const total    = student.total_sessions || 0;
            const warning  = getWarning(attended, total);
            const rowBg    = si % 2 === 0 ? '#fff' : '#f9fafb';

            return (
              <tr key={si}>
                <td className="sticky left-0 z-10 border border-gray-200 px-3 py-1.5 whitespace-nowrap font-medium text-gray-800" style={{ backgroundColor: rowBg, minWidth: 130 }}>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate max-w-[110px]">{student.name}</span>
                    {warning && <span title={warning.label} className="flex-shrink-0">{warning.icon}</span>}
                  </div>
                </td>
                <td className="sticky border border-gray-200 px-2 py-1.5 text-xs text-gray-600 whitespace-nowrap" style={{ left: 130, backgroundColor: rowBg, zIndex: 10, minWidth: 90 }}>
                  <span className="truncate max-w-[80px] block">{student.class_name || '—'}</span>
                </td>
                <td className="sticky border border-gray-200 px-2 py-1.5 text-center text-gray-600 whitespace-nowrap" style={{ left: 220, backgroundColor: rowBg, zIndex: 10 }}>
                  {student.class_type === '1v1' ? '1-1' : 'Nhóm'}
                </td>
                <td className="sticky border border-gray-200 px-2 py-1.5 text-center font-medium whitespace-nowrap" style={{ left: 280, backgroundColor: rowBg, zIndex: 10, color: warning ? '#ea580c' : '#374151' }}>
                  {total > 0 ? total : '—'}
                </td>
                {sessionNums.map(n => {
                  const session  = student.sessions[n - 1];
                  const isFuture = !session && n > student.sessions.length && n <= total && (!filterMonth || filterMonth === 'all');
                  const cfg      = session ? STATUS_CONFIG[session.status] : null;
                  return (
                    <td key={n} className="border border-gray-200 text-center p-0"
                      style={{ backgroundColor: session ? cfg?.bg : isFuture ? '#f8fafc' : 'transparent', minWidth: 48, width: 48 }}
                      title={session ? `${new Date(session.date).toLocaleDateString('vi-VN')} — ${cfg?.label}${session.note ? ` — ${session.note}` : ''}` : ''}>
                      {session ? (
                        <div className="py-1 px-0.5">
                          <p className="font-semibold leading-tight" style={{ color: cfg?.text || '#374151', fontSize: 11 }}>{fmtDate(session.date)}</p>
                          <p style={{ fontSize: 9, color: cfg?.text, opacity: 0.7 }}>{cfg?.icon}</p>
                        </div>
                      ) : isFuture ? (
                        <span className="text-gray-200 text-lg">·</span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-3 p-3 bg-gray-50 border-t border-gray-200">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: cfg.bg }} />
            <span className="text-xs text-gray-600">{cfg.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-gray-200 bg-slate-50" />
          <span className="text-xs text-gray-600">Chưa học</span>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AttendanceManage = () => {
  const [progress, setProgress]               = useState([]);
  const [classes, setClasses]                 = useState([]);
  const [records, setRecords]                 = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [tab, setTab]                         = useState('overview');
  const [selectedClass, setSelectedClass]     = useState('all');
  const [date, setDate]                       = useState(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth]         = useState(new Date().toISOString().slice(0, 7));
  const [tableMonth, setTableMonth]           = useState(new Date().toISOString().slice(0, 7));
  const [viewTab, setViewTab]                 = useState('date');
  const [searchName, setSearchName]           = useState('');
  const [filterWarning, setFilterWarning]     = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedClassName, setSelectedClassName] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [prog, cls] = await Promise.all([
        api.get('/attendance/course-progress'),
        api.get('/classes'),
      ]);
      setProgress(prog.rows || []);
      setClasses(cls.rows || []);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!selectedClass || selectedClass === 'all') return;
    api.get(`/attendance/class/${selectedClass}`)
      .then(d => setRecords(d.rows || []))
      .catch(err => console.error(err.message));
  }, [selectedClass]);

  const filteredProgress = progress.filter(p =>
    (!searchName || p.student_name?.toLowerCase().includes(searchName.toLowerCase())) &&
    (!filterWarning || getWarning(p.attended, p.total_sessions))
  );
  const warningCount = progress.filter(p => getWarning(p.attended, p.total_sessions)).length;

  const filteredRecords =
    viewTab === 'date'  ? records.filter(r => r.date === date) :
    viewTab === 'month' ? records.filter(r => r.date?.slice(0,7) === filterMonth) :
    records;

  const stats = { present:0, absent:0, late:0, excused:0 };
  filteredRecords.forEach(r => { if (stats[r.status] !== undefined) stats[r.status]++; });

  const groupedByDate   = filteredRecords.reduce((acc, r) => { if (!acc[r.date]) acc[r.date]=[]; acc[r.date].push(r); return acc; }, {});
  const sortedDates     = Object.keys(groupedByDate).sort((a,b) => b.localeCompare(a));
  const availableMonths = [...new Set(records.map(r => r.date?.slice(0,7)))].filter(Boolean).sort((a,b) => b.localeCompare(a));

  if (loading) return <MainLayout title="Quản lý điểm danh"><p className="text-center py-16 text-gray-400">Đang tải...</p></MainLayout>;

  return (
    <MainLayout title="Quản lý điểm danh">
      <SessionModal student={selectedStudent} classId={selectedClassId} className={selectedClassName}
        onClose={() => { setSelectedStudent(null); setSelectedClassId(null); }} />

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 bg-gray-100 p-1 rounded-2xl">
        {[
          { key:'overview', label:'👥 Tổng quan' },
          { key:'table',    label:'📊 Bảng tổng hợp' },
          { key:'detail',   label:'📋 Chi tiết' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${tab===t.key ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
            {t.label}
            {t.key === 'overview' && warningCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center font-bold" style={{fontSize:9}}>
                {warningCount > 9 ? '9+' : warningCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TỔNG QUAN ── */}
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="card text-center"><p className="text-2xl font-bold text-blue-600">{progress.length}</p><p className="text-xs text-gray-500 mt-1">Tổng học viên</p></div>
            <div className="card text-center"><p className="text-2xl font-bold text-red-500">{warningCount}</p><p className="text-xs text-gray-500 mt-1">Sắp hết khóa</p></div>
            <div className="card text-center"><p className="text-2xl font-bold text-green-600">{progress.filter(p => p.total_sessions > 0 && p.attended >= p.total_sessions).length}</p><p className="text-xs text-gray-500 mt-1">Hoàn thành</p></div>
          </div>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="🔍 Tìm tên học viên..." value={searchName}
              onChange={e => setSearchName(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
            <button onClick={() => setFilterWarning(!filterWarning)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${filterWarning ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200'}`}>
              ⚠️
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {filteredProgress.length === 0 ? <p className="text-center text-gray-400 py-10">Không có dữ liệu</p>
              : filteredProgress.map((p, i) => {
              const warning  = getWarning(p.attended, p.total_sessions);
              const pct      = p.total_sessions > 0 ? Math.round(p.attended/p.total_sessions*100) : 0;
              const barColor = pct>=100?'#dc2626':pct>=80?'#ea580c':'#16a34a';
              return (
                <div key={i} onClick={() => { setSelectedStudent(p); setSelectedClassId(p.class_id); setSelectedClassName(p.class_name); }}
                  className="flex items-center gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700 font-bold flex-shrink-0">{p.student_name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{p.student_name}</p>
                      {warning && <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${warning.color}`}>{warning.icon} {warning.label}</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{p.class_name} · {p.teacher_name}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${Math.min(pct,100)}%`, backgroundColor:barColor }} />
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{p.attended}{p.total_sessions>0?`/${p.total_sessions}`:''} buổi</span>
                    </div>
                  </div>
                  <span className="text-gray-300 flex-shrink-0">›</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── BẢNG TỔNG HỢP ── */}
      {tab === 'table' && (
        <>
          <div className="flex gap-2 mb-3">
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input-field flex-1">
              <option value="all">📊 Tất cả các lớp</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="month" value={tableMonth === 'all' ? '' : tableMonth}
              onChange={e => setTableMonth(e.target.value || 'all')}
              className="input-field w-auto" />
            <button onClick={() => setTableMonth('all')}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all flex-shrink-0 ${tableMonth === 'all' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200'}`}>
              Tất cả
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3 px-1">
            {tableMonth === 'all'
              ? '📅 Hiển thị tất cả các buổi'
              : `📅 Tháng ${new Date(tableMonth + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}`}
          </p>
          <AttendanceTable classId={selectedClass} filterMonth={tableMonth} />
        </>
      )}

      {/* ── CHI TIẾT ── */}
      {tab === 'detail' && (
        <>
          <select value={selectedClass === 'all' ? '' : selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input-field w-full mb-4">
            <option value="">-- Chọn lớp học --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {(!selectedClass || selectedClass === 'all') ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-gray-400">Chọn lớp để xem điểm danh</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-2xl">
                {[{key:'date',label:'📅 Ngày'},{key:'month',label:'🗓️ Tháng'},{key:'all',label:'📋 Tất cả'}].map(t => (
                  <button key={t.key} onClick={() => setViewTab(t.key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${viewTab===t.key?'bg-white shadow text-primary-600':'text-gray-500'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              {viewTab==='date' && <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input-field w-full mb-4" />}
              {viewTab==='month' && (
                <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="input-field w-full mb-4">
                  {(availableMonths.length?availableMonths:[filterMonth]).map(m => (
                    <option key={m} value={m}>{new Date(m+'-01').toLocaleDateString('vi-VN',{month:'long',year:'numeric'})}</option>
                  ))}
                </select>
              )}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {Object.entries(STATUS_CONFIG).map(([key,cfg]) => (
                  <div key={key} className="card text-center py-3">
                    <p className="text-xl">{cfg.icon}</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">{stats[key]}</p>
                    <p className="text-xs text-gray-400">{cfg.label}</p>
                  </div>
                ))}
              </div>
              {viewTab==='date' ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    {new Date(date).toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                  </p>
                  {filteredRecords.length===0 ? <p className="text-center text-gray-400 py-8">Chưa có điểm danh ngày này</p> : (
                    <div className="flex flex-col gap-2">
                      {filteredRecords.map((r,i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                          style={{ backgroundColor: STATUS_CONFIG[r.status]?.bg||'#f9fafb' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor:'rgba(0,0,0,0.1)', color: STATUS_CONFIG[r.status]?.text||'#374151' }}>{i+1}</div>
                            <div>
                              <p className="text-sm font-semibold" style={{color:STATUS_CONFIG[r.status]?.text||'#374151'}}>{r.student_name}</p>
                              {r.note && <p className="text-xs italic opacity-70" style={{color:STATUS_CONFIG[r.status]?.text}}>"{r.note}"</p>}
                            </div>
                          </div>
                          <span className="text-lg">{STATUS_CONFIG[r.status]?.icon||'•'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {sortedDates.length===0
                    ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center"><p className="text-gray-400">Chưa có dữ liệu</p></div>
                    : sortedDates.map(d => {
                      const items  = groupedByDate[d];
                      const pCount = items.filter(r=>r.status==='present').length;
                      return (
                        <div key={d}>
                          <div className="flex justify-between px-1 mb-2">
                            <p className="text-sm font-semibold text-gray-600 capitalize">
                              {new Date(d).toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'numeric',year:'numeric'})}
                            </p>
                            <p className="text-xs text-gray-400">{pCount}/{items.length} có mặt</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {items.map((r,i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700 text-sm font-bold">{r.student_name?.charAt(0)}</div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{r.student_name}</p>
                                    {r.note && <p className="text-xs text-gray-400 italic">"{r.note}"</p>}
                                  </div>
                                </div>
                                <Badge label={STATUS_CONFIG[r.status]?.label||r.status} variant={STATUS_CONFIG[r.status]?.variant||'gray'} dot />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default AttendanceManage;