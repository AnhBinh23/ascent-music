import SHEETS_API_URL from '../config/sheetsConfig';
import { toast } from 'react-toastify';

const request = async (action, params = {}, method = 'GET', body = null) => {
  try {
    const url = new URL(SHEETS_API_URL);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const options = { method };
    if (body) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url.toString(), options);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || 'Có lỗi xảy ra');
    }
    return data;

  } catch (error) {
    toast.error(error.message || 'Lỗi kết nối server');
    throw error;
  }
};

const api = {
  get:    (action, params)       => request(action, params, 'GET'),
  post:   (action, body)         => request(action, {}, 'POST', body),
  put:    (action, body)         => request(action, {}, 'PUT', body),
  delete: (action, params)       => request(action, params, 'DELETE'),
};

export default api;