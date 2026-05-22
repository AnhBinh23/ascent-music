import React, { useEffect, useState } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const STATUS_VARIANT = { pending: 'orange', contacted: 'blue', enrolled: 'green', cancelled: 'gray' };
const STATUS_LABEL   = { pending: '⏳ Chờ xử lý', contacted: '📞 Đã liên hệ', enrolled: '✅ Đã nhập học', cancelled: '❌ Không tiếp tục' };

const TrialManage = () => {
  const [trials, setTrials]   = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTrials = async () => {
    try {
      const data = await api.get('/trials');
      setTrials(data.rows || []);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTrials(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/trials/${id}`, { status });
      setTrials(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      toast.success('Cập nhật trạng thái!');
    } catch (err) { toast.error(err.message); }
  };

  const pending   = trials.filter(t => t.status === 'pending').length;
  const contacted = trials.filter(t => t.status === 'contacted').length;
  const enrolled  = trials.filter(t => t.status === 'enrolled').length;

  return (
    <MainLayout title="Quản lý đăng ký học thử">
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-500">{pending}</p>
          <p className="text-xs text-gray-500 mt-1">Chờ xử lý</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-500">{contacted}</p>
          <p className="text-xs text-gray-500 mt-1">Đã liên hệ</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-500">{enrolled}</p>
          <p className="text-xs text-gray-500 mt-1">Đã nhập học</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-10">Đang tải...</p>
      ) : trials.length === 0 ? (
        <Card>
          <p className="text-center text-gray-400 py-10">Chưa có đăng ký học thử nào</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {trials.map(t => (
            <Card key={t.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                    {t.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-gray-800">{t.name}</p>
                      <Badge label={STATUS_LABEL[t.status]} variant={STATUS_VARIANT[t.status]} />
                    </div>
                    <p className="text-sm text-gray-500">📱 {t.phone} · 🎵 {t.instrument}</p>
                    <p className="text-xs text-gray-400">🕐 {t.time} · 👤 {t.age}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Đăng ký: {new Date(t.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {t.status === 'pending' && (
                    <Button size="sm" onClick={() => updateStatus(t.id, 'contacted')}>📞 Đã liên hệ</Button>
                  )}
                  {t.status === 'contacted' && (
                    <Button size="sm" variant="secondary" onClick={() => updateStatus(t.id, 'enrolled')}>✅ Nhập học</Button>
                  )}
                  {t.status !== 'cancelled' && t.status !== 'enrolled' && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(t.id, 'cancelled')}>❌ Từ chối</Button>
                  )}
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