import React, { useEffect, useState } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const STATUS_VARIANT = { pending: 'orange', contacted: 'blue', enrolled: 'green', cancelled: 'gray' };
const STATUS_LABEL   = { pending: '⏳ Chờ xử lý', contacted: '📞 Đã liên hệ', enrolled: '✅ Đã nhập học', cancelled: '❌ Không tiếp tục' };

const TIME_OPTIONS = Array.from({length:34},(_,j)=>{const h=Math.floor(j/2)+6;const m=j%2*30;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;});

const ScheduleModal = ({ trial, teachers, rooms, onClose, onSave, onCreate }) => {
      const isNew = !trial?.id;
  const [form, setForm] = useState({
    name: trial?.name || '',
    phone: trial?.phone || '',
    instrument: trial?.instrument || 'Piano',
    age: trial?.age || '',
    teacher_id: trial?.teacher_id || '',
    trial_date: trial?.trial_date?.slice(0,10) || '',
    time_start: trial?.time_start?.slice(0,5) || '08:00',
    time_end: trial?.time_end?.slice(0,5) || '09:00',
    room_id: trial?.room_id || '',
    note: trial?.note || '',
  });
  const [saving, setSaving] = useState(false);

    const handleSave = async () => {
    if (isNew && !form.name) { toast.error('Nhập tên HV!'); return; }
    if (!form.teacher_id || !form.trial_date) { toast.error('Chọn giáo viên và ngày!'); return; }
    setSaving(true);
    if (isNew) {
      await onCreate({
        name: form.name, phone: form.phone, instrument: form.instrument,
        age: form.age, note: form.note, time: `${form.trial_date} ${form.time_start}`,
      }, {
        teacher_id: form.teacher_id, trial_date: form.trial_date,
        time_start: form.time_start + ':00', time_end: form.time_end + ':00',
        room_id: form.room_id, status: 'contacted',
      });
    } else {
      await onSave(trial.id, {
        ...form, status: 'contacted',
        time_start: form.time_start + ':00', time_end: form.time_end + ':00',
      });
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-5 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-800">{isNew ? '🧪 Tạo HV học thử' : '🧪 Xếp lịch học thử'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{trial?.name} · {trial?.instrument}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs">✕</button>
        </div>
        <div className="flex flex-col gap-3">
                    {isNew && (<>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Tên học viên *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Nguyễn Văn A" className="input-field text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">SĐT</label>
                <input type="text" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="0901234567" className="input-field text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Nhạc cụ</label>
                <select value={form.instrument} onChange={e => setForm(p => ({...p, instrument: e.target.value}))} className="input-field text-sm">
                  <option>Piano</option><option>Guitar</option><option>Violin</option><option>Thanh nhạc</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Tuổi / Năm sinh</label>
              <input type="text" value={form.age} onChange={e => setForm(p => ({...p, age: e.target.value}))} placeholder="VD: 8 tuổi" className="input-field text-sm" />
            </div>
          </>)}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Giáo viên dạy thử *</label>
            <select value={form.teacher_id} onChange={e => setForm(p => ({...p, teacher_id: e.target.value}))} className="input-field text-sm">
              <option value="">Chọn giáo viên...</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.instrument}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Ngày học thử *</label>
            <input type="date" value={form.trial_date} onChange={e => setForm(p => ({...p, trial_date: e.target.value}))} className="input-field text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Giờ bắt đầu</label>
              <select value={form.time_start} onChange={e => {
                const v = e.target.value; const [h,m] = v.split(':').map(Number);
                setForm(p => ({...p, time_start: v, time_end: `${String(Math.min(h+1,23)).padStart(2,'0')}:${String(m).padStart(2,'0')}`}));
              }} className="input-field text-sm">
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Giờ kết thúc</label>
              <select value={form.time_end} onChange={e => setForm(p => ({...p, time_end: e.target.value}))} className="input-field text-sm">
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Phòng</label>
            <select value={form.room_id} onChange={e => setForm(p => ({...p, room_id: e.target.value}))} className="input-field text-sm">
              <option value="">Chưa xếp phòng</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Ghi chú</label>
            <input type="text" value={form.note} onChange={e => setForm(p => ({...p, note: e.target.value}))} placeholder="Ghi chú thêm..." className="input-field text-sm" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Hủy</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
            {saving ? '⏳...' : '📅 Xếp lịch'}
          </button>
        </div>
      </div>
    </div>
  );
};

const TrialManage = () => {
  const [trials, setTrials]     = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [scheduleTarget, setScheduleTarget] = useState(null);

  const loadData = async () => {
    try {
      const [tRes, teachRes, roomRes] = await Promise.all([
        api.get('/trials'),
        api.get('/teachers'),
        api.get('/rooms'),
      ]);
      setTrials(tRes.rows || []);
      setTeachers(teachRes.rows || []);
      setRooms(roomRes.rows || []);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
    const createTrial = async (trialData, scheduleData) => {
    try {
      const res = await api.post('/trials', trialData);
      if (res.success) {
        const trials = await api.get('/trials');
        const newest = (trials.rows || [])[0];
        if (newest) await api.put(`/trials/${newest.id}`, scheduleData);
      }
      toast.success('Đã tạo HV học thử!');
      await loadData();
    } catch (err) { toast.error(err.message); }
  };
  const updateTrial = async (id, data) => {
    try {
      await api.put(`/trials/${id}`, data);
      toast.success('Cập nhật thành công!');
      await loadData();
    } catch (err) { toast.error(err.message); }
  };

  const deleteTrial = async (id) => {
    if (!window.confirm('Xóa đăng ký này?')) return;
    try {
      await api.delete(`/trials/${id}`);
      toast.success('Đã xóa!');
      await loadData();
    } catch (err) { toast.error(err.message); }
  };

  const pending   = trials.filter(t => t.status === 'pending').length;
  const contacted = trials.filter(t => t.status === 'contacted').length;
  const enrolled  = trials.filter(t => t.status === 'enrolled').length;
  const fmtDate   = d => d ? new Date(d).toLocaleDateString('vi-VN') : '';

  return (
    <MainLayout title="🧪 Quản lý học viên học thử">
      {scheduleTarget && (
        <ScheduleModal trial={scheduleTarget} teachers={teachers} rooms={rooms}
          onClose={() => setScheduleTarget(null)} onSave={updateTrial} onCreate={createTrial} />
      )}

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-500">{pending}</p>
          <p className="text-xs text-gray-500 mt-1">Chờ xếp lịch</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-500">{contacted}</p>
          <p className="text-xs text-gray-500 mt-1">Đã xếp lịch</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-500">{enrolled}</p>
          <p className="text-xs text-gray-500 mt-1">Đã nhập học</p>
        </div>
      </div>
      <div className="flex justify-end mb-4">
        <Button icon="➕" onClick={() => setScheduleTarget({})}>Tạo HV học thử</Button>
      </div>
      {loading ? (
        <p className="text-center text-gray-400 py-10">Đang tải...</p>
      ) : trials.length === 0 ? (
        <Card><p className="text-center text-gray-400 py-10">Chưa có học viên học thử nào</p></Card>
      ) : (
        <div className="flex flex-col gap-3">
          {trials.map(t => (
            <Card key={t.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold text-sm flex-shrink-0">
                    🧪
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-gray-800">{t.name}</p>
                      <Badge label={STATUS_LABEL[t.status]} variant={STATUS_VARIANT[t.status]} />
                    </div>
                    <p className="text-sm text-gray-500">📱 {t.phone} · 🎵 {t.instrument}</p>
                    {t.age && <p className="text-xs text-gray-400">👤 {t.age}</p>}
                    {t.teacher_name && (
                      <p className="text-sm text-blue-600 mt-1">👨‍🏫 {t.teacher_name}</p>
                    )}
                    {t.trial_date && (
                      <p className="text-sm text-primary-600 mt-0.5">
                        📅 {fmtDate(t.trial_date)} · {String(t.time_start||'').slice(0,5)}-{String(t.time_end||'').slice(0,5)}
                        {t.room_name && ` · 🚪 ${t.room_name}`}
                      </p>
                    )}
                    {t.note && <p className="text-xs text-gray-400 mt-1 italic">{t.note}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Đăng ký: {new Date(t.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {t.status === 'pending' && (
                    <Button size="sm" onClick={() => setScheduleTarget(t)}>📅 Xếp lịch</Button>
                  )}
                  {t.status === 'contacted' && (
                    <>
                      <Button size="sm" icon="✏️" variant="secondary" onClick={() => setScheduleTarget(t)}>Sửa lịch</Button>
                      <Button size="sm" onClick={() => updateTrial(t.id, { status: 'enrolled' })}>✅ Nhập học</Button>
                    </>
                  )}
                  {t.status !== 'cancelled' && t.status !== 'enrolled' && (
                    <Button size="sm" variant="ghost" onClick={() => updateTrial(t.id, { status: 'cancelled' })}>❌</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => deleteTrial(t.id)}>🗑️</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default TrialManage;