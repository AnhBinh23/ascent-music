import api from './api'; // hoặc axios, tuỳ project dùng gì

// Lấy thông báo từ backend
export const getNotifications = async () => {
  try {
    const res = await api.get('/notifications');
    return res.data.rows || [];
  } catch (err) {
    console.error('Lỗi lấy thông báo:', err);
    return [];
  }
};

export const checkUpcomingClasses = (schedule, role, userName) => {
  return [];
};

export const getTimeUntil = (timeStart) => {
  if (!timeStart) return null;
  const [h, m]  = timeStart.split(':').map(Number);
  const now     = new Date();
  const target  = new Date();
  target.setHours(h, m, 0);
  const diff    = Math.round((target - now) / 60000);
  if (diff <= 0 || diff > 60) return null;
  return `Còn ${diff} phút`;
};