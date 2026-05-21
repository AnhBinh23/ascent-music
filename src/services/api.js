const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('ascent_token');

const request = async (endpoint, method = 'GET', body = null) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res  = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra');
  return data;
};

const api = {
  get:    (endpoint)        => request(endpoint, 'GET'),
  post:   (endpoint, body)  => request(endpoint, 'POST',   body),
  put:    (endpoint, body)  => request(endpoint, 'PUT',    body),
  delete: (endpoint)        => request(endpoint, 'DELETE'),
};

export default api;