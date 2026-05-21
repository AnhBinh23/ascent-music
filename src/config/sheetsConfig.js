const SHEETS_API_URL = process.env.REACT_APP_SHEETS_API_URL;

export const SHEETS = {
  ACCOUNTS:    'TaiKhoan',
  STUDENTS:    'HocVien',
  TEACHERS:    'GiaoVien',
  CLASSES:     'LopHoc',
  SCHEDULE:    'LichHoc',
  ATTENDANCE:  'DiemDanh',
  TUITION:     'HocPhi',
  ROOMS:       'PhongHoc',
  INSTRUMENTS: 'NhacCu',
  LESSON_LOGS: 'NhatKy',
  MATERIALS:   'TaiLieu',
};

export const buildUrl = (action, params = {}) => {
  const url = new URL(SHEETS_API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, val]) => {
    url.searchParams.set(key, val);
  });
  return url.toString();
};

export default SHEETS_API_URL;