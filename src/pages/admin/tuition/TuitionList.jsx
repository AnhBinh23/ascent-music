import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../../../components/layout/MainLayout';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import api from '../../../services/api';

const fmt = (n) => n != null ? Number(n).toLocaleString('vi-VN') + 'đ' : '0đ';

const STATUS_CONFIG = {
  'Đã thanh toán':      { variant: 'green',  label: 'Đã thanh toán' },
  'Thanh toán 1 phần':  { variant: 'yellow', label: 'Thanh toán 1 phần' },
  'Chưa thanh toán':    { variant: 'red',    label: 'Chưa thanh toán' },
};
const INSTRUMENT_ICON = { 'Piano':'🎹','Guitar':'🎸','Violin':'🎻','Thanh nhạc':'🎤' };
const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'Chưa thanh toán', label: 'Chưa thu' },
  { key: 'Thanh toán 1 phần', label: 'Một phần' },
  { key: 'Đã thanh toán', label: 'Đã thu' },
];

const TuitionList = () => {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState('tuition'); // tuition | renewal

  // ── Học phí state ──
  const [tuitions, setTuitions]       = useState([]);
  const [stats, setStats]             = useState({ total:0, collected:0, remaining:0 });
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [payModal, setPayModal]       = useState(null);
  const [payAmount, setPayAmount]     = useState('');
  const [payMethod, setPayMethod]     = useState('Tiền mặt');
  const [paying, setPaying]           = useState(false);

  // ── Tái khóa state ──
  const [predictions, setPredictions] = useState([]);
  const [summary, setSummary]         = useState({});
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewFilter, setRenewFilter]   = useState('all'); // all|high|medium|low|near_end|confirmed
  const [renewNotes, setRenewNotes]     = useState({});
  const [savingNote, setSavingNote]     = useState({});
  const [selectedStudents, setSelectedStudents] = useState(new Set());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        api.get('/tuition'), api.get('/tuition/stats'),
      ]);
      setTuitions(listRes.rows || []);
      setStats({ total: statsRes.total||0, collected: statsRes.collected||0, remaining: statsRes.remaining||0 });
    } catch { toast.error('Không tải được dữ liệu học phí!'); }
    finally { setLoading(false); }
  }, []);

  const loadRenewal = useCallback(async () => {
    try {
      setRenewLoading(true);
      const res = await api.get('/tuition/renewal-prediction');
      setPredictions(res.predictions || []);
      setSummary(res.summary || {});
      const notesInit = {};
      (res.predictions||[]).forEach(p => { notesInit[p.id] = { confirmed: p.confirmed, note: p.note }; });
      setRenewNotes(notesInit);
      // Mặc định chọn các HV đã confirmed
      const sel = new Set();
      (res.predictions||[]).filter(p => p.confirmed).forEach(p => sel.add(p.id));
      setSelectedStudents(sel);
    } catch { toast.error('Không tải được dự đoán!'); }
    finally { setRenewLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (mainTab === 'renewal') loadRenewal(); }, [mainTab, loadRenewal]);

  // ── Học phí handlers ──
  const filtered = tuitions.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !search || t.student_name?.toLowerCase().includes(q) || t.class_name?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });
  const countByStatus = (status) => tuitions.filter(t => t.status === status).length;
  const openPay = (t) => { setPayModal(t); setPayAmount(String(Number(t.amount||0)-Number(t.paid||0))); setPayMethod('Tiền mặt'); };
  const handlePay = async () => {
    const num = Number(payAmount);
    if (!num || num <= 0) { toast.error('Nhập số tiền hợp lệ!'); return; }
    const maxR = Number(payModal.amount||0) - Number(payModal.paid||0);
    if (num > maxR) { toast.error(`Vượt quá còn lại (${fmt(maxR)})!`); return; }
    setPaying(true);
    try {
      const newPaid = Number(payModal.paid||0) + num;
      const newStatus = newPaid >= Number(payModal.amount) ? 'Đã thanh toán' : 'Thanh toán 1 phần';
      await api.put(`/tuition/${payModal.id}`, { paid: newPaid, status: newStatus, method: payMethod });
      toast.success('✅ Thu tiền thành công!');
      setPayModal(null); load();
    } catch (e) { toast.error(e.message); }
    finally { setPaying(false); }
  };

  // ── Tái khóa handlers ──
  const handleSaveNote = async (studentId) => {
    setSavingNote(prev => ({ ...prev, [studentId]: true }));
    try {
      const n = renewNotes[studentId] || {};
      await api.post('/tuition/renewal-note', { student_id: studentId, confirmed: n.confirmed || false, note: n.note || '' });
      toast.success('✅ Đã lưu!');
      await loadRenewal();
    } catch (e) { toast.error(e.message); }
    finally { setSavingNote(prev => ({ ...prev, [studentId]: false })); }
  };

  const toggleConfirm = (id) => {
    setRenewNotes(prev => ({ ...prev, [id]: { ...prev[id], confirmed: !prev[id]?.confirmed } }));
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredPredictions = predictions.filter(p => {
    if (renewFilter === 'all') return true;
    if (renewFilter === 'near_end') return p.remaining <= 5;
    if (renewFilter === 'confirmed') return renewNotes[p.id]?.confirmed;
    return p.level === renewFilter;
  });

  // Tổng doanh thu theo selection
  const customRevenue = predictions.filter(p => selectedStudents.has(p.id)).reduce((s,p) => s + p.tuition_fee, 0);

  const getLevelInfo = (level) => {
    if (level === 'high')   return { icon: '🟢', label: 'Cao',        color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
    if (level === 'medium') return { icon: '🟡', label: 'Trung bình', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };
    return                         { icon: '🔴', label: 'Thấp',       color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
  };

  return (
    <MainLayout title="Quản lý học phí">
      {/* Main tabs */}
      <div className="flex gap-1.5 mb-5 bg-gray-100 p-1 rounded-2xl">
        <button onClick={() => setMainTab('tuition')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab==='tuition'?'bg-white shadow text-primary-600':'text-gray-500'}`}>
          💰 Học phí
        </button>
        <button onClick={() => setMainTab('renewal')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab==='renewal'?'bg-white shadow text-primary-600':'text-gray-500'}`}>
          📊 Dự đoán tái khóa
        </button>
      </div>

      {/* ═══ TAB HỌC PHÍ ═══ */}
      {mainTab === 'tuition' && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3"><span className="text-2xl">📋</span><div><p className="text-xs text-blue-500">Tổng hóa đơn</p><p className="text-xl font-bold text-blue-700">{stats.total}</p></div></div>
            <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3"><span className="text-2xl">✅</span><div><p className="text-xs text-green-500">Đã thu</p><p className="text-lg font-bold text-green-700">{fmt(stats.collected)}</p></div></div>
            <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3"><span className="text-2xl">⏳</span><div><p className="text-xs text-red-400">Còn lại</p><p className="text-lg font-bold text-red-600">{fmt(stats.remaining)}</p></div></div>
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            <input type="text" placeholder="🔍 Tìm học viên, lớp học..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[180px] border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary-400" />
            <div className="flex gap-1.5 flex-wrap">
              {FILTER_TABS.map(f => {
                const cnt = f.key === 'all' ? tuitions.length : countByStatus(f.key);
                return (
                  <button key={f.key} onClick={() => setFilterStatus(f.key)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${filterStatus===f.key?'bg-primary-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {f.label}<span className={`text-xs px-1.5 py-0.5 rounded-full ${filterStatus===f.key?'bg-white/20':'bg-gray-100 text-gray-500'}`}>{cnt}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {loading ? <div className="text-center py-20 text-gray-400">⏳ Đang tải...</div>
          : filtered.length === 0 ? <div className="text-center py-20 text-gray-400"><p className="text-4xl mb-2">💰</p><p className="text-sm">Không có dữ liệu</p></div>
          : (
            <div className="flex flex-col gap-3">
              {filtered.map(t => {
                const remaining = Number(t.amount||0) - Number(t.paid||0);
                const pct = t.amount > 0 ? Math.min(100, Math.round((Number(t.paid||0)/Number(t.amount))*100)) : 0;
                const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG['Chưa thanh toán'];
                const icon = INSTRUMENT_ICON[t.instrument] || '🎵';
                return (
                  <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-800 truncate">{t.student_name||'—'}</p>
                          <button onClick={() => navigate(`/admin/classes/${t.class_id}`)} className="text-xs text-primary-600 hover:underline truncate">📚 {t.class_name||t.class_id}</button>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-gray-500">
                          <span>Tổng: <strong className="text-gray-700">{fmt(t.amount)}</strong></span>
                          <span className="text-green-600">Đã thu: <strong>{fmt(t.paid)}</strong></span>
                          {remaining > 0 && <span className="text-red-500">Còn: <strong>{fmt(remaining)}</strong></span>}
                          {t.sessions > 0 && <span>🗓 {t.sessions} buổi</span>}
                        </div>
                        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct===100?'bg-green-400':pct>0?'bg-yellow-400':'bg-red-300'}`} style={{width:`${pct}%`}} />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
                        <Badge label={statusCfg.label} variant={statusCfg.variant} dot />
                        {t.status !== 'Đã thanh toán' && (
                          <button onClick={() => openPay(t)} className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium">💵 Thu tiền</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══ TAB DỰ ĐOÁN TÁI KHÓA ═══ */}
      {mainTab === 'renewal' && (
        <>
          {renewLoading ? <div className="text-center py-20 text-gray-400">⏳ Đang phân tích...</div> : (
            <>
              {/* Tổng quan */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <div className="card text-center">
                  <p className="text-2xl font-bold text-blue-600">{summary.total||0}</p>
                  <p className="text-xs text-gray-500 mt-1">Tổng HV</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-bold text-red-500">{summary.near_end||0}</p>
                  <p className="text-xs text-gray-500 mt-1">Sắp hết khóa (≤5 buổi)</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-bold text-green-600">{summary.confirmed||0}</p>
                  <p className="text-xs text-gray-500 mt-1">✅ Đã xác nhận tái</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-bold text-orange-600">{fmt(customRevenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">💰 Doanh thu dự kiến</p>
                </div>
              </div>

              {/* Doanh thu dự kiến chi tiết */}
              <div className="card mb-5">
                <p className="text-sm font-bold text-gray-700 mb-3">💰 Doanh thu dự kiến nếu tái khóa</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                    <p className="text-xs text-green-600">🟢 Khả năng cao ({summary.high||0} HV)</p>
                    <p className="text-lg font-bold text-green-700">{fmt(summary.revenue_high)}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
                    <p className="text-xs text-yellow-600">🟡 Trung bình ({summary.medium||0} HV)</p>
                    <p className="text-lg font-bold text-yellow-700">{fmt(summary.revenue_medium)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                    <p className="text-xs text-blue-600">📌 100% tái ({summary.total||0} HV)</p>
                    <p className="text-lg font-bold text-blue-700">{fmt(summary.revenue_all)}</p>
                  </div>
                </div>
                <div className="mt-3 bg-primary-50 rounded-xl p-3 text-center border border-primary-100">
                  <p className="text-xs text-primary-600">✅ Đã xác nhận tái ({summary.confirmed||0} HV) — tick bên dưới để điều chỉnh</p>
                  <p className="text-xl font-bold text-primary-700">{fmt(customRevenue)}</p>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1.5 flex-wrap mb-4">
                {[
                  { key:'all', label:'Tất cả', cnt: predictions.length },
                  { key:'near_end', label:'⏰ Sắp hết', cnt: predictions.filter(p=>p.remaining<=5).length },
                  { key:'high', label:'🟢 Cao', cnt: predictions.filter(p=>p.level==='high').length },
                  { key:'medium', label:'🟡 TB', cnt: predictions.filter(p=>p.level==='medium').length },
                  { key:'low', label:'🔴 Thấp', cnt: predictions.filter(p=>p.level==='low').length },
                  { key:'confirmed', label:'✅ Đã xác nhận', cnt: Object.values(renewNotes).filter(n=>n.confirmed).length },
                ].map(f => (
                  <button key={f.key} onClick={() => setRenewFilter(f.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${renewFilter===f.key?'bg-primary-600 text-white border-primary-600':'bg-white text-gray-600 border-gray-200'}`}>
                    {f.label}<span className={`text-xs px-1 py-0.5 rounded-full ${renewFilter===f.key?'bg-white/20':'bg-gray-100'}`}>{f.cnt}</span>
                  </button>
                ))}
              </div>

              {/* Danh sách */}
              <div className="flex flex-col gap-3">
                {filteredPredictions.map(p => {
                  const li = getLevelInfo(p.level);
                  const n  = renewNotes[p.id] || {};
                  return (
                    <div key={p.id} className={`rounded-2xl border p-4 ${n.confirmed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className="flex-shrink-0 pt-1">
                          <button onClick={() => toggleConfirm(p.id)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${n.confirmed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-primary-400'}`}>
                            {n.confirmed && '✓'}
                          </button>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                            {p.nickname && <span className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full">{p.nickname}</span>}
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${li.bg} ${li.color}`}>{li.icon} {li.label}</span>
                            {p.remaining <= 5 && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">⏰ Còn {p.remaining} buổi</span>}
                          </div>
                          <p className="text-xs text-gray-500">
                            {p.class_name} · {p.teacher_name} · Khóa {p.current_course}
                            {p.has_renewed && <span className="text-green-600 ml-1">🔄 Đã từng tái khóa</span>}
                          </p>

                          {/* Tỉ lệ */}
                          <div className="flex gap-3 mt-2 flex-wrap text-xs">
                            <span className="bg-gray-50 px-2 py-1 rounded-lg">
                              📊 Tổng: <strong className={p.all_rate >= 80 ? 'text-green-600' : p.all_rate >= 60 ? 'text-yellow-600' : 'text-red-600'}>{p.all_rate}%</strong>
                            </span>
                            <span className="bg-gray-50 px-2 py-1 rounded-lg">
                              📈 Khóa hiện tại: <strong>{p.cur_rate}%</strong>
                            </span>
                            {p.prev_rate > 0 && (
                              <span className="bg-gray-50 px-2 py-1 rounded-lg">
                                📉 Khóa trước: <strong>{p.prev_rate}%</strong>
                                {p.trend !== 0 && <span className={p.trend > 0 ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>{p.trend > 0 ? '↑' : '↓'}{Math.abs(p.trend)}%</span>}
                              </span>
                            )}
                          </div>

                          {/* Ghi chú */}
                          <div className="flex gap-2 mt-2 items-center">
                            <input type="text" value={n.note || ''} placeholder="Ghi chú (đã gọi PH, sẽ tái tháng sau...)"
                              onChange={e => setRenewNotes(prev => ({ ...prev, [p.id]: { ...prev[p.id], note: e.target.value } }))}
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary-400" />
                            <button onClick={() => handleSaveNote(p.id)} disabled={savingNote[p.id]}
                              className="px-2 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:opacity-50 flex-shrink-0">
                              {savingNote[p.id] ? '...' : '💾'}
                            </button>
                          </div>
                        </div>

                        {/* Học phí nếu tái */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-400">Nếu tái khóa</p>
                          <p className="text-lg font-bold text-primary-600">{fmt(p.tuition_fee)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Còn {p.remaining}/{p.total_sessions} buổi</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Modal thu tiền ── */}
      {payModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-gray-800 mb-0.5">💵 Thu học phí</h3>
            <p className="text-sm text-gray-500 mb-4">{payModal.student_name} · {payModal.class_name}</p>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm flex flex-col gap-1.5">
              {[['Tổng học phí',fmt(payModal.amount),'text-gray-700'],['Đã thu',fmt(payModal.paid),'text-green-600'],['Còn lại',fmt(Number(payModal.amount)-Number(payModal.paid||0)),'text-red-500 font-bold']].map(([l,v,c])=>(
                <div key={l} className="flex justify-between"><span className="text-gray-500">{l}:</span><span className={c}>{v}</span></div>
              ))}
            </div>
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Số tiền thu</label>
              <input type="number" value={payAmount} onChange={e=>setPayAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400" />
            </div>
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Phương thức</label>
              <div className="flex gap-2">
                {['Tiền mặt','Chuyển khoản'].map(m=>(
                  <button key={m} onClick={()=>setPayMethod(m)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${payMethod===m?'bg-primary-600 text-white':'bg-gray-100 text-gray-600'}`}>
                    {m==='Tiền mặt'?'💵 Tiền mặt':'🏦 Chuyển khoản'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={()=>setPayModal(null)}>Hủy</Button>
              <Button variant="primary" className="flex-1" onClick={handlePay} disabled={paying}>{paying?'⏳...':'✅ Xác nhận'}</Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default TuitionList;