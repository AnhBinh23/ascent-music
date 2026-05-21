export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

export const ROLE_LABELS = {
  admin: 'Super Admin',
  staff: 'Nhân viên',
  teacher: 'Giáo viên',
  student: 'Học viên',
};

export const ROLE_COLORS = {
  admin: 'badge-red',
  staff: 'badge-orange',
  teacher: 'badge-blue',
  student: 'badge-green',
};

export const ROLE_HOME = {
  admin: '/admin',
  staff: '/staff',
  teacher: '/teacher',
  student: '/student',
};

export const PERMISSIONS = {
  admin: [
    'manage_students',
    'manage_teachers',
    'manage_classes',
    'manage_schedule',
    'manage_tuition',
    'manage_rooms',
    'manage_accounts',
    'view_reports',
  ],
  staff: [
    'manage_students',
    'manage_classes',
    'manage_schedule',
    'collect_tuition',
  ],
  teacher: [
    'view_classes',
    'take_attendance',
    'write_lesson_log',
    'upload_materials',
    'view_schedule',
  ],
  student: [
    'view_schedule',
    'view_tuition',
    'view_attendance',
    'view_progress',
    'view_materials',
  ],
};