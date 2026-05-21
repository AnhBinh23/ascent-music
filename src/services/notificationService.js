export const checkUpcomingClasses = (schedule, role, userName) => {
  // Giữ nguyên logic localStorage cho notifications
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