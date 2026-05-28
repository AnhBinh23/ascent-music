import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import SearchBar from '../../../components/shared/SearchBar';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const STATUS_VARIANT = {
  'Đã thanh toán':    'green',
  'Chưa thanh toán':  'red',
  'Thanh toán 1 phần':'orange',
};
const METHODS = ['Tiền mặt', 'Chuyển khoản', 'Ví điện tử'];
const MONTHS  = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(); d.setMonth(d.getMonth() - i);
  return d.toISOString().slice(0, 7);
});

// ── Modal tạo hóa đơn ──────────────────────────────────────────────────────────
const CreateModal = ({ onClose, onCreated }) => {
  const [students, setStudents] = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [form, setForm] = useState({
    student_id: '', class_id: '', amount: '', month: new Date().toISOString().slice(0,7),
    sessions: 0, note: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/students').then(d => setStudents(d.rows || [])).catch(() => {});
    api.get('/classes').then(d => setClasses(d.rows || [])).catch(() => {});
  }, []);

  // Tự điền học phí khi chọn lớp
  const handleClassChange = (e) => {
    const cls = classes.find(c => c.id === e.target.value);
    setForm(f => ({ ...f, class_id: e.target.value, amount: cls?.fee || f.amount }));
  };

  const handleSave = async () => {
    if (!form.student_id || !form.amount) { toast.error('Chọn học viên và nhập học phí!'); return; }
    setSaving(true);
    try {
      await api.post('/tuition', {
        student_id: form.student_id,
        class_id:   form.class_id || null,
        amount:     Number(form.amount),
        paid:       0,
        status:     'Chưa thanh toán',
        month:      form.month,
        sessions:   Number(form.sessions) || 0,
        note:       form.note,
      });
      toast.success('Đã tạo hóa đơn!');
      onCreated();
      onClose();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">📄 Tạo hóa đơn học phí</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs">✕</button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {/* Học viên */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Học viên <span className="text-red-500">*</span></label>
            <select value={form.student_id} onChange={e => setForm(f => ({...f, student_id: e.target.value}))} className="input-field">
              <option value="">-- Chọn học viên --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.phone}</option>)}
            </select>
          </div>
          {/* Lớp học */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Lớp học</label>
            <select value={form.class_id} onChange={handleClassChange} className="input-field">
              <option value="">-- Chọn lớp (tùy chọn) --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.instrument}</option>)}
            </select>
          </div>
          {/* Tháng */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tháng</label>
            <select value={form.month} onChange={e => setForm(f => ({...f, month: e.target.value}))} className="input-field">
              {MONTHS.map(m => <option key={m} value={m}>{new Date(m+'-01').toLocaleDateString('vi-VN',{month:'long',year:'numeric'})}</option>)}
            </select>
          </div>
          {/* Học phí */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Học phí (đ) <span className="text-red-500">*</span></label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))}
              placeholder="VD: 800000" className="input-field" />
          </div>
          {/* Số buổi */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Số buổi học</label>
            <input type="number" value={form.sessions} onChange={e => setForm(f => ({...f, sessions: e.target.value}))}
              placeholder="VD: 16" className="input-field" />
          </div>
          {/* Ghi chú */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea value={form.note} onChange={e => setForm(f => ({...f, note: e.target.value}))}
              rows={2} className="input-field resize-none" placeholder="Ghi chú thêm..." />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Hủy</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Đang lưu...' : '📄 Tạo hóa đơn'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Modal thu tiền ─────────────────────────────────────────────────────────────
const CollectModal = ({ item, onClose, onDone }) => {
  const remaining = Number(item?.amount || 0) - Number(item?.paid || 0);
  const [form, setForm] = useState({ amount: remaining, method: 'Tiền mặt', note: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.amount) { toast.error('Nhập số tiền thu!'); return; }
    setSaving(true);
    try {
      const newPaid   = Number(item.paid || 0) + Number(form.amount);
      const newStatus = newPaid >= Number(item.amount) ? 'Đã thanh toán' : 'Thanh toán 1 phần';
      await api.put(`/tuition/${item.id}`, { paid: newPaid, status: newStatus, method: form.method });
      toast.success('Thu học phí thành công! 🎉');
      onDone(); onClose();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">💰 Thu học phí</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs">✕</button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {/* Info */}
          <div className="p-4 bg-gray-50 rounded-2xl">
            <p className="font-semibold text-gray-800">{item.student_name}</p>
            <p className="text-sm text-gray-500">{item.instrument} · {item.month}</p>
            <div className="flex justify-between mt-2">
              <p className="text-sm text-gray-600">Học phí: <span className="font-medium">{Number(item.amount).toLocaleString('vi-VN')}đ</span></p>
              <p className="text-sm text-gray-600">Đã thu: <span className="font-medium text-green-600">{Number(item.paid||0).toLocaleString('vi-VN')}đ</span></p>
            </div>
            <div className="mt-2 p-2 bg-red-50 rounded-xl text-center">
              <p className="text-sm font-bold text-red-600">Còn lại: {remaining.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
          {/* Số tiền */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Số tiền thu <span className="text-red-500">*</span></label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))}
              className="input-field text-lg font-bold" />
          </div>
          {/* Phương thức */}
          <div className="flex gap-2">
            {METHODS.map(m => (
              <button key={m} onClick={() => setForm(f => ({...f, method: m}))}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${form.method===m?'bg-primary-600 text-white border-primary-600':'bg-white text-gray-600 border-gray-200'}`}>
                {m === 'Tiền mặt' ? '💵' : m === 'Chuyển khoản' ? '🏦' : '📱'} {m}
              </button>
            ))}
          </div>
          {/* Ghi chú */}
          <input value={form.note} onChange={e => setForm(f => ({...f, note: e.target.value}))}
            placeholder="Ghi chú..." className="input-field text-sm" />
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium">Hủy</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-2 flex-grow py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50">
            {saving ? '⏳...' : '✅ Xác nhận thu tiền'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────
const TuitionList = () => {
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [filterMonth, setFilterMonth]   = useState('Tất cả');
  const [showCreate, setShowCreate]     = useState(false);
  const [collectItem, setCollectItem]   = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/tuition');
      setData(res.rows || []);
    } catch { toast.error('Không tải được dữ liệu'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtered
  const filtered = data.filter(d => {
    const matchStatus = filterStatus === 'Tất cả' || d.status === filterStatus;
    const matchMonth  = filterMonth  === 'Tất cả' || d.month === filterMonth;
    const matchSearch = !search || d.student_name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchMonth && matchSearch;
  });

  // Stats
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonth    = data.filter(d => d.month === currentMonth);
  const totalRevenue = thisMonth.filter(d => d.status === 'Đã thanh toán').reduce((s,d) => s + Number(d.paid||0), 0);
  const totalUnpaid  = thisMonth.filter(d => d.status !== 'Đã thanh toán').length;
  const totalPartial = thisMonth.filter(d => d.status === 'Thanh toán 1 phần').length;

  // Available months
  const availableMonths = ['Tất cả', ...new Set(data.map(d => d.month).filter(Boolean))].sort((a,b) => {
    if (a === 'Tất cả') return -1; if (b === 'Tất cả') return 1; return b.localeCompare(a);
  });

  return (
    <MainLayout title="Quản lý học phí">
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={loadData} />}
      {collectItem && <CollectModal item={collectItem} onClose={() => setCollectItem(null)} onDone={loadData} />}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="card text-center">
          <p className="text-lg font-bold text-green-600">{totalRevenue.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-gray-500 mt-1">Đã thu tháng này</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-500">{totalUnpaid}</p>
          <p className="text-xs text-gray-500 mt-1">Chưa thanh toán</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">{data.length}</p>
          <p className="text-xs text-gray-500 mt-1">Tổng học viên</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-500">{totalPartial}</p>
          <p className="text-xs text-gray-500 mt-1">Thanh toán 1 phần</p>
        </div>
      </div>

      {/* Filters + Tạo hóa đơn */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên học viên..." />
        </div>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="input-field w-auto">
          {availableMonths.map(m => (
            <option key={m} value={m}>{m === 'Tất cả' ? 'Tất cả tháng' : new Date(m+'-01').toLocaleDateString('vi-VN',{month:'long',year:'numeric'})}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto">
          {['Tất cả','Đã thanh toán','Chưa thanh toán','Thanh toán 1 phần'].map(s => <option key={s}>{s}</option>)}
        </select>
        <Button icon="➕" onClick={() => setShowCreate(true)}>Tạo hóa đơn</Button>
      </div>

      {/* Danh sách */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500 font-medium">Chưa có dữ liệu</p>
          <p className="text-gray-400 text-sm mt-1">Thêm mới để bắt đầu</p>
          <button onClick={() => setShowCreate(true)}
            className="mt-4 px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
            ➕ Tạo hóa đơn đầu tiên
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((row, i) => {
            const remaining = Number(row.amount||0) - Number(row.paid||0);
            const pct = row.amount > 0 ? Math.round(Number(row.paid||0)/Number(row.amount)*100) : 0;
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
                      {row.student_name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{row.student_name}</p>
                      <p className="text-xs text-gray-500">{row.instrument} · {row.month}</p>
                    </div>
                  </div>
                  {/* Status */}
                  <Badge label={row.status} variant={STATUS_VARIANT[row.status]||'gray'} dot />
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Học phí: <span className="font-medium text-gray-700">{Number(row.amount).toLocaleString('vi-VN')}đ</span></span>
                    <span className="text-gray-500">Đã thu: <span className="font-medium text-green-600">{Number(row.paid||0).toLocaleString('vi-VN')}đ</span></span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#16a34a' : pct > 0 ? '#ea580c' : '#e5e7eb' }} />
                  </div>
                  {row.method && <p className="text-xs text-gray-400 mt-1">💳 {row.method}</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  {row.status !== 'Đã thanh toán' && (
                    <button onClick={() => setCollectItem(row)}
                      className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors">
                      💰 Thu {remaining.toLocaleString('vi-VN')}đ
                    </button>
                  )}
                  {row.status === 'Đã thanh toán' && (
                    <div className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-600 text-sm font-medium text-center">
                      ✅ Đã thanh toán đủ
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
};

export default TuitionList;

;