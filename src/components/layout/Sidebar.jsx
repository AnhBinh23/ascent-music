import React, { useRef, useLayoutEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

let savedScrollPos = 0;

const menus = {
  admin: [
    { path: '/admin',               icon: '🏠', label: 'Tổng quan'       },
    { path: '/admin/students',      icon: '🎓', label: 'Học viên'        },
    
    { path: '/admin/teachers',      icon: '👨‍🏫', label: 'Giáo viên'       },

  
    { path: '/admin/schedule',      icon: '📅', label: 'Lịch học'        },
    { path: '/admin/tuition',       icon: '💰', label: 'Học phí'         },
    { path: '/admin/attendance',          icon: '✅', label: 'Điểm danh HV'    },
    { path: '/admin/flexible-attendance', icon: '🔄', label: 'Lớp linh hoạt'   },
    
    
    { path: '/admin/reports',       icon: '📊', label: 'Báo cáo'         },
    { path: '/admin/import-excel',  icon: '📥', label: 'Import Excel'    },
 
    { path: '/admin/notifications', icon: '📨', label: 'Gửi thông báo'   },
    { path: '/admin/chat',          icon: '💬', label: 'Tin nhắn'        },
    { path: '/admin/ai',            icon: '🤖', label: 'Trợ lý AI'       },
    { path: '/admin/settings',      icon: '⚙️', label: 'Tài khoản'       },
    { path: '/admin/profile',       icon: '👤', label: 'Hồ sơ của tôi'  },
  ],
  staff: [
    { path: '/staff',               icon: '🏠', label: 'Tổng quan'        },
    { path: '/staff/students',      icon: '🎓', label: 'Học viên'         },
    { path: '/staff/teachers',      icon: '👨‍🏫', label: 'Giáo viên'        },
    { path: '/staff/enrollment',    icon: '📋', label: 'Đăng ký khóa học' },
    { path: '/staff/schedule',      icon: '📅', label: 'Lịch học'         },
    { path: '/staff/tuition',       icon: '💰', label: 'Thu học phí'      },
    { path: '/staff/invoice',       icon: '🧾', label: 'Tạo hóa đơn'     },
    { path: '/staff/checkin',       icon: '📊', label: 'Chấm công GV'     },
    { path: '/staff/chat',          icon: '💬', label: 'Tin nhắn'         },
    { path: '/staff/profile',       icon: '👤', label: 'Hồ sơ của tôi'   },
  ],
  teacher: [
    { path: '/teacher',               icon: '🏠', label: 'Tổng quan'      },
    { path: '/teacher/classes',       icon: '🎵', label: 'Lớp của tôi'   },
    { path: '/teacher/schedule',      icon: '📅', label: 'Lịch dạy'      },
    { path: '/teacher/attendance',          icon: '✅', label: 'Điểm danh'     },
    { path: '/teacher/flexible-attendance', icon: '🔄', label: 'Lớp linh hoạt' },
    { path: '/teacher/lesson-log',          icon: '📝', label: 'Nhật ký học'   },
    { path: '/teacher/checkin',       icon: '📋', label: 'Chấm công'     },
    { path: '/teacher/notifications', icon: '📨', label: 'Gửi thông báo' },
    { path: '/teacher/materials',     icon: '📁', label: 'Tài liệu'      },
    { path: '/teacher/chat',          icon: '💬', label: 'Tin nhắn'      },
    { path: '/teacher/ai',            icon: '🤖', label: 'Trợ lý AI'     },
    { path: '/teacher/profile',       icon: '👤', label: 'Hồ sơ của tôi' },
  ],
  student: [
    { path: '/student',            icon: '🏠', label: 'Tổng quan'      },
    { path: '/student/schedule',   icon: '📅', label: 'Lịch học'       },
    { path: '/student/tuition',    icon: '💰', label: 'Học phí'        },
    { path: '/student/attendance', icon: '✅', label: 'Điểm danh'      },
    { path: '/student/progress',   icon: '📈', label: 'Tiến độ'        },
    { path: '/student/materials',  icon: '📁', label: 'Tài liệu'       },
    { path: '/student/chat',       icon: '💬', label: 'Tin nhắn'       },
    { path: '/student/ai',         icon: '🤖', label: 'Hỏi AI'         },
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
  const { user } = useAuth();
  const navRef   = useRef(null);

  useLayoutEffect(() => {
    if (navRef.current) {
      navRef.current.scrollTop = savedScrollPos;
    }
  });

  const navItems = menus[user?.role] || [];

  return (
    <aside
      className="w-60 bg-white border-r border-gray-100 flex flex-col"
      style={{ height: '100dvh', maxHeight: '-webkit-fill-available' }}
    >
      {/* Logo */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <img src="/icons/logo.png" alt="Logo" className="w-9 h-9 object-contain"/>
        <div>
          <p className="font-bold text-gray-800 text-sm leading-tight">ASCENT</p>
          <p className="text-xs text-gray-400">Music Studio</p>
        </div>
      </div>

      {/* User info */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-gray-100">
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
      <nav
        ref={navRef}
        className="flex-1 overflow-y-auto px-3 py-3 min-h-0"
        onScroll={(e) => { savedScrollPos = e.currentTarget.scrollTop; }}
      >
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
    </aside>
  );
};

export default Sidebar;;