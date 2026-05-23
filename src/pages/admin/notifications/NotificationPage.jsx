import React, { useState, useEffect } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const NOTIF_TYPES = [
  { value: 'tuition',  label: '💰 Học phí sắp đến hạn', color: 'orange' },
  { value: 'dayoff',   label: '📅 Nghỉ học / Đổi lịch', color: 'red'    },
  { value: 'material', label: '📁 Có tài liệu mới',      color: 'blue'   },
  { value: 'general',  label: '📢 Thông báo chung',       color: 'gray'   },
];

const RECIPIENTS = [
  { value: 'all',      label: '👥 Tất cả mọi người' },
  { value: 'students', label: '🎓 Tất cả học viên'  },
  { value: 'teachers', label: '👨‍🏫 Tất cả giáo viên' },
  { value: 'specific', label: '👤 Chọn từng người'  },
];

const SAMPLE_USERS = [
  { id: 'HV001', name: 'Nguyễn Văn An',  role: 'student', phone: '0901234567' },
  { id: 'HV002', name: 'Trần Thị Bình',  role: 'student', phone: '0912345678' },
  { id: 'HV003', name: 'Lê Minh Châu',   role: 'student', phone: '0923456789' },
  { id: 'GV001', name: 'Nguyễn Thị Mai', role: 'teacher', phone: '0901111111' },
  { id: 'GV002', name: 'Trần Văn Hùng',  role: 'teacher', phone: '0902222222' },
];

const TEMPLATES = {
  tuition: {
    title: '💰 Nhắc đóng học phí',
    message: 'Kính gửi Phụ huynh/Học viên,\n\nHọc phí tháng này sẽ đến hạn vào cuối tháng. Vui lòng đóng học phí đúng hạn để tránh gián đoạn việc học.\n\nMọi thắc mắc liên hệ: 0901 234 567\n\nTrân trọng,\nAscent Music Center',
  },
  dayoff: {
    title: '📅 Thông báo nghỉ học',
    message: 'Kính gửi Phụ huynh/Học viên,\n\nTrung tâm xin thông báo lịch học sẽ thay đổi như sau:\n\n[Điền thông tin nghỉ/đổi lịch]\n\nMọi thắc mắc liên hệ: 0901 234 567\n\nTrân trọng,\nAscent Music Center',
  },
  material: {
    title: '📁 Tài liệu học tập mới',
    message: 'Kính gửi Học viên,\n\nGiáo viên vừa cập nhật tài liệu mới trên hệ thống. Vui lòng đăng nhập app để xem và tải về.\n\nLink: ascent-music.netlify.app\n\nTrân trọng,\nAscent Music Center',
  },
  general: { title: '', message: '' },
};

const NotificationPage = () => {
  const [tab, setTab]                     = useState('custom');
  const [type, setType]                   = useState('general');
  const [recipient, setRecipient]         = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [title, setTitle]                 = useState('');
  const [message, setMessage]             = useState('');
  const [sending, setSending]             = useState(false);
  const [history, setHistory]             = useState([]);

  // Load lịch sử từ API
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await api.get('/notifications/history');
        setHistory(data.rows || []);
      } catch {
        setHistory([]);
      }
    };
    loadHistory();
  }, []);

  const getRecipientCount = () => {
    if (recipient === 'all')      return SAMPLE_USERS.length;
    if (recipient === 'students') return SAMPLE_USERS.filter(u => u.role === 'student').length;
    if (recipient === 'teachers') return SAMPLE_USERS.filter(u => u.role === 'teacher').length;
    if (recipient === 'specific') return selectedUsers.length;
    return 0;
  };

  const applyTemplate = (t) => {
    setType(t);
    setTitle(TEMPLATES[t].title);
    setMessage(TEMPLATES[t].message);
    setTab('compose');
  };

  const toggleUser = (id) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  // Gửi lưu vào DB (không cần Zalo)
  const handleSaveDB = async () => {
    if (!title)   { toast.error('Vui lòng nhập tiêu đề!'); return; }
    if (!message) { toast.error('Vui lòng nhập nội dung!'); return; }
    if (recipient === 'specific' && selectedUsers.length === 0) {
      toast.error('Vui lòng chọn người nhận!'); return;
    }
    setSending(true);
    try {
      await api.post('/notifications', {
        title,
        message,
        recipient,
        specific_ids: recipient === 'specific' ? selectedUsers : [],
      });
      toast.success(`✅ Đã gửi thông báo cho ${getRecipientCount()} người!`);
      // Reload lịch sử
      const data = await api.get('/notifications/history');
      setHistory(data.rows || []);
      setTitle(''); setMessage(''); setSelectedUsers([]);
      setTab('history');
    } catch {
      toast.error('Gửi thất bại! Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  // Gửi qua Zalo (giữ nguyên)
  const handleSendZalo = async () => {
    if (!title)   { toast.error('Vui lòng nhập tiêu đề!'); return; }
    if (!message) { toast.error('Vui lòng nhập nội dung!'); return; }
    setSending(true);
    try {
      await api.post('/notifications', {
        title,
        message,
        recipient,
        specific_ids: recipient === 'specific' ? selectedUsers : [],
      });
      toast.success(`✅ Đã gửi qua Zalo cho ${getRecipientCount()} người!`);
      const data = await api.get('/notifications/history');
      setHistory(data.rows || []);
      setTitle(''); setMessage(''); setSelectedUsers([]);
      setTab('history');
    } catch {
      toast.error('Gửi thất bại!');
    } finally {
      setSending(false);
    }
  };

  const TABS = [
    { key: 'custom',  label: '✍️ Soạn tự do'                    },
    { key: 'compose', label: '📋 Dùng mẫu'                      },
    { key: 'history', label: `🕐 Lịch sử (${history.length})`   },
  ];

  const SendPanel = () => (
    <div className="flex flex-col gap-4">
      {/* Người nhận */}
      <Card title="Người nhận">
        <div className="flex flex-col gap-2 mt-2">
          {RECIPIENTS.map(r => (
            <button key={r.value} onClick={() => setRecipient(r.value)}
              className={`p-3 rounded-xl text-sm text-left border transition-all
                ${recipient === r.value ? 'border-primary-500 bg-primary-50 font-medium' : 'border-gray-100 hover:bg-gray-50'}`}>
              {r.label}
            </button>
          ))}
        </div>
        {recipient === 'specific' && (
          <div className="mt-3 flex flex-col gap-2 max-h-48 overflow-y-auto">
            {SAMPLE_USERS.map(u => (
              <label key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={selectedUsers.includes(u.id)}
                  onChange={() => toggleUser(u.id)} className="w-4 h-4 accent-orange-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.phone}</p>
                </div>
                <Badge label={u.role === 'student' ? 'HV' : 'GV'}
                  variant={u.role === 'student' ? 'green' : 'blue'} />
              </label>
            ))}
          </div>
        )}
      </Card>

      {/* Xem trước & Gửi */}
      <Card title="Xem trước & Gửi">
        <div className="flex flex-col gap-3 mt-2">
          <div className="p-3 bg-blue-50 rounded-xl flex items-center gap-2">
            <span className="text-lg">👥</span>
            <div>
              <p className="text-xs text-blue-600 font-medium">Số người nhận</p>
              <p className="text-sm text-blue-700 font-semibold">{getRecipientCount()} người</p>
            </div>
          </div>
          {title && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Tiêu đề</p>
              <p className="text-sm font-medium text-gray-800">{title}</p>
            </div>
          )}
          {message && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Nội dung</p>
              <p className="text-sm text-gray-700 line-clamp-3">{message}</p>
            </div>
          )}

          {/* Nút gửi lưu DB */}
          <Button fullWidth loading={sending} icon="💾" onClick={handleSaveDB}
            variant="primary">
            Lưu & Gửi thông báo
          </Button>

          {/* Nút gửi Zalo */}
          <Button fullWidth loading={sending} icon="📨" onClick={handleSendZalo}
            variant="outline">
            Gửi ngay qua Zalo
          </Button>
          <p className="text-xs text-gray-400 text-center">
            ⚠️ Zalo cần cấu hình OA Token
          </p>
        </div>
      </Card>
    </div>
  );

  return (
    <MainLayout title="Gửi thông báo">
      <div className="flex gap-2 mb-5 border-b border-gray-100">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all
              ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'custom' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card title="✍️ Soạn thông báo theo ý bạn">
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    className="input-field" placeholder="Nhập tiêu đề bất kỳ..." />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)}
                    rows={10} className="input-field resize-none"
                    placeholder="Nhập nội dung thông báo..." />
                  <div className="flex justify-between">
                    <p className="text-xs text-gray-400">{message.length} ký tự</p>
                    <button onClick={() => { setTitle(''); setMessage(''); }}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                      🗑️ Xóa trắng
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <SendPanel />
        </div>
      )}

      {tab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card title="Chọn mẫu thông báo">
              <div className="grid grid-cols-2 gap-2 mt-2">
                {NOTIF_TYPES.map(t => (
                  <button key={t.value} onClick={() => applyTemplate(t.value)}
                    className={`p-3 rounded-xl text-sm font-medium border text-left transition-all
                      ${type === t.value ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </Card>
            <Card title="Nội dung (có thể chỉnh sửa)">
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    className="input-field" placeholder="Tiêu đề..." />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Nội dung</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)}
                    rows={8} className="input-field resize-none" placeholder="Nội dung..." />
                  <p className="text-xs text-gray-400 text-right">{message.length} ký tự</p>
                </div>
              </div>
            </Card>
          </div>
          <SendPanel />
        </div>
      )}

      {tab === 'history' && (
        <div className="flex flex-col gap-3">
          {history.length === 0 ? (
            <Card>
              <p className="text-center text-gray-400 py-10">Chưa có thông báo nào được gửi</p>
            </Card>
          ) : (
            history.map((h, i) => (
              <Card key={h.id || i}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {h.type === 'tuition' ? '💰' : h.type === 'dayoff' ? '📅' : h.type === 'material' ? '📁' : '📢'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{h.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        👥 {h.recipient} · 🕐 {new Date(h.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <Badge label="Đã gửi" variant="green" dot />
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </MainLayout>
  );
};

export default NotificationPage;