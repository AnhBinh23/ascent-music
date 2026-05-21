import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const menus = {
  admin: [
    { path: '/admin',             icon: '🏠', label: 'Tổng quan' },
    { path: '/admin/students',    icon: '🎓', label: 'Học viên' },
    { path: '/admin/teachers',    icon: '👨‍🏫', label: 'Giáo viên' },
    { path: '/admin/classes',     icon: '🎵', label: 'Lớp học' },
    { path: '/admin/schedule',    icon: '📅', label: 'Lịch học' },
    { path: '/admin/tuition',     icon: '💰', label: 'Học phí' },
    { path: '/admin/rooms',       icon: '🚪', label: 'Phòng học' },
    { path: '/admin/instruments', icon: '🎸', label: 'Nhạc cụ' },
    { path: '/admin/reports',     icon: '📊', label: 'Báo cáo' },
    { path: '/admin/pending',     icon: '🔔', label: 'Duyệt tài khoản' },
    { path: '/admin/checkin',     icon: '📋', label: 'Chấm công GV' },
    { path: '/admin/settings',    icon: '⚙️', label: 'Tài khoản' },
    { path: '/admin/profile',     icon: '👤', label: 'Hồ sơ của tôi' },
  ],
  staff: [
    { path: '/staff',          icon: '🏠', label: 'Tổng quan' },
    { path: '/staff/students', icon: '🎓', label: 'Học viên' },
    { path: '/staff/schedule', icon: '📅', label: 'Lịch học' },
    { path: '/staff/tuition',  icon: '💰', label: 'Thu học phí' },
    { path: '/staff/profile',  icon: '👤', label: 'Hồ sơ của tôi' },
  ],
  teacher: [
    { path: '/teacher',            icon: '🏠', label: 'Tổng quan' },
    { path: '/teacher/classes',    icon: '🎵', label: 'Lớp của tôi' },
    { path: '/teacher/schedule',   icon: '📅', label: 'Lịch dạy' },
    { path: '/teacher/attendance', icon: '✅', label: 'Điểm danh' },
    { path: '/teacher/lesson-log', icon: '📝', label: 'Nhật ký học' },
    { path: '/teacher/checkin',    icon: '📋', label: 'Chấm công' },
    { path: '/teacher/materials',  icon: '📁', label: 'Tài liệu' },
    { path: '/teacher/profile',    icon: '👤', label: 'Hồ sơ của tôi' },
  ],
  student: [
    { path: '/student',            icon: '🏠', label: 'Tổng quan' },
    { path: '/student/schedule',   icon: '📅', label: 'Lịch học' },
    { path: '/student/tuition',    icon: '💰', label: 'Học phí' },
    { path: '/student/attendance', icon: '✅', label: 'Điểm danh' },
    { path: '/student/progress',   icon: '📈', label: 'Tiến độ' },
    { path: '/student/materials',  icon: '📁', label: 'Tài liệu' },
    { path: '/student/profile',    icon: '👤', label: 'Hồ sơ của tôi' },
  ],
};

const roleColors = {
  admin:   'bg-red-100 text-red-700',
  staff:   'bg-orange-100 text-orange-700',
  teacher: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
};

const roleLabels = {
  admin:   'Super Admin',
  staff:   'Nhân viên',
  teacher: 'Giáo viên',
  student: 'Học viên',
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { sidebarOpen } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = menus[user?.role] || [];

  return (
    <aside className={`
      fixed top-0 left-0 h-full bg-white border-r border-gray-100 z-40
      flex flex-col transition-all duration-300
      ${sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'}
      md:relative md:flex md:w-60
    `}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white text-lg">
          🎵
        </div>
        <div>
          <p className="font-bold text-gray-800 text-sm leading-tight">ASCENT</p>
          <p className="text-xs text-gray-400">Music Center</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user?.role]}`}>
              {roleLabels[user?.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path.split('/').length === 2}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm transition-all
              ${isActive
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}
            `}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all"
        >
          <span className="text-lg">🚪</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;