import api from './api';
import { SHEETS } from '../config/sheetsConfig';

const attendanceService = {

  getByClass: async (classId) => {
    const data = await api.get('getByClass', { sheet: SHEETS.ATTENDANCE, classId });
    return data.rows || [];
  },

  getByStudent: async (studentId) => {
    const data = await api.get('getByStudent', { sheet: SHEETS.ATTENDANCE, studentId });
    return data.rows || [];
  },

  save: async (attendanceList) => {
    return await api.post('saveAttendance', {
      sheet: SHEETS.ATTENDANCE,
      data: attendanceList
    });
  },

  getStats: async (studentId) => {
    const data = await api.get('getAttendanceStats', { sheet: SHEETS.ATTENDANCE, studentId });
    return data.stats || {};
  },

};

export default attendanceService;