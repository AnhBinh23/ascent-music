const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('ascent_token');

const headers = () => ({
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

const api = {
  get: async (endpoint) => {
    const res  = await fetch(`${BASE}${endpoint}`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },
  post: async (endpoint, body) => {
    const res  = await fetch(`${BASE}${endpoint}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },
  put: async (endpoint, body) => {
    const res  = await fetch(`${BASE}${endpoint}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },
  patch: async (endpoint, body) => {
    const res  = await fetch(`${BASE}${endpoint}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },
  delete: async (endpoint) => {
    const res  = await fetch(`${BASE}${endpoint}`, { method: 'DELETE', headers: headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },
};

export default api;