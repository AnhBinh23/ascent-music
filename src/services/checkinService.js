import api from './api';

const checkinService = {
  getAll:       async ()           => { const d = await api.get('/checkin');                       return d.rows || []; },
  getByTeacher: async (teacherId)  => { const d = await api.get(`/checkin/teacher/${teacherId}`); return d.rows || []; },
  create:       async (data)       => api.post('/checkin', data),
};

export default checkinService;