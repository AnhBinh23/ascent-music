import React, { useEffect, useState } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { toast } from 'react-toastify';

const ROLE_LABEL = { student: 'Học viên', teacher: 'Giáo viên' };

const PendingApprovals = () => {
  const [pending, setPending] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('ascent_pending') || '[]');
    setPending(data.filter(p => p.status === 'pending'));
  }, []);

  const handleApprove = (id) => {
    const all = JSON.parse(localStorage.getItem('ascent_pending') || '[]');
    const updated = all.map(p => p.id === id ? { ...p, status: 'approved' } : p);
    localStorage.setItem('ascent_pending', JSON.stringify(updated));
    setPending(prev => prev.filter(p => p.id !== id));
    toast.success('✅ Đã duyệt tài khoản!');
  };

  const handleReject = (id) => {
    const all = JSON.parse(localStorage.getItem('ascent_pending') || '[]');
    const updated = all.map(p => p.id === id ? { ...p, status: 'rejected' } : p);
    localStorage.setItem('ascent_pending', JSON.stringify(updated));
    setPending(prev => prev.filter(p => p.id !== id));
    toast.error('❌ Đã từ chối tài khoản!');
  };

  return (
    <MainLayout title="Duyệt tài khoản">
      {pending.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <p className="text-4xl mb-4">✅</p>
            <p className="font-semibold text-gray-700">Không có tài khoản nào chờ duyệt</p>
            <p className="text-sm text-gray-400 mt-1">Tất cả đã được xử lý</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">{pending.length} tài khoản chờ duyệt</p>
          {pending.map(item => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 text-xl font-bold">
                    {item.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <Badge label={ROLE_LABEL[item.role]} variant={item.role === 'teacher' ? 'blue' : 'green'} />
                    </div>
                    <p className="text-sm text-gray-500">📧 {item.email}</p>
                    <p className="text-sm text-gray-500">📱 {item.phone}</p>
                    <p className="text-sm text-gray-500">🎵 {item.instrument}</p>
                    {item.note && <p className="text-sm text-gray-400 italic mt-1">"{item.note}"</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      Đăng ký: {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[100px]">
                  <Button size="sm" variant="success" onClick={() => handleApprove(item.id)}>
                    ✅ Duyệt
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleReject(item.id)}>
                    ❌ Từ chối
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default PendingApprovals;