import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menus = {
  admin: [
    { path: '/admin',          icon: '🏠', label: 'Tổng quan' },
    { path: '/admin/students', icon: '🎓', label: 'Học viên' },
    { path: '/admin/schedule', icon: '📅', label: 'Lịch học' },
    { path: '/admin/tuition',  icon: '💰', label: 'Học phí' },
    { path: '/admin/reports',  icon: '📊', label: 'Báo cáo' },
    { path: '/admin/profile',   icon: '👤', label: 'Hồ sơ' },
  ],
  staff: [
    { path: '/staff',          icon: '🏠', label: 'Tổng quan' },
    { path: '/staff/students', icon: '🎓', label: 'Học viên' },
    { path: '/staff/schedule', icon: '📅', label: 'Lịch học' },
    { path: '/staff/tuition',  icon: '💰', label: 'Thu tiền' },
    { path: '/staff/profile',   icon: '👤', label: 'Hồ sơ' },
  ],
  teacher: [
    { path: '/teacher',            icon: '🏠', label: 'Tổng quan' },
    { path: '/teacher/classes',    icon: '🎵', label: 'Lớp học' },
    { path: '/teacher/attendance', icon: '✅', label: 'Điểm danh' },
    { path: '/teacher/lesson-log', icon: '📝', label: 'Nhật ký' },
    { path: '/teacher/materials',  icon: '📁', label: 'Tài liệu' },
    { path: '/teacher/profile', icon: '👤', label: 'Hồ sơ' },
  ],
  student: [
    { path: '/student',            icon: '🏠', label: 'Tổng quan' },
    { path: '/student/schedule',   icon: '📅', label: 'Lịch học' },
    { path: '/student/tuition',    icon: '💰', label: 'Học phí' },
    { path: '/student/attendance', icon: '✅', label: 'Điểm danh' },
    { path: '/student/progress',   icon: '📈', label: 'Tiến độ' },
    { path: '/student/profile', icon: '👤', label: 'Hồ sơ' },
  ],
};

const BottomNav = () => {
  const { user } = useAuth();
  const navItems = menus[user?.role] || [];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 md:hidden">
      <div className="flex">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path.split('/').length === 2}
            className={({ isActive }) => `
              flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-all
              ${isActive ? 'text-primary-600' : 'text-gray-400'}
            `}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;