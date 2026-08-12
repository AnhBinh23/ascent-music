import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';

const DAYS = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','CN'];
const DAY_MAP = [2,3,4,5,6,7,1];
const DAY_LABELS = { 1:'CN', 2:'T2', 3:'T3', 4:'T4', 5:'T5', 6:'T6', 7:'T7' };
const START_HOUR = 7, END_HOUR = 21, SH = 60;
const COLORS = [
  { bg:'#dbeafe', border:'#93c5fd', text:'#1e40af' },
  { bg:'#dcfce7', border:'#86efac', text:'#166534' },
  { bg:'#fef3c7', border:'#fcd34d', text:'#92400e' },
  { bg:'#ede9fe', border:'#c4b5fd', text:'#5b21b6' },
  { bg:'#ffe4e6', border:'#fda4af', text:'#9f1239' },
  { bg:'#ffedd5', border:'#fdba74', text:'#9a3412' },
];

const t2m = t => { const[h,m]=String(t||'08:00').split(':').map(Number); return h*60+(m||0); };

const MySchedule = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [rooms, setRooms]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState('week');
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({
    class_id: '', day_of_week: 2, time_start: '08:00', time_end: '09:00', room_id: '',
  });
  const gridRef = useRef(null);
  const [makeups, setMakeups]       = useState([]);
  const [showMakeup, setShowMakeup] = useState(false);
  const [students, setStudents]     = useState([]);
  const [makeupForm, setMakeupForm] = useState({
    student_id: '', class_id: '', original_date: '', makeup_date: '',
    makeup_time_start: '08:00', makeup_time_end: '09:00', room_id: '', note: '',
  });
  const [savingMakeup, setSavingMakeup] = useState(false);

  const loadData = async () => {
    try {
      const tRes = await api.get(`/teachers/by-user/${user?.id}`);
      const tid = tRes?.row?.id;
      if (!tid) return;
      const [schedRes, classRes, roomRes] = await Promise.all([
        api.get(`/schedules/teacher/${tid}`),
        api.get(`/classes?teacher_id=${tid}`),
        api.get('/rooms'),
      ]);
      setSchedules(schedRes.rows || []);
      setMyClasses((classRes.rows || []).filter(c => c.status === 'Đang học'));
      setRooms(roomRes.rows || []);

      // Load lịch bù + HV
      const [mkRes] = await Promise.all([api.get('/makeup')]);
      setMakeups(mkRes.rows || []);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.id) loadData(); }, [user]);

  // Scroll to 7:00
  useEffect(() => {
    if (gridRef.current && view === 'week') {
      gridRef.current.scrollTop = 0;
    }
  }, [view]);

  const handleMakeupClassChange = async (classId) => {
    setMakeupForm(p => ({ ...p, class_id: classId, student_id: '' }));
    if (classId) {
      try {
        const res = await api.get(`/classes/${classId}/students`);
        setStudents(res.rows || []);
      } catch { setStudents([]); }
    } else { setStudents([]); }
  };

  const handleMakeupTimeStart = (e) => {
    const start = e.target.value;
    const [h, m] = start.split(':').map(Number);
    const endH = String(Math.min(h + 1, 23)).padStart(2, '0');
    const endM = String(m).padStart(2, '0');
    setMakeupForm(p => ({ ...p, makeup_time_start: start, makeup_time_end: `${endH}:${endM}` }));
  };

  const handleCreateMakeup = async () => {
    if (!makeupForm.student_id || !makeupForm.class_id || !makeupForm.makeup_date) {
      toast.error('Chọn HV, lớp và ngày bù!'); return;
    }
    setSavingMakeup(true);
    try {
      await api.post('/makeup', makeupForm);
      toast.success('✅ Đã tạo lịch bù! Admin sẽ nhận thông báo.');
      setShowMakeup(false);
      setMakeupForm({ student_id:'', class_id:'', original_date:'', makeup_date:'', makeup_time_start:'08:00', makeup_time_end:'09:00', room_id:'', note:'' });
      await loadData();
    } catch (err) { toast.error(err.message); }
    finally { setSavingMakeup(false); }
  };

  const handleDeleteMakeup = async (id) => {
    if (!window.confirm('Xóa lịch bù này?')) return;
    try { await api.delete(`/makeup/${id}`); toast.success('Đã xóa!'); await loadData(); }
    catch (err) { toast.error(err.message); }
  };

  const handleTimeStartChange = (e) => {
    const start = e.target.value;
    const [h, m] = start.split(':').map(Number);
    const endH = String(Math.min(h + 1, 23)).padStart(2, '0');
    const endM = String(m).padStart(2, '0');
    setForm(p => ({ ...p, time_start: start, time_end: `${endH}:${endM}` }));
  };

  const handleAdd = async () => {
    if (!form.class_id || !form.time_start || !form.time_end) {
      toast.error('Vui lòng chọn lớp và giờ!'); return;
    }
    setSaving(true);
    try {
      await api.post('/schedules', form);
      toast.success('✅ Đã thêm lịch dạy!');
      setShowForm(false);
      setForm({ class_id: '', day_of_week: 2, time_start: '08:00', time_end: '09:00', room_id: '' });
      await loadData();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa lịch này?')) return;
    try {
      await api.delete(`/schedules/${id}`);
      toast.success('Đã xóa!');
      await loadData();
    } catch (err) { toast.error(err.message); }
  };

  // Color map per class
  const colorMap = {};
  let ci = 0;
  schedules.forEach(s => { if (!colorMap[s.class_id]) colorMap[s.class_id] = COLORS[ci++ % COLORS.length]; });

  // Group by day for week view
  const byDay = DAY_MAP.map(dow => schedules.filter(s => Number(s.day_of_week) === dow));

  const todayJs = new Date().getDay();
  const todayIdx = todayJs === 0 ? 6 : todayJs - 1;

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  if (loading) return <MainLayout title="Lịch dạy"><p className="text-center text-gray-400 py-20">Đang tải...</p></MainLayout>;

  return (
    <MainLayout title="Lịch dạy">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          {[
            { key: 'week', label: '📅 Lịch tuần' },
            { key: 'list', label: '📋 Danh sách' },
            { key: 'makeup', label: `🔄 Học bù (${makeups.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setView(t.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${view === t.key ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
        {view === 'makeup' ? (
          <Button icon="🔄" onClick={() => setShowMakeup(!showMakeup)}>
            {showMakeup ? 'Đóng' : 'Tạo lịch bù'}
          </Button>
        ) : (
          <Button icon="➕" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Đóng' : 'Thêm lịch'}
          </Button>
        )}
      </div>

      {/* Form thêm */}
      {showForm && (
        <div className="card mb-5">
          <p className="text-sm font-bold text-gray-700 mb-3">➕ Thêm lịch dạy mới</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Lớp học *</label>
              <select value={form.class_id} onChange={e => setForm(p => ({ ...p, class_id: e.target.value }))} className="input-field">
                <option value="">Chọn lớp...</option>
                {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Thứ *</label>
              <select value={form.day_of_week} onChange={e => setForm(p => ({ ...p, day_of_week: Number(e.target.value) }))} className="input-field">
                {DAY_MAP.map((d, i) => <option key={d} value={d}>{DAYS[i]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Giờ bắt đầu *</label>
              <input type="time" value={form.time_start} onChange={handleTimeStartChange} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Giờ kết thúc *</label>
              <input type="time" value={form.time_end} onChange={e => setForm(p => ({ ...p, time_end: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Phòng</label>
              <select value={form.room_id} onChange={e => setForm(p => ({ ...p, room_id: e.target.value }))} className="input-field">
                <option value="">Chưa xếp phòng</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleAdd} loading={saving}>✅ Lưu lịch</Button>
          </div>
        </div>
      )}

      {/* ── VIEW: Lịch tuần (giống admin) ── */}
      {view === 'week' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Header ngày */}
          <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: '50px repeat(7, 1fr)' }}>
            <div className="p-2 bg-gray-50" />
            {DAYS.map((d, i) => (
              <div key={i} className={`py-2 text-center border-l border-gray-100 ${i === todayIdx ? 'bg-primary-50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-semibold ${i === todayIdx ? 'text-primary-600' : 'text-gray-500'}`}>{d}</p>
                {i === todayIdx && <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mx-auto mt-1" />}
              </div>
            ))}
          </div>

          {/* Grid giờ */}
          <div ref={gridRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
            <div className="grid" style={{ gridTemplateColumns: '50px repeat(7, 1fr)' }}>
              {/* Cột giờ */}
              <div className="relative" style={{ height: hours.length * SH }}>
                {hours.map(h => (
                  <div key={h} className="absolute w-full flex items-start justify-end pr-1"
                    style={{ top: (h - START_HOUR) * SH, height: SH }}>
                    <span className="text-xs text-gray-400 -mt-2">{String(h).padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>

              {/* 7 cột ngày */}
              {byDay.map((daySchedules, di) => (
                <div key={di} className={`relative border-l border-gray-100 ${di === todayIdx ? 'bg-primary-50/30' : ''}`}
                  style={{ height: hours.length * SH }}>
                  {/* Đường kẻ giờ */}
                  {hours.map(h => (
                    <div key={h} className="absolute w-full border-t border-gray-50"
                      style={{ top: (h - START_HOUR) * SH }} />
                  ))}

                  {/* Events */}
                  {daySchedules.map(s => {
                    const startMin = t2m(s.time_start);
                    const endMin   = t2m(s.time_end);
                    const top  = (startMin / 60 - START_HOUR) * SH;
                    const h0   = Math.max((endMin - startMin) / 60 * SH, 30);
                    const color = colorMap[s.class_id] || COLORS[0];
                    return (
                      <div key={s.id}
                        className="absolute left-1 right-1 rounded-lg border overflow-hidden cursor-pointer group"
                        style={{ top, height: h0, backgroundColor: color.bg, borderColor: color.border }}
                        title={`${s.class_name}\n${String(s.time_start||'').slice(0,5)}–${String(s.time_end||'').slice(0,5)}\n${s.room_name||''}`}>
                        <div className="px-1.5 py-1 h-full flex flex-col justify-between">
                          <div>
                            <p className="text-xs font-bold truncate" style={{ color: color.text }}>{s.class_name}</p>
                            {h0 > 35 && <p className="text-xs truncate" style={{ color: color.text, opacity: 0.7 }}>
                              {String(s.time_start||'').slice(0,5)}–{String(s.time_end||'').slice(0,5)}
                            </p>}
                            {h0 > 50 && <p className="text-xs truncate" style={{ color: color.text, opacity: 0.6 }}>
                              {s.room_name || ''}
                            </p>}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                            className="absolute top-1 right-1 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100">
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW: Danh sách ── */}
      {view === 'list' && (
        <>
          {schedules.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-gray-400">Chưa có lịch dạy</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {DAY_MAP.map((dow, di) => {
                const items = schedules.filter(s => Number(s.day_of_week) === dow)
                  .sort((a, b) => (a.time_start || '').localeCompare(b.time_start || ''));
                if (!items.length) return null;
                return (
                  <div key={dow}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className={`text-sm font-bold ${di === todayIdx ? 'text-primary-600' : 'text-gray-600'}`}>{DAYS[di]}</p>
                      {di === todayIdx && <Badge label="Hôm nay" variant="green" />}
                      <span className="text-xs text-gray-400">{items.length} buổi</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map(s => {
                        const color = colorMap[s.class_id] || COLORS[0];
                        return (
                          <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl border"
                            style={{ backgroundColor: color.bg, borderColor: color.border }}>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: 'rgba(255,255,255,0.6)', color: color.text }}>
                                <span>{String(s.time_start || '').slice(0, 5)}</span>
                                <span style={{ opacity: 0.6, fontSize: 9 }}>{String(s.time_end || '').slice(0, 5)}</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: color.text }}>{s.class_name}</p>
                                <p className="text-xs" style={{ color: color.text, opacity: 0.7 }}>{s.room_name || 'Chưa xếp phòng'} · {s.instrument || ''}</p>
                              </div>
                            </div>
                            <button onClick={() => handleDelete(s.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors text-sm p-2" title="Xóa">🗑️</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {/* ── VIEW: Học bù ── */}
      {view === 'makeup' && (
        <>
          {/* Form tạo lịch bù */}
          {showMakeup && (
            <div className="card mb-5">
              <p className="text-sm font-bold text-gray-700 mb-3">🔄 Tạo lịch học bù</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Lớp học *</label>
                  <select value={makeupForm.class_id} onChange={e => handleMakeupClassChange(e.target.value)} className="input-field">
                    <option value="">Chọn lớp...</option>
                    {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Học viên *</label>
                  <select value={makeupForm.student_id} onChange={e => setMakeupForm(p => ({...p, student_id: e.target.value}))} className="input-field">
                    <option value="">Chọn HV...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}{s.nickname ? ` (${s.nickname})` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Ngày vắng</label>
                  <input type="date" value={makeupForm.original_date} onChange={e => setMakeupForm(p => ({...p, original_date: e.target.value}))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Ngày bù *</label>
                  <input type="date" value={makeupForm.makeup_date} onChange={e => setMakeupForm(p => ({...p, makeup_date: e.target.value}))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Giờ bắt đầu *</label>
                  <input type="time" value={makeupForm.makeup_time_start} onChange={handleMakeupTimeStart} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Giờ kết thúc</label>
                  <input type="time" value={makeupForm.makeup_time_end} onChange={e => setMakeupForm(p => ({...p, makeup_time_end: e.target.value}))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Phòng</label>
                  <select value={makeupForm.room_id} onChange={e => setMakeupForm(p => ({...p, room_id: e.target.value}))} className="input-field">
                    <option value="">Chưa xếp</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Ghi chú</label>
                  <input type="text" value={makeupForm.note} onChange={e => setMakeupForm(p => ({...p, note: e.target.value}))} className="input-field" placeholder="Lý do..." />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" onClick={() => setShowMakeup(false)}>Hủy</Button>
                <Button onClick={handleCreateMakeup} loading={savingMakeup}>✅ Gửi yêu cầu bù</Button>
              </div>
            </div>
          )}

          {/* Danh sách lịch bù */}
          {makeups.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-3xl mb-2">🔄</p>
              <p className="text-gray-400">Chưa có lịch học bù</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {makeups.map(m => {
                const statusCfg = {
                  pending:   { label: '⏳ Chờ duyệt',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                  confirmed: { label: '✅ Đã duyệt',    color: 'bg-green-100 text-green-700 border-green-200' },
                  completed: { label: '🎉 Hoàn thành',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
                  cancelled: { label: '❌ Đã từ chối',  color: 'bg-red-100 text-red-700 border-red-200' },
                };
                const cfg = statusCfg[m.status] || statusCfg.pending;
                return (
                  <div key={m.id} className={`p-4 rounded-2xl border ${cfg.color}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold">{m.student_name}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-white/50">{cfg.label}</span>
                        </div>
                        <p className="text-xs opacity-70">{m.class_name}</p>
                        <div className="flex gap-3 mt-2 text-xs">
                          {m.original_date && <span>📅 Vắng: {new Date(m.original_date).toLocaleDateString('vi-VN')}</span>}
                          <span>🔄 Bù: {new Date(m.makeup_date).toLocaleDateString('vi-VN')} lúc {String(m.makeup_time_start||'').slice(0,5)}</span>
                          {m.room_name && <span>🚪 {m.room_name}</span>}
                        </div>
                        {m.note && <p className="text-xs italic mt-1 opacity-60">{m.note}</p>}
                      </div>
                      {m.status === 'pending' && (
                        <button onClick={() => handleDeleteMakeup(m.id)} className="text-red-400 hover:text-red-600 text-sm p-1">🗑️</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default MySchedule;