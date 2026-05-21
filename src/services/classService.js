import api from './api';
import { SHEETS } from '../config/sheetsConfig';

const classService = {
  getAll: async () => {
    const data = await api.get('getAll', { sheet: SHEETS.CLASSES });
    return data.rows || [];
  },
  getById: async (id) => {
    const data = await api.get('getById', { sheet: SHEETS.CLASSES, id });
    return data.row || null;
  },
  create: async (classData) => {
    return await api.post('create', { sheet: SHEETS.CLASSES, ...classData });
  },
  update: async (id, classData) => {
    return await api.put('update', { sheet: SHEETS.CLASSES, id, ...classData });
  },
  delete: async (id) => {
    return await api.delete('delete', { sheet: SHEETS.CLASSES, id });
  },
  getByTeacher: async (teacherId) => {
    const data = await api.get('getByTeacher', { sheet: SHEETS.CLASSES, teacherId });
    return data.rows || [];
  },
  getByStudent: async (studentId) => {
    const data = await api.get('getByStudent', { sheet: SHEETS.CLASSES, studentId });
    return data.rows || [];
  },
};

export default classService;