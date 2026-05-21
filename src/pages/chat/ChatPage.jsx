import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';

const CONTACTS = {
  admin:   [
    { id: 'GV001', name: 'Nguyễn Thị Mai',  role: 'teacher', avatar: 'M' },
    { id: 'GV002', name: 'Trần Văn Hùng',   role: 'teacher', avatar: 'H' },
    { id: 'HV001', name: 'Nguyễn Văn An',   role: 'student', avatar: 'A' },
    { id: 'HV002', name: 'Trần Thị Bình',   role: 'student', avatar: 'B' },
  ],
  teacher: [
    { id: 'ADM', name: 'Admin Trung tâm',   role: 'admin',   avatar: 'A' },
    { id: 'HV001', name: 'Nguyễn Văn An',   role: 'student', avatar: 'A' },
    { id: 'HV002', name: 'Trần Thị Bình',   role: 'student', avatar: 'B' },
  ],
  student: [
    { id: 'ADM', name: 'Admin Trung tâm',   role: 'admin',   avatar: 'A' },
    { id: 'GV001', name: 'Nguyễn Thị Mai',  role: 'teacher', avatar: 'M' },
  ],
  staff: [
    { id: 'ADM', name: 'Admin Trung tâm',   role: 'admin',   avatar: 'A' },
  ],
};

const ROLE_COLOR = { admin: 'bg-red-100 text-red-700', teacher: 'bg-blue-100 text-blue-700', student: 'bg-green-100 text-green-700' };
const ROLE_LABEL = { admin: 'Admin', teacher: 'Giáo viên', student: 'Học viên' };

const SAMPLE_MESSAGES = {
  GV001: [
    { id: 1, from: 'GV001', text: 'Chào Admin! Tuần này lịch dạy có thay đổi gì không ạ?', time: '09:15' },
    { id: 2, from: 'me',    text: 'Chào cô Mai! Lịch vẫn giữ nguyên nhé.', time: '09:17' },
    { id: 3, from: 'GV001', text: 'Dạ em hiểu rồi, cảm ơn Admin!', time: '09:18' },
  ],
};

const ChatPage = () => {
  const { user } = useAuth();
  const [selected, setSelected]   = useState(null);
  const [messages, setMessages]   = useState({});
  const [input, setInput]         = useState('');
  const messagesEndRef             = useRef(null);
  const contacts = CONTACTS[user?.role] || [];

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`chat_${user?.id}`) || '{}');
    setMessages({ ...SAMPLE_MESSAGES, ...saved });
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selected]);

  const sendMessage = () => {
    if (!input.trim() || !selected) return;
    const msg = {
      id:   Date.now(),
      from: 'me',
      text: input.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = { ...messages, [selected.id]: [...(messages[selected.id] || []), msg] };
    setMessages(updated);
    localStorage.setItem(`chat_${user?.id}`, JSON.stringify(updated));
    setInput('');
  };

  const getLastMsg = (contactId) => {
    const msgs = messages[contactId];
    if (!msgs || msgs.length === 0) return 'Chưa có tin nhắn';
    return msgs[msgs.length - 1].text;
  };

  const currentMsgs = selected ? (messages[selected.id] || []) : [];

  return (
    <MainLayout title="Tin nhắn nội bộ">
      <div className="flex gap-4 h-[calc(100vh-140px)]">

        {/* Danh sách liên hệ */}
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <p className="font-semibold text-gray-800 text-sm">Tin nhắn</p>
          </div>
          {contacts.map(c => (
            <button key={c.id} onClick={() => setSelected(c)}
              className={`w-full flex items-center gap-3 p-4 text-left border-b border-gray-50 transition-all hover:bg-gray-50
                ${selected?.id === c.id ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                ${ROLE_COLOR[c.role] || 'bg-gray-100 text-gray-700'}`}>
                {c.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                <p className="text-xs text-gray-400 truncate">{getLastMsg(c.id)}</p>
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${ROLE_COLOR[c.role]}`}>
                {ROLE_LABEL[c.role]}
              </span>
            </button>
          ))}
        </div>

        {/* Khung chat */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Header chat */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  ${ROLE_COLOR[selected.role]}`}>
                  {selected.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{selected.name}</p>
                  <p className="text-xs text-gray-500">{ROLE_LABEL[selected.role]} · 🟢 Đang hoạt động</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {currentMsgs.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-3xl mb-2">💬</p>
                    <p className="text-sm text-gray-400">Bắt đầu cuộc trò chuyện với {selected.name}</p>
                  </div>
                ) : (
                  currentMsgs.map(msg => (
                    <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm
                        ${msg.from === 'me'
                          ? 'bg-primary-600 text-white rounded-tr-sm'
                          : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                        <p>{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.from === 'me' ? 'text-primary-200' : 'text-gray-400'}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  className="input-field flex-1"
                  placeholder={`Nhắn tin cho ${selected.name}...`} />
                <button onClick={sendMessage}
                  disabled={!input.trim()}
                  className="w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors text-lg">
                  ➤
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <p className="text-5xl mb-4">💬</p>
              <p className="font-semibold text-gray-700">Chọn người để nhắn tin</p>
              <p className="text-sm text-gray-400 mt-1">Giao tiếp nhanh trong nội bộ trung tâm</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;