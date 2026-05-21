import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const MY_STUDENTS = [
  { id: 'HV001', name: 'Nguyễn Văn An',  class: 'Piano cơ bản 01', phone: '0901234567' },
  { id: 'HV002', name: 'Hoàng Văn Em',   class: 'Piano nâng cao',  phone: '0945678901' },
  { id: 'HV003', name: 'Trần Thị Bình',  class: 'Guitar nhóm 01',  phone: '0912345678' },
];

const TEMPLATES = [
  { label: '📁 Tài liệu mới', message: 'Thầy/Cô vừa đăng tài liệu mới lên hệ thống. Vui lòng đăng nhập app để xem nhé!' },
  { label: '📅 Đổi lịch',     message: 'Thầy/Cô xin thông báo lịch học có thay đổi: [Điền thông tin]. Vui lòng cập nhật lịch.' },
  { label: '📝 Bài tập',      message: 'Nhắc nhở bài tập: [Tên bài]. Vui lòng luyện tập trước buổi học tiếp theo nhé!' },
];

const SendNotification = () => {
  useAuth();
  const [selected, setSelected] = useState([]);
  const [message, setMessage]   = useState('');
  const [sending, setSending]   = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const toggleAll = () => {
    if (selectAll) { setSelected([]); setSelectAll(false); }
    else { setSelected(MY_STUDENTS.map(s => s.id)); setSelectAll(true); }
  };

  const toggleStudent = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSend = async () => {
    if (!message) { toast.error('Nhập nội dung thông báo!'); return; }
    if (selected.length === 0) { toast.error('Chọn ít nhất 1 học viên!'); return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success(`✅ Đã gửi Zalo cho ${selected.length} học viên!`);
    setMessage('');
    setSelected([]);
    setSelectAll(false);
    setSending(false);
  };

  return (
    <MainLayout title="Gửi thông báo học viên">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Chọn học viên */}
        <Card title="Chọn học viên" subtitle={`${selected.length}/${MY_STUDENTS.length} người`}
          action={
            <button onClick={toggleAll}
              className="text-sm text-primary-600 hover:underline font-medium">
              {selectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          }>
          <div className="flex flex-col gap-2 mt-3">
            {MY_STUDENTS.map(s => (
              <label key={s.id}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all
                  ${selected.includes(s.id) ? 'border-primary-300 bg-primary-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                <input type="checkbox" checked={selected.includes(s.id)}
                  onChange={() => toggleStudent(s.id)}
                  className="w-4 h-4 accent-orange-500" />
                <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.class} · {s.phone}</p>
                </div>
                {selected.includes(s.id) && <span className="text-green-500">✓</span>}
              </label>
            ))}
          </div>
        </Card>

        {/* Soạn nội dung */}
        <div className="flex flex-col gap-4">
          <Card title="Mẫu thông báo nhanh">
            <div className="flex flex-col gap-2 mt-2">
              {TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => setMessage(t.message)}
                  className="text-left p-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-sm transition-all">
                  {t.label}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Nội dung">
            <div className="flex flex-col gap-3 mt-2">
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                rows={6} className="input-field resize-none"
                placeholder="Nhập nội dung gửi cho học viên..." />
              <p className="text-xs text-gray-400 text-right">{message.length} ký tự</p>

              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-700">
                  📨 Tin nhắn sẽ được gửi qua <strong>Zalo</strong> đến {selected.length} học viên
                </p>
              </div>

              <Button fullWidth loading={sending} icon="📨" onClick={handleSend}>
                Gửi qua Zalo ({selected.length})
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default SendNotification;