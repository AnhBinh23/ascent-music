import React, { useState, useRef, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import aiService from '../../services/aiService';

const QUICK_QUESTIONS = [
  'Lịch dạy tuần này của tôi?',
  'Học viên nào hay vắng nhất?',
  'Lớp nào của tôi có sĩ số ít nhất?',
  'Tiến độ học viên của tôi thế nào?',
  'Học viên nào chưa đóng học phí?',
  'Hôm nay tôi dạy lớp nào?',
];

const TeacherAIChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'Xin chào thầy/cô! Tôi là trợ lý AI của Ascent Music Center. Tôi có thể giúp thầy/cô xem lịch dạy, theo dõi tiến độ học viên, điểm danh và các thông tin lớp học. Hãy hỏi tôi nhé! 🎹',
    }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question) return;
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const answer = await aiService.teacherChat(question);
      setMessages(prev => [...prev, { role: 'ai', text: answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '❌ Lỗi kết nối. Vui lòng thử lại!' }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <MainLayout title="Trợ lý AI">
      <div className="flex flex-col" style={{ height: 'calc(100dvh - 120px)' }}>
        <div className="flex gap-2 flex-wrap mb-4">
          {QUICK_QUESTIONS.map((q, i) => (
            <button key={i} onClick={() => sendMessage(q)}
              className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full border border-primary-200 hover:bg-primary-100 transition-all">
              {q}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-4 pr-1">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-1">🤖</div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm mr-2">🤖</div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Hỏi về lịch dạy, học viên..."
            className="flex-1 resize-none outline-none text-sm py-1 bg-transparent"
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="w-9 h-9 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 transition-all disabled:opacity-50 flex-shrink-0 self-end mb-0.5">
            ➤
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default TeacherAIChat;
