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

const INSTRUMENT_ICON = {
  'Piano': '🎹', 'Guitar': '🎸', 'Violin': '🎻', 'Thanh nhạc': '🎤',
};

const FILTER_TABS = [
  { key: 'all',                 label: 'Tất cả' },
  { key: 'Chưa thanh toán',     label: 'Chưa thu' },
  { key: 'Thanh toán 1 phần',   label: 'Một phần' },
  { key: 'Đã thanh toán',       label: 'Đã thu' },
];

const TuitionList = () => {
  const navigate = useNavigate();

  const [tuitions, setTuitions]       = useState([]);
  const [stats, setStats]             = useState({ total: 0, collected: 0, remaining: 0 });
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal thu tiền
  const [payModal, setPayModal]   = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Tiền mặt');
  const [paying, setPaying]       = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        api.get('/tuition'),
        api.get('/tuition/stats'),
      ]);
      setTuitions(listRes.rows || []);
      setStats({
        total:     statsRes.total     || 0,
        collected: statsRes.collected || 0,
        remaining: statsRes.remaining || 0,
      });
    } catch {
      toast.error('Không tải được dữ liệu học phí!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Lọc danh sách
  const filtered = tuitions.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || t.student_name?.toLowerCase().includes(q)
      || t.class_name?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Đếm theo status
  const countByStatus = (status) =>
    tuitions.filter(t => t.status === status).length;

  // Mở modal thu tiền
  const openPay = (t) => {
    setPayModal(t);
    setPayAmount(String(Number(t.amount || 0) - Number(t.paid || 0)));
    setPayMethod('Tiền mặt');
  };

  // Xác nhận thu tiền
  const handlePay = async () => {
    const num = Number(payAmount);
    if (!num || num <= 0) { toast.error('Nhập số tiền hợp lệ!'); return; }
    const maxRemaining = Number(payModal.amount || 0) - Number(payModal.paid || 0);
    if (num > maxRemaining) { toast.error(`Số tiền vượt quá còn lại (${fmt(maxRemaining)})!`); return; }

    setPaying(true);
    try {
      const newPaid = Number(payModal.paid || 0) + num;
      const newStatus = newPaid >= Number(payModal.amount)
        ? 'Đã thanh toán'
        : 'Thanh toán 1 phần';

      await api.put(`/tuition/${payModal.id}`, {
        paid: newPaid, status: newStatus, method: payMethod,
      });
      toast.success('✅ Thu tiền thành công!');
      setPayModal(null);
      setPayAmount('');
      load();
    } catch (e) {
      toast.error(e.message || 'Có lỗi xảy ra!');
    } finally {
      setPaying(false);
    }
  };

  return (
    <MainLayout title="Quản lý học phí">

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <p className="text-xs text-blue-500">Tổng hóa đơn</p>
            <p className="text-xl font-bold text-blue-700">{stats.total}</p>
          </div>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-xs text-green-500">Đã thu</p>
            <p className="text-lg font-bold text-green-700">{fmt(stats.collected)}</p>
          </div>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="text-xs text-red-400">Còn lại</p>
            <p className="text-lg font-bold text-red-600">{fmt(stats.remaining)}</p>
          </div>
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="🔍 Tìm học viên, lớp học..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary-400"
        />
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map(f => {
            const cnt = f.key === 'all' ? tuitions.length : countByStatus(f.key);
            return (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  filterStatus === f.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filterStatus === f.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                }`}>{cnt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Danh sách ── */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">⏳ Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-2">💰</p>
          <p className="text-sm">Không có dữ liệu học phí</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(t => {
            const remaining = Number(t.amount || 0) - Number(t.paid || 0);
            const pct = t.amount > 0
              ? Math.min(100, Math.round((Number(t.paid || 0) / Number(t.amount)) * 100))
              : 0;
            const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG['Chưa thanh toán'];
            const icon = INSTRUMENT_ICON[t.instrument] || '🎵';

            return (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  {/* Icon môn học */}
                  <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {t.student_name || '—'}
                      </p>
                      <button
                        onClick={() => navigate(`/admin/classes/${t.class_id}`)}
                        className="text-xs text-primary-600 hover:underline truncate"
                      >
                        📚 {t.class_name || t.class_id}
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-gray-500">
                      <span>Tổng: <strong className="text-gray-700">{fmt(t.amount)}</strong></span>
                      <span className="text-green-600">Đã thu: <strong>{fmt(t.paid)}</strong></span>
                      {remaining > 0 && (
                        <span className="text-red-500">Còn: <strong>{fmt(remaining)}</strong></span>
                      )}
                      {t.month && <span>📅 {t.month}</span>}
                      {t.sessions > 0 && <span>🗓 {t.sessions} buổi</span>}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct === 100 ? 'bg-green-400' : pct > 0 ? 'bg-yellow-400' : 'bg-red-300'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Status + Action */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
                    <Badge label={statusCfg.label} variant={statusCfg.variant} dot />
                    {t.status !== 'Đã thanh toán' && (
                      <button
                        onClick={() => openPay(t)}
                        className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium transition-colors"
                      >
                        💵 Thu tiền
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal thu tiền ── */}
      {payModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-gray-800 mb-0.5">💵 Thu học phí</h3>
            <p className="text-sm text-gray-500 mb-4">
              {payModal.student_name} · {payModal.class_name}
            </p>

            {/* Tóm tắt số tiền */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm flex flex-col gap-1.5">
              {[
                ['Tổng học phí', fmt(payModal.amount), 'text-gray-700'],
                ['Đã thu', fmt(payModal.paid), 'text-green-600'],
                ['Còn lại', fmt(Number(payModal.amount) - Number(payModal.paid || 0)), 'text-red-500 font-bold'],
              ].map(([label, value, cls]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}:</span>
                  <span className={cls}>{value}</span>
                </div>
              ))}
            </div>

            {/* Số tiền thu */}
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Số tiền thu lần này</label>
              <input
                type="number"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400"
                placeholder="Nhập số tiền..."
              />
            </div>

            {/* Phương thức */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Phương thức</label>
              <div className="flex gap-2">
                {['Tiền mặt', 'Chuyển khoản'].map(m => (
                  <button
                    key={m}
                    onClick={() => setPayMethod(m)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                      payMethod === m
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {m === 'Tiền mặt' ? '💵 Tiền mặt' : '🏦 Chuyển khoản'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setPayModal(null)}>
                Hủy
              </Button>
              <Button variant="primary" className="flex-1" onClick={handlePay} disabled={paying}>
                {paying ? '⏳ Đang lưu...' : '✅ Xác nhận'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default TuitionList;