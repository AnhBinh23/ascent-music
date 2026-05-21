import { toast } from 'react-toastify';

// Kiểm tra và gửi thông báo trước 30 phút
export const checkUpcomingClasses = (classes, userRole, userName) => {
  const now = new Date();

  classes.forEach(cls => {
    const [h, m] = cls.timeStart.split(':').map(Number);
    const classTime  = new Date();
    classTime.setHours(h, m, 0, 0);

    const diffMs  = classTime - now;
    const diffMin = Math.floor(diffMs / 60000);

    // Trong khoảng 28-32 phút (để tránh bắn 2 lần)
    if (diffMin >= 28 && diffMin <= 32) {
      const key = `notif_${cls.id}_${classTime.toDateString()}`;
      if (localStorage.getItem(key)) return; // Đã thông báo rồi

      localStorage.setItem(key, '1');

      if (userRole === 'teacher') {
        toast.info(
          `🔔 Còn 30 phút nữa bạn có buổi dạy!\n📚 ${cls.name}\n🕐 ${cls.timeStart} · ${cls.room}`,
          { autoClose: 10000, toastId: key }
        );
      }

      if (userRole === 'student') {
        toast.info(
          `🔔 Còn 30 phút nữa bạn có buổi học!\n📚 ${cls.name}\n🕐 ${cls.timeStart} · Thầy/Cô ${cls.teacher}`,
          { autoClose: 10000, toastId: key }
        );
      }

      // Lưu vào thông báo trong app
      const saved = JSON.parse(localStorage.getItem('app_notifications') || '[]');
      saved.unshift({
        id: Date.now(),
        type: 'schedule_remind',
        title: 'Nhắc lịch học',
        message: `${cls.name} lúc ${cls.timeStart}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('app_notifications', JSON.stringify(saved.slice(0, 50)));
    }
  });
};

// Format thời gian còn lại
export const getTimeUntil = (timeStart) => {
  const now = new Date();
  const [h, m] = timeStart.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  const diff = target - now;
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours} giờ ${mins} phút nữa`;
  return `${mins} phút nữa`;
};