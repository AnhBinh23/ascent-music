import api from './api';

const studentService = {
  getAll:   async ()        => { const d = await api.get('/students');           return d.rows || []; },
  search:   async (q)       => { const d = await api.get(`/students/search?q=${q}`); return d.rows || []; },
  getById:  async (id)      => { const d = await api.get(`/students/${id}`);     return d.row; },
  create:   async (data)    => api.post('/students', data),
  update:   async (id,data) => api.put(`/students/${id}`, data),
  delete:   async (id)      => api.delete(`/students/${id}`),
  getUnpaid: async ()       => { const d = await api.get('/tuition/unpaid');     return d.rows || []; },
};

export default studentService;