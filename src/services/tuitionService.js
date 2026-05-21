import api from './api';
import { SHEETS } from '../config/sheetsConfig';

const tuitionService = {

  getAll: async () => {
    const data = await api.get('getAll', { sheet: SHEETS.TUITION });
    return data.rows || [];
  },

  getByStudent: async (studentId) => {
    const data = await api.get('getByStudent', { sheet: SHEETS.TUITION, studentId });
    return data.rows || [];
  },

  getUnpaid: async () => {
    const data = await api.get('getUnpaid', { sheet: SHEETS.TUITION });
    return data.rows || [];
  },

  collect: async (tuitionData) => {
    return await api.post('create', { sheet: SHEETS.TUITION, ...tuitionData });
  },

  update: async (id, tuitionData) => {
    return await api.put('update', { sheet: SHEETS.TUITION, id, ...tuitionData });
  },

  getReport: async (month, year) => {
    const data = await api.get('getTuitionReport', { sheet: SHEETS.TUITION, month, year });
    return data.report || {};
  },

};

export default tuitionService;