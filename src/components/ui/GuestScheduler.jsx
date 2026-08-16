import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const GuestScheduler = ({ studentId, studentName }) => {
  const [assignments, setAssignments] = useState([]);
  const [groupClasses, setGroupClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ class_id: '', date: '', note: '' });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [aRes, cRes] = await Promise.all([
        api.get(`/guest-assignments?student_id=${studentId}`),
        api.get('/classes'),
      ]);
      setAssignments(aRes.rows || []);
      setGroupClasses((cRes.rows || []).filter(c => c.type === 'group' && c.status === 'Đang học'));
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  }, [studentId]);

  useEffect(() => { if (studentId) loadData(); }, [studentId, loadData]);

  const handleAdd = async () => {
    if (!form.class_id || !form.date) { toast.error('Chọn lớp và ngày!'); return; }
    setSaving(true);
    try {
      await api.post('/guest-assignments', { student_id: studentId, ...form });
      toast.success('Đã xếp lịch vãng lai!');
      setForm({ class_id: '', date: '', note: '' });
      setShowForm(false);
      await loadData();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa lịch này?')) return;
    try {
      await api.delete(`/guest-assignments/${id}`);
      toast.success('Đã xóa!');
      await loadData();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return null;

  const upcoming = assignments.filter(a => a.date >= new Date().toISOString().split('T')[0]);
  const past = assignments.filter(a => a.date < new Date().toISOString().split('T')[0]);

  return (
    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-orange-700">👥 Lịch học vãng lai</p>
          <p className="text-xs text-gray-500">Xếp {studentName} vào lớp nhóm theo ngày</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600">
          {showForm ? 'Đóng' : '+ Xếp lịch'}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-white rounded-xl border border-orange-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Lớp nhóm *</label>
              <select value={form.class_id} onChange={e => setForm(p => ({ ...p, class_id: e.target.value }))}
                className="input-field text-sm">
                <option value="">Chọn lớp...</option>
                {groupClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.teacher_name})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Ngày học *</label>
              <input type="date" value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Ghi chú</label>
              <input type="text" value={form.note} placeholder="VD: Bù buổi 5..."
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                className="input-field text-sm" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium">Hủy</button>
            <button onClick={handleAdd} disabled={saving}
              className="px-4 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-semibold hover:bg-orange-600 disabled:opacity-50">
              {saving ? '⏳...' : '💾 Lưu'}
            </button>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-orange-600 mb-2">📅 Sắp tới</p>
          <div className="flex flex-col gap-1.5">
            {upcoming.map(a => (
              <div key={a.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-orange-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(a.date).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                    {' · '}{a.class_name}
                  </p>
                  <p className="text-xs text-gray-500">{a.teacher_name}{a.note ? ` · ${a.note}` : ''}</p>
                </div>
                <button onClick={() => handleDelete(a.id)}
                  className="text-red-400 hover:text-red-600 text-sm p-1">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">📋 Đã qua ({past.length})</p>
          <div className="flex flex-col gap-1">
            {past.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">
                  {new Date(a.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                  {' · '}{a.class_name}
                  {a.note ? ` · ${a.note}` : ''}
                </p>
              </div>
            ))}
            {past.length > 5 && <p className="text-xs text-gray-400 text-center mt-1">+{past.length - 5} lịch cũ hơn</p>}
          </div>
        </div>
      )}

      {assignments.length === 0 && !showForm && (
        <p className="text-center text-gray-400 text-xs py-4">Chưa có lịch vãng lai nào</p>
      )}
    </div>
  );
};

export default GuestScheduler;