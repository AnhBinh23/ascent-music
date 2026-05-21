import api from './api';

const teacherService = {
  getAll:    async ()             => { const d = await api.get('/teachers');                        return d.rows || []; },
  getById:   async (id)           => { const d = await api.get(`/teachers/${id}`);                 return d.row; },
  create:    async (data)         => api.post('/teachers', data),
  update:    async (id, data)     => api.put(`/teachers/${id}`, data),
  delete:    async (id)           => api.delete(`/teachers/${id}`),
  getSalary: async (month, year)  => { const d = await api.get(`/teachers/salary?month=${month}&year=${year}`); return d.rows || []; },
};

export default teacherService;