import api from './api';

const aiService = {
  // ① Trợ lý Admin/Giáo viên
  ask: async (question) => {
    const res = await api.post('/ai/assistant', { question });
    return res.answer;
  },
  // ② Trợ lý Giáo viên  ← THÊM MỚI
teacherChat: async (question) => {
  const res = await api.post('/ai/teacher-chat', { question });
  return res.answer;
},

  // ② Chatbot phụ huynh
  parentChat: async (question) => {
    const res = await api.post('/ai/parent-chat', { question });
    return res.answer;
  },

  // ③ Nhận xét học viên
  feedback: async (data) => {
    const res = await api.post('/ai/feedback', data);
    return res.feedback;
  },

  // ④ Phân tích báo cáo
  analyzeReport: async () => {
    const res = await api.post('/ai/report', {});
    return res.analysis;
  },

  // ⑤ Soạn thông báo
  compose: async (input, tone, recipient) => {
    const res = await api.post('/ai/compose', { input, tone, recipient });
    return res.text;
  },
};

export default aiService;