import api from './api';

const tuitionService = {
  getAll:    async ()       => { const d = await api.get('/tuition');         return d.rows || []; },
  getUnpaid: async ()       => { const d = await api.get('/tuition/unpaid');  return d.rows || []; },
  create:    async (data)   => api.post('/tuition', data),
  update:    async (id,data)=> api.put(`/tuition/${id}`, data),
};

export default tuitionService;