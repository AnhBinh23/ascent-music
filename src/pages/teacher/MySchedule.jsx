import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';

const DAY_MAP = { 1:'Chủ nhật', 2:'Thứ 2', 3:'Thứ 3', 4:'Thứ 4', 5:'Thứ 5', 6:'Thứ 6', 7:'Thứ 7' };
const DAY_OPTIONS = [
  { value: 2, label: 'Thứ 2' }, { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' }, { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' }, { value: 7, label: 'Thứ 7' },
  { value: 1, label: 'Chủ nhật' },
];

const MySchedule = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [rooms, setRooms]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm] = useState({
    class_id: '', day_of_week: 2, time_start: '08:00', time_end: '09:00', room_id: '',
  });

  const loadData = useCallback(async () => {
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
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (user?.id) loadData(); }, [user, loadData]);

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

  // Nhóm theo thứ
  const grouped = schedules.reduce((acc, s) => {
    const day = DAY_MAP[s.day_of_week] || `Thứ ${s.day_of_week}`;
    if (!acc[day]) acc[day] = [];
    acc[day].push(s);
    return acc;
  }, {});
  const sortedDays = Object.entries(grouped).sort((a, b) => {
    const order = Object.values(DAY_MAP);
    return order.indexOf(a[0]) - order.indexOf(b[0]);
  });

  const todayDow = new Date().getDay() === 0 ? 1 : new Date().getDay() + 1;
  const todayName = DAY_MAP[todayDow];

  if (loading) return <MainLayout title="Lịch dạy"><p className="text-center text-gray-400 py-20">Đang tải...</p></MainLayout>;

  return (
    <MainLayout title="Lịch dạy">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{schedules.length}</p>
          <p className="text-xs text-gray-500 mt-1">Buổi / tuần</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{schedules.filter(s => Number(s.day_of_week) === todayDow).length}</p>
          <p className="text-xs text-gray-500 mt-1">Buổi hôm nay</p>
        </div>
      </div>

      {/* Nút thêm */}
      <div className="flex justify-end mb-4">
        <Button icon="➕" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Đóng' : 'Thêm lịch dạy'}
        </Button>
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
                {DAY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Giờ bắt đầu *</label>
              <input type="time" value={form.time_start} onChange={e => {
                const start = e.target.value;
                const [h, m] = start.split(':').map(Number);
                const endH = String(Math.min(h + 1, 23)).padStart(2, '0');
                const endM = String(m).padStart(2, '0');
                setForm(p => ({ ...p, time_start: start, time_end: `${endH}:${endM}` }));
              }} className="input-field" />
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

      {/* Lịch tuần */}
      {schedules.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-gray-400">Chưa có lịch dạy</p>
          <p className="text-xs text-gray-400 mt-1">Bấm "Thêm lịch dạy" để bắt đầu</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedDays.map(([day, items]) => (
            <div key={day}>
              <div className="flex items-center gap-2 mb-2">
                <p className={`text-sm font-bold ${day === todayName ? 'text-primary-600' : 'text-gray-600'}`}>{day}</p>
                {day === todayName && <Badge label="Hôm nay" variant="green" />}
                <span className="text-xs text-gray-400">{items.length} buổi</span>
              </div>
              <div className="flex flex-col gap-2">
                {items.sort((a,b) => (a.time_start||'').localeCompare(b.time_start||'')).map((s, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-2xl border ${day === todayName ? 'bg-primary-50 border-primary-100' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold ${day === todayName ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                        <span>{String(s.time_start||'').slice(0,5)}</span>
                        <span className="text-gray-400 font-normal" style={{fontSize:9}}>{String(s.time_end||'').slice(0,5)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{s.class_name}</p>
                        <p className="text-xs text-gray-500">{s.room_name || 'Chưa xếp phòng'} · {s.instrument || ''}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(s.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors text-sm p-2" title="Xóa lịch">
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default MySchedule;