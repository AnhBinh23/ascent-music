import api from './api';

const attendanceService = {
  getByClass:   async (classId)   => { const d = await api.get(`/attendance/class/${classId}`);   return d.rows || []; },
  getByStudent: async (studentId) => { const d = await api.get(`/attendance/student/${studentId}`); return d.rows || []; },
  getStats:     async (studentId) => { const d = await api.get(`/attendance/stats/${studentId}`);  return d.stats; },
  save: async (list) => api.post('/attendance/save', { attendanceList: list }),
};

export default attendanceService;