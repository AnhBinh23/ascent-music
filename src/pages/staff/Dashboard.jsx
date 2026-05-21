import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const shortcuts = [
    { icon: '🎓', label: 'Thêm học viên',  path: '/staff/students', color: 'bg-blue-50 text-blue-700' },
    { icon: '📅', label: 'Xếp lịch học',   path: '/staff/schedule', color: 'bg-purple-50 text-purple-700' },
    { icon: '💰', label: 'Thu học phí',     path: '/staff/tuition',  color: 'bg-green-50 text-green-700' },
  ];

  return (
    <MainLayout title="Tổng quan">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Xin chào, {user?.name}! 👋</h2>
        <p className="text-sm text-gray-500 mt-1">Hôm nay bạn có gì cần làm?</p>
      </div>

      <Card title="Truy cập nhanh" className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          {shortcuts.map((s) => (
            <button
              key={s.path}
              onClick={() => navigate(s.path)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl ${s.color} transition-all hover:opacity-80`}
            >
              <span className="text-3xl">{s.icon}</span>
              <span className="text-xs font-medium text-center">{s.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </MainLayout>
  );
};

export default StaffDashboard;