import api from './api';
import { SHEETS } from '../config/sheetsConfig';

const studentService = {

  getAll: async () => {
    const data = await api.get('getAll', { sheet: SHEETS.STUDENTS });
    return data.rows || [];
  },

  getById: async (id) => {
    const data = await api.get('getById', { sheet: SHEETS.STUDENTS, id });
    return data.row || null;
  },

  create: async (studentData) => {
    return await api.post('create', { sheet: SHEETS.STUDENTS, ...studentData });
  },

  update: async (id, studentData) => {
    return await api.put('update', { sheet: SHEETS.STUDENTS, id, ...studentData });
  },

  delete: async (id) => {
    return await api.delete('delete', { sheet: SHEETS.STUDENTS, id });
  },

  getByClass: async (classId) => {
    const data = await api.get('getByClass', { sheet: SHEETS.STUDENTS, classId });
    return data.rows || [];
  },

};

export default studentService;