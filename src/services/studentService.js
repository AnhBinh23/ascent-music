const BASE = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem('ascent_token');

const headers = () => ({
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

const studentService = {
  getAll: async () => {
    const res  = await fetch(`${BASE}/students`, { headers: headers() });
    const data = await res.json();
    return data.rows || [];
  },

  search: async (q) => {
    const res  = await fetch(`${BASE}/students/search?q=${q}`, { headers: headers() });
    const data = await res.json();
    return data.rows || [];
  },

  getById: async (id) => {
    const res  = await fetch(`${BASE}/students/${id}`, { headers: headers() });
    const data = await res.json();
    return data.row;
  },

  create: async (student) => {
    const res  = await fetch(`${BASE}/students`, {
      method:  'POST',
      headers: headers(),
      body:    JSON.stringify(student),
    });
    return await res.json();
  },

  update: async (id, student) => {
    const res  = await fetch(`${BASE}/students/${id}`, {
      method:  'PUT',
      headers: headers(),
      body:    JSON.stringify(student),
    });
    return await res.json();
  },

  delete: async (id) => {
    const res  = await fetch(`${BASE}/students/${id}`, {
      method:  'DELETE',
      headers: headers(),
    });
    return await res.json();
  },
};

export default studentService;