import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ROLE_COLOR = {
  admin:   { bg: '#ef4444', light: '#fee2e2' },
  teacher: { bg: '#3b82f6', light: '#dbeafe' },
  student: { bg: '#22c55e', light: '#dcfce7' },
  staff:   { bg: '#f97316', light: '#ffedd5' },
};
const ROLE_LABEL = { admin: 'Admin', teacher: 'Giáo viên', student: 'Học viên', staff: 'Nhân viên' };

const ChatPage = () => {
  const { user }  = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const pollRef        = useRef(null);
  const inputRef       = useRef(null);

  useEffect(() => {
    api.get('/auth/users').then(d => setAllUsers(d.rows || [])).catch(() => {});
    loadContacts();
  }, [user]);

  // Poll tổng số chưa đọc mỗi 5 giây
  useEffect(() => {
    const loadUnread = async () => {
      try {
        const data = await api.get('/messages/unread-count');
        setTotalUnread(data.count || 0);
      } catch {}
    };
    loadUnread();
    const interval = setInterval(loadUnread, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadContacts = async () => {
    try {
      const data = await api.get('/messages');
      setContacts(data.rows || []);
    } catch {}
  };

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
      // Reload contacts để cập nhật unread count
      await loadContacts();
    } catch {}
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = inputRef.current?.value?.trim();
    if (!text || !selected) return;
    const contactId = selected.contact_id || selected.id;
    inputRef.current.value = '';
    inputRef.current.focus();
    try {
      await api.post('/messages', { to_id: contactId, message: text });
      await loadMessages(contactId);
    } catch (err) {
      inputRef.current.value = text;
      console.error(err.message);
    }
  };

  const contactList = [
    ...contacts,
    ...allUsers.filter(u =>
      u.id !== user?.id &&
      !contacts.find(c => c.contact_id === u.id)
    ).map(u => ({ contact_id: u.id, name: u.name, role: u.role, last_message: '', unread_count: 0 }))
  ];

  const color = (role) => ROLE_COLOR[role] || { bg: '#6b7280', light: '#f3f4f6' };

  if (selected) {
    return (
      <div className="flex flex-col bg-gray-50" style={{ height: '100dvh' }}>
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
          <button onClick={() => { setSelected(null); clearInterval(pollRef.current); loadContacts(); }}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-xl flex-shrink-0">
            ←
          </button>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
            style={{ backgroundColor: color(selected.role).bg }}>
            {selected.name?.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800 text-sm">{selected.name}</p>
            <p className="text-xs" style={{ color: color(selected.role).bg }}>{ROLE_LABEL[selected.role]}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3"
                style={{ backgroundColor: color(selected.role).bg }}>
                {selected.name?.charAt(0)}
              </div>
              <p className="font-semibold text-gray-700">{selected.name}</p>
              <p className="text-sm text-gray-400 mt-4">Bắt đầu cuộc trò chuyện!</p>
            </div>
          ) : messages.map((msg, i) => {
            const isMine = msg.from_id === user?.id;
            const showTime = i === messages.length - 1 ||
              new Date(messages[i+1]?.created_at) - new Date(msg.created_at) > 60000;
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div className="max-w-[75%] px-4 py-2.5 text-sm rounded-2xl"
                  style={{
                    backgroundColor: isMine ? '#ea580c' : '#f3f4f6',
                    color: isMine ? 'white' : '#1f2937',
                    borderBottomRightRadius: isMine ? '4px' : '16px',
                    borderBottomLeftRadius: isMine ? '16px' : '4px',
                  }}>
                  {msg.message}
                </div>
                {showTime && (
                  <p className="text-xs text-gray-400 mt-1 mx-1">
                    {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-3 py-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <input
            ref={inputRef}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Aa"
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none"
          />
          <button onClick={sendMessage}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
            style={{ backgroundColor: '#ea580c' }}>
            ➤
          </button>
        </div>
      </div>
    );
  }

  return (
    <MainLayout title={`Tin nhắn${totalUnread > 0 ? ` (${totalUnread})` : ''}`}>
      <div className="flex flex-col gap-1">
        {contactList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">💬</p>
            <p className="font-semibold text-gray-700">Chưa có tin nhắn</p>
          </div>
        ) : contactList.map(c => (
          <button key={c.contact_id || c.id}
            onClick={() => setSelected(c)}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-100 transition-all text-left w-full">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-base"
                style={{ backgroundColor: color(c.role).bg }}>
                {c.name?.charAt(0)}
              </div>
              {/* Badge chưa đọc */}
              {c.unread_count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {c.unread_count > 9 ? '9+' : c.unread_count}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${c.unread_count > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                {c.name}
              </p>
              <p className={`text-xs truncate mt-0.5 ${c.unread_count > 0 ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>
                {c.last_message || 'Bắt đầu trò chuyện'}
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
              style={{ backgroundColor: color(c.role).light, color: color(c.role).bg }}>
              {ROLE_LABEL[c.role]}
            </span>
          </button>
        ))}
      </div>
    </MainLayout>
  );
};

export default ChatPage;