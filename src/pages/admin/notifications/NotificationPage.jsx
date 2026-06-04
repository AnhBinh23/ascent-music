import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import teacherService from '../../../services/teacherService';

const NOTIF_TYPES = [
  { value: 'tuition',  label: '💰 Học phí sắp đến hạn' },
  { value: 'dayoff',   label: '📅 Nghỉ học / Đổi lịch' },
  { value: 'material', label: '📁 Có tài liệu mới' },
  { value: 'general',  label: '📢 Thông báo chung' },
];

const RECIPIENTS = [
  { value: 'all',      icon: '👥', label: 'Tất cả mọi người' },
  { value: 'students', icon: '🎓', label: 'Tất cả học viên'  },
  { value: 'teachers', icon: '👨‍🏫', label: 'Tất cả giáo viên' },
  { value: 'specific', icon: '👤', label: 'Chọn từng người'  },
];

const BANNER_TYPES = [
  { value: 'holiday', label: '🎉 Ngày lễ' },
  { value: 'dayoff',  label: '📅 Nghỉ học' },
  { value: 'info',    label: '📢 Chung' },
  { value: 'warning', label: '⚠️ Cảnh báo' },
  { value: 'success', label: '✅ Tin vui' },
];

const TEMPLATES = {
  tuition: {
    title: '💰 Nhắc đóng học phí',
    message: 'Kính gửi Phụ huynh/Học viên,\n\nHọc phí tháng này sẽ đến hạn vào cuối tháng. Vui lòng đóng học phí đúng hạn để tránh gián đoạn việc học.\n\nTrân trọng,\nAscent Music Center',
  },
  dayoff: {
    title: '📅 Thông báo nghỉ học',
    message: 'Kính gửi Phụ huynh/Học viên,\n\nTrung tâm xin thông báo lịch học sẽ thay đổi như sau:\n\n[Điền thông tin nghỉ/đổi lịch]\n\nTrân trọng,\nAscent Music Center',
  },
  material: {
    title: '📁 Tài liệu học tập mới',
    message: 'Kính gửi Học viên,\n\nGiáo viên vừa cập nhật tài liệu mới trên hệ thống. Vui lòng đăng nhập app để xem và tải về.\n\nTrân trọng,\nAscent Music Center',
  },
  general: { title: '', message: '' },
};

const today = () => new Date().toISOString().split('T')[0];

const NotificationPage = () => {
  const [tab, setTab]                     = useState('custom');
  const [type, setType]                   = useState('general');
  const [recipient, setRecipient]         = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [title, setTitle]                 = useState('');
  const [message, setMessage]             = useState('');
  const [sending, setSending]             = useState(false);
  const [history, setHistory]             = useState([]);
  const [userSearch, setUserSearch]       = useState('');

  // Kênh gửi
  const [sendPush, setSendPush]       = useState(true);
  const [showBanner, setShowBanner]   = useState(false);
  const [bannerType, setBannerType]   = useState('info');
  const [bannerStart, setBannerStart] = useState(today());
  const [bannerEnd, setBannerEnd]     = useState(today());

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const loadHistory = useCallback(async () => {
    try {
      const data = await api.get('/notifications/history');
      setHistory(data.rows || []);
    } catch { setHistory([]); }
  }, []);

  useEffect(() => {
    api.get('/students').then(d => setStudents(d.rows || [])).catch(() => {});
    teacherService.getAll().then(setTeachers).catch(() => {});
    loadHistory();
  }, [loadHistory]);

  const allUsers = [
    ...students.map(s => ({ id: s.id, name: s.name, phone: s.phone, role: 'student' })),
    ...teachers.map(t => ({ id: t.id, name: t.name, phone: t.phone, role: 'teacher' })),
  ];

  const getRecipientCount = () => {
    if (recipient === 'all')      return students.length + teachers.length;
    if (recipient === 'students') return students.length;
    if (recipient === 'teachers') return teachers.length;
    if (recipient === 'specific') return selectedUsers.length;
    return 0;
  };

  const applyTemplate = (t) => {
    setType(t);
    setTitle(TEMPLATES[t].title);
    setMessage(TEMPLATES[t].message);
  };

  const toggleUser = (id) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
  };

  const filteredUsers = allUsers.filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()));

  const validate = () => {
    if (!title.trim())   { toast.error('Vui lòng nhập tiêu đề!'); return false; }
    if (!message.trim()) { toast.error('Vui lòng nhập nội dung!'); return false; }
    if (recipient === 'specific' && selectedUsers.length === 0) {
      toast.error('Vui lòng chọn người nhận!'); return false;
    }
    if (!sendPush && !showBanner) {
      toast.error('Chọn ít nhất 1 cách gửi (push hoặc banner)!'); return false;
    }
    return true;
  };

  const doSend = async () => {
    if (!validate()) return;
    setSending(true);
    try {
      const res = await api.post('/notifications', {
        title, message, recipient, type,
        specific_ids: recipient === 'specific' ? selectedUsers : [],
        send_push: sendPush,
        show_banner: showBanner,
        banner_type: bannerType,
        banner_start: showBanner ? bannerStart : null,
        banner_end: showBanner ? bannerEnd : null,
      });
      const parts = [];
      if (res.push > 0)   parts.push(`đẩy ${res.push} push`);
      if (res.banner)     parts.push('ghim banner');
      toast.success(`✅ Đã gửi cho ${res.total} người${parts.length ? ' (' + parts.join(', ') + ')' : ''}!`);
      setTitle(''); setMessage(''); setSelectedUsers([]); setShowBanner(false);
      await loadHistory();
      setTab('history');
    } catch {
      toast.error('Gửi thất bại! Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const TABS = [
    { key: 'custom',  label: '✍️ Soạn tự do' },
    { key: 'compose', label: '📋 Dùng mẫu' },
    { key: 'history', label: `🕐 Lịch sử (${history.length})` },
  ];

  const SendPanel = () => (
    <div className="flex flex-col gap-4">
      {/* Người nhận */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-bold text-gray-700 mb-3">👥 Người nhận</p>
        <div className="grid grid-cols-2 gap-2">
          {RECIPIENTS.map(r => {
            const active = recipient === r.value;
            const cnt = r.value === 'all' ? students.length + teachers.length
              : r.value === 'students' ? students.length
              : r.value === 'teachers' ? teachers.length
              : selectedUsers.length;
            return (
              <button key={r.value} onClick={() => setRecipient(r.value)}
                className={`p-3 rounded-xl border text-left transition-all
                  ${active ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                <div className="text-xl mb-1">{r.icon}</div>
                <p className={`text-xs font-medium ${active ? 'text-primary-700' : 'text-gray-600'}`}>{r.label}</p>
                {r.value !== 'specific' && <p className="text-xs text-gray-400 mt-0.5">{cnt} người</p>}
              </button>
            );
          })}
        </div>

        {recipient === 'specific' && (
          <div className="mt-3">
            <input type="text" placeholder="🔍 Tìm người nhận..." value={userSearch}
              onChange={e => setUserSearch(e.target.value)} className="input-field text-sm mb-2" />
            <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Không tìm thấy</p>
              ) : filteredUsers.map(u => (
                <label key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={selectedUsers.includes(u.id)}
                    onChange={() => toggleUser(u.id)} className="w-4 h-4 accent-orange-500" />
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600 flex-shrink-0">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                    {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                  </div>
                  <Badge label={u.role === 'student' ? 'HV' : 'GV'} variant={u.role === 'student' ? 'green' : 'blue'} />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cách gửi */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-bold text-gray-700 mb-3">📤 Cách gửi</p>
        <div className="flex flex-col gap-2">
          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
            ${sendPush ? 'border-primary-300 bg-primary-50' : 'border-gray-100'}`}>
            <input type="checkbox" checked={sendPush} onChange={e => setSendPush(e.target.checked)}
              className="w-4 h-4 accent-orange-500" />
            <div>
              <p className="text-sm font-medium text-gray-800">📱 Đẩy về điện thoại</p>
              <p className="text-xs text-gray-400">Push notification tức thời</p>
            </div>
          </label>

          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
            ${showBanner ? 'border-primary-300 bg-primary-50' : 'border-gray-100'}`}>
            <input type="checkbox" checked={showBanner} onChange={e => setShowBanner(e.target.checked)}
              className="w-4 h-4 accent-orange-500" />
            <div>
              <p className="text-sm font-medium text-gray-800">📌 Ghim banner trong app</p>
              <p className="text-xs text-gray-400">Hiển thị thường trực trên đầu app</p>
            </div>
          </label>
        </div>

        {/* Cấu hình banner */}
        {showBanner && (
          <div className="mt-3 p-3 bg-gray-50 rounded-xl flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Loại banner</label>
              <div className="flex flex-wrap gap-1.5">
                {BANNER_TYPES.map(b => (
                  <button key={b.value} onClick={() => setBannerType(b.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all
                      ${bannerType === b.value ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:bg-white'}`}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Từ ngày</label>
                <input type="date" value={bannerStart} onChange={e => setBannerStart(e.target.value)}
                  className="input-field text-sm py-2" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Đến ngày</label>
                <input type="date" value={bannerEnd} onChange={e => setBannerEnd(e.target.value)}
                  className="input-field text-sm py-2" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Xem trước & Gửi */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-bold text-gray-700 mb-3">👀 Xem trước & Gửi</p>
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-blue-50 rounded-xl flex items-center gap-3">
            <span className="text-xl">👥</span>
            <div>
              <p className="text-xs text-blue-500">Số người nhận</p>
              <p className="text-base font-bold text-blue-700">{getRecipientCount()} người</p>
            </div>
          </div>
          {(title || message) && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              {title && <p className="text-sm font-semibold text-gray-800 mb-1">{title}</p>}
              {message && <p className="text-xs text-gray-600 whitespace-pre-line line-clamp-4">{message}</p>}
            </div>
          )}
          <Button fullWidth loading={sending} icon="📨" onClick={doSend} variant="primary">
            Gửi thông báo
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout title="Gửi thông báo">
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-2xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all
              ${tab === t.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'custom' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-bold text-gray-700 mb-4">✍️ Soạn thông báo theo ý bạn</p>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Tiêu đề <span className="text-red-500">*</span></label>
                  <input value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="Nhập tiêu đề..." />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Nội dung <span className="text-red-500">*</span></label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={10}
                    className="input-field resize-none" placeholder="Nhập nội dung thông báo..." />
                  <div className="flex justify-between">
                    <p className="text-xs text-gray-400">{message.length} ký tự</p>
                    <button onClick={() => { setTitle(''); setMessage(''); }}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors">🗑️ Xóa trắng</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <SendPanel />
        </div>
      )}

      {tab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-bold text-gray-700 mb-3">📋 Chọn mẫu thông báo</p>
              <div className="grid grid-cols-2 gap-2">
                {NOTIF_TYPES.map(t => (
                  <button key={t.value} onClick={() => applyTemplate(t.value)}
                    className={`p-3 rounded-xl text-sm font-medium border text-left transition-all
                      ${type === t.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 hover:bg-gray-50 text-gray-600'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-bold text-gray-700 mb-3">📝 Nội dung (có thể chỉnh sửa)</p>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="Tiêu đề..." />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Nội dung</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={8}
                    className="input-field resize-none" placeholder="Nội dung..." />
                  <p className="text-xs text-gray-400 text-right">{message.length} ký tự</p>
                </div>
              </div>
            </div>
          </div>
          <SendPanel />
        </div>
      )}

      {tab === 'history' && (
        <div className="flex flex-col gap-3">
          {history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-gray-400 text-sm">Chưa có thông báo nào được gửi</p>
            </div>
          ) : history.map((h, i) => (
            <div key={h.id || i} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {h.show_banner ? '📌' : '📢'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{h.title}</p>
                    {h.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{h.message}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      👥 {h.recipient} · 🕐 {h.created_at ? new Date(h.created_at).toLocaleString('vi-VN') : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge label="Đã gửi" variant="green" dot />
                  {h.show_banner === 1 && <Badge label="📌 Banner" variant="blue" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default NotificationPage;