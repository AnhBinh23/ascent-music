import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const fmt = n => Number(n || 0).toLocaleString('vi-VN') + 'đ';

const PendingSalary = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/group-salary/pending?status=${filter}`);
      setItems(res.rows || []);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleConfirm = async (id) => {
    setProcessing(p => ({ ...p, [id]: 'confirm' }));
    try {
      await api.put(`/group-salary/pending/${id}/confirm`);
      toast.success('Đã xác nhận và tính vào lương!');
      await loadData();
    } catch (err) { toast.error(err.message); }
    finally { setProcessing(p => ({ ...p, [id]: null })); }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Từ chối lương buổi này?')) return;
    setProcessing(p => ({ ...p, [id]: 'reject' }));
    try {
      await api.put(`/group-salary/pending/${id}/reject`);
      toast.success('Đã từ chối!');
      await loadData();
    } catch (err) { toast.error(err.message); }
    finally { setProcessing(p => ({ ...p, [id]: null })); }
  };

  const pendingCount = items.filter(i => i.status === 'pending').length;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-gray-700">
          📋 Lương nhóm chờ xác nhận
          {pendingCount > 0 && <span className="text-orange-500 ml-1">({pendingCount})</span>}
        </p>
        <div className="flex gap-1 bg-gray-100 p-0.5 rounded-xl">
          {[
            { key: 'pending', label: 'Chờ duyệt' },
            { key: 'confirmed', label: 'Đã duyệt' },
            { key: 'rejected', label: 'Từ chối' },
          ].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${filter === t.key ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-6 text-sm">Đang tải...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-2xl">
          <p className="text-gray-400 text-sm">
            {filter === 'pending' ? 'Không có lương nhóm nào chờ duyệt' : `Không có mục nào`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(item => {
            const statusCfg = {
              pending: { bg: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', label: 'Chờ duyệt' },
              confirmed: { bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', label: 'Đã duyệt' },
              rejected: { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', label: 'Từ chối' },
            }[item.status] || { bg: 'bg-gray-50 border-gray-200', badge: '', label: '' };

            return (
              <div key={item.id} className={`p-4 rounded-2xl border ${statusCfg.bg}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{item.teacher_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.badge}`}>{statusCfg.label}</span>
                    </div>
                    <p className="text-xs text-gray-600">{item.class_name}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-gray-500">
                        📅 {new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        👥 {item.present_count}/{item.total_count} HV có mặt
                      </span>
                      <span className="text-sm font-bold text-orange-600">
                        {item.amount > 0 ? fmt(item.amount) : 'Chưa thiết lập'}
                      </span>
                    </div>
                    {item.note && <p className="text-xs text-gray-500 mt-1 italic">{item.note}</p>}
                    {item.confirmed_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        {item.status === 'confirmed' ? '✅' : '❌'} {new Date(item.confirmed_at).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                  {item.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleReject(item.id)} disabled={!!processing[item.id]}
                        className="px-3 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-semibold hover:bg-red-100 disabled:opacity-50">
                        {processing[item.id] === 'reject' ? '...' : '❌'}
                      </button>
                      <button onClick={() => handleConfirm(item.id)} disabled={!!processing[item.id]}
                        className="px-3 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold hover:bg-green-600 disabled:opacity-50">
                        {processing[item.id] === 'confirm' ? '...' : '✅ Xác nhận'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingSalary;