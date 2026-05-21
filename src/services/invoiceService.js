const BASE = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem('ascent_token');

const headers = () => ({
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

const invoiceService = {
  getAll: async () => {
    const res  = await fetch(`${BASE}/invoices`, { headers: headers() });
    const data = await res.json();
    return data.rows || [];
  },

  getByStudent: async (studentId) => {
    const res  = await fetch(`${BASE}/invoices/student/${studentId}`, { headers: headers() });
    const data = await res.json();
    return data.rows || [];
  },

  getStats: async () => {
    const res  = await fetch(`${BASE}/invoices/stats`, { headers: headers() });
    return await res.json();
  },

  create: async (invoice) => {
    const res  = await fetch(`${BASE}/invoices`, {
      method:  'POST',
      headers: headers(),
      body:    JSON.stringify(invoice),
    });
    return await res.json();
  },

  confirmPayment: async (id, payData) => {
    const res  = await fetch(`${BASE}/invoices/${id}/confirm-payment`, {
      method:  'PUT',
      headers: headers(),
      body:    JSON.stringify(payData),
    });
    return await res.json();
  },
};

export default invoiceService;