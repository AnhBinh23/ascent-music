import api from './api';

const scheduleService = {
  getAll:        async ()           => { const d = await api.get('/schedules');                          return d.rows || []; },
  getByTeacher:  async (teacherId)  => { const d = await api.get(`/schedules/teacher/${teacherId}`);    return d.rows || []; },
  getByDate:     async (date)       => { const d = await api.get(`/schedules?date=${date}`);            return d.rows || []; },
  create:        async (data)       => api.post('/schedules', data),
  delete:        async (id)         => api.delete(`/schedules/${id}`),
};

export default scheduleService;