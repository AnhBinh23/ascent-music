import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ROLE_COLOR = {
  admin:   'bg-red-100 text-red-700',
  teacher: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
  staff:   'bg-orange-100 text-orange-700',
};
const ROLE_LABEL = { admin: 'Admin', teacher: 'Giáo viên', student: 'Học viên', staff: 'Nhân viên' };

const ChatPage = () => {
  const { user }    = useAuth();
  const [contacts, setContacts]   = useState([]);
  const [selected, setSelected]   = useState(null);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [allUsers, setAllUsers]   = useState([]);
  const messagesEndRef             = useRef(null);
  const pollRef                    = useRef(null);

  // Load tất cả users để chọn chat mới
  useEffect(() => {
    api.get('/auth/users').then(d => setAllUsers(d.rows || [])).catch(() => {});
    loadContacts();
  }, [user]);

  const loadContacts = async () => {
    try {
      const data = await api.get('/messages');
      setContacts(data.rows || []);
    } catch {}
  };

  // Load tin nhắn và polling mỗi 3 giây
  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.contact_id || selected.id);
    pollRef.current = setInterval(() => {
      loadMessages(selected.contact_id || selected.id);
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [selected]);

  const loadMessages = async (contactId) => {
    try {
      const data = await api.get(`/messages/${contactId}`);
      setMessages(data.rows || []);
    } catch {}
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selected) return;
    const contactId = selected.contact_id || selected.id;
    try {
      await api.post('/messages', { to_id: contactId, message: input.trim() });
      setInput('');
      await loadMessages(contactId);
      await loadContacts();
    } catch (err) { console.error(err.message); }
  };

  // Danh sách contacts = có tin nhắn + tất cả users
  const contactList = [
    ...contacts,
    ...allUsers.filter(u =>
      u.id !== user?.id &&
      !contacts.find(c => c.contact_id === u.id)
    ).map(u => ({ contact_id: u.id, name: u.name, role: u.role, last_message: '' }))
  ];

  return (
    <MainLayout title="Tin nhắn nội bộ">
      <div className="flex gap-4 h-[calc(100vh-140px)]">

        {/* Danh sách liên hệ */}
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <p className="font-semibold text-gray-800 text-sm">Tin nhắn</p>
          </div>
          {contactList.map(c => (
            <button key={c.contact_id || c.id} onClick={() => setSelected(c)}
              className={`w-full flex items-center gap-3 p-4 text-left border-b border-gray-50 transition-all hover:bg-gray-50
                ${selected?.contact_id === c.contact_id ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                ${ROLE_COLOR[c.role] || 'bg-gray-100 text-gray-700'}`}>
                {c.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                <p className="text-xs text-gray-400 truncate">{c.last_message || 'Bắt đầu trò chuyện'}</p>
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
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  ${ROLE_COLOR[selected.role]}`}>
                  {selected.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{selected.name}</p>
                  <p className="text-xs text-gray-500">{ROLE_LABEL[selected.role]}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-3xl mb-2">💬</p>
                    <p className="text-sm text-gray-400">Bắt đầu cuộc trò chuyện!</p>
                  </div>
                ) : messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm
                      ${msg.from_id === user?.id
                        ? 'bg-primary-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                      <p>{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.from_id === user?.id ? 'text-primary-200' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

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