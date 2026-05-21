import api from './api';

const invoiceService = {
  getAll:          async ()         => { const d = await api.get('/invoices');                      return d.rows || []; },
  getByStudent:    async (id)       => { const d = await api.get(`/invoices/student/${id}`);       return d.rows || []; },
  getStats:        async ()         => api.get('/invoices/stats'),
  create:          async (data)     => api.post('/invoices', data),
  confirmPayment:  async (id, data) => api.put(`/invoices/${id}/confirm-payment`, data),
};

export default invoiceService;