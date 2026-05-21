import api from './api';
import { SHEETS } from '../config/sheetsConfig';

const scheduleService = {

  getAll: async () => {
    const data = await api.get('getAll', { sheet: SHEETS.SCHEDULE });
    return data.rows || [];
  },

  getByDate: async (date) => {
    const data = await api.get('getByDate', { sheet: SHEETS.SCHEDULE, date });
    return data.rows || [];
  },

  getByTeacher: async (teacherId) => {
    const data = await api.get('getByTeacher', { sheet: SHEETS.SCHEDULE, teacherId });
    return data.rows || [];
  },

  getByStudent: async (studentId) => {
    const data = await api.get('getByStudent', { sheet: SHEETS.SCHEDULE, studentId });
    return data.rows || [];
  },

  create: async (scheduleData) => {
    return await api.post('create', { sheet: SHEETS.SCHEDULE, ...scheduleData });
  },

  update: async (id, scheduleData) => {
    return await api.put('update', { sheet: SHEETS.SCHEDULE, id, ...scheduleData });
  },

  delete: async (id) => {
    return await api.delete('delete', { sheet: SHEETS.SCHEDULE, id });
  },

  checkConflict: async (teacherId, roomId, date, timeStart, timeEnd) => {
    const data = await api.get('checkConflict', {
      sheet: SHEETS.SCHEDULE, teacherId, roomId, date, timeStart, timeEnd
    });
    return data.conflict || false;
  },

};

export default scheduleService;