const VAPID_PUBLIC_KEY = 'BHspduU3GjUyPp03zx-rY6_Cmuf7iKYxLI8m_YvQxAU4H_CVSxpiPnCe8MXFf5j0P7e-pKjbKlmkxRq1aB-ZWEg';

const urlBase64ToUint8Array = (base64String) => {
  const padding  = '='.repeat((4 - base64String.length % 4) % 4);
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData  = window.atob(base64);
  const output   = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
};

const pushService = {
  // Đăng ký nhận push notification
  subscribe: async (apiPost) => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push không được hỗ trợ');
        return false;
      }

      // Đăng ký service worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Xin quyền thông báo
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Người dùng từ chối thông báo');
        return false;
      }

      // Tạo subscription
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Gửi subscription lên server
      await apiPost('/push/subscribe', { subscription });
      console.log('✅ Đăng ký push thành công!');
      return true;
    } catch (err) {
      console.error('Push subscribe error:', err);
      return false;
    }
  },

  // Kiểm tra đã đăng ký chưa
  isSubscribed: async () => {
    try {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return false;
      const sub = await reg.pushManager.getSubscription();
      return !!sub;
    } catch {
      return false;
    }
  },
};

export default pushService;