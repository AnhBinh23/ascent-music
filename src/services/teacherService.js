import api from './api';
import { SHEETS } from '../config/sheetsConfig';

const teacherService = {

  getAll: async () => {
    const data = await api.get('getAll', { sheet: SHEETS.TEACHERS });
    return data.rows || [];
  },

  getById: async (id) => {
    const data = await api.get('getById', { sheet: SHEETS.TEACHERS, id });
    return data.row || null;
  },

  create: async (teacherData) => {
    return await api.post('create', { sheet: SHEETS.TEACHERS, ...teacherData });
  },

  update: async (id, teacherData) => {
    return await api.put('update', { sheet: SHEETS.TEACHERS, id, ...teacherData });
  },

  delete: async (id) => {
    return await api.delete('delete', { sheet: SHEETS.TEACHERS, id });
  },

  getSchedule: async (teacherId) => {
    const data = await api.get('getTeacherSchedule', { sheet: SHEETS.SCHEDULE, teacherId });
    return data.rows || [];
  },

};

export default teacherService;