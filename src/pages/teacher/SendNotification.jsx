import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const TEMPLATES = [
  { label: '📁 Tài liệu mới', title: 'Tài liệu mới',  message: 'Thầy/Cô vừa đăng tài liệu mới lên hệ thống. Vui lòng đăng nhập app để xem nhé!' },
  { label: '📅 Đổi lịch',     title: 'Thay đổi lịch học', message: 'Thầy/Cô xin thông báo lịch học có thay đổi. Vui lòng cập nhật lịch.' },
  { label: '📝 Bài tập',      title: 'Nhắc bài tập',  message: 'Nhắc nhở bài tập. Vui lòng luyện tập trước buổi học tiếp theo nhé!' },
];

const SendNotification = () => {
  const { user }      = useAuth();
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [title, setTitle]       = useState('');
  const [message, setMessage]   = useState('');
  const [sending, setSending]   = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const teacherByUser = await api.get(`/teachers/by-user/${user?.id}`);
        const tid = teacherByUser.row?.id;
        if (!tid) return;
        const classes = await api.get('/classes');
        const myClasses = (classes.rows || []).filter(c => c.teacher_id === tid);
        const studentSet = new Set();
        const studentList = [];
        for (const cls of myClasses) {
          const data = await api.get(`/classes/${cls.id}/students`);
          (data.rows || []).forEach(s => {
            if (!studentSet.has(s.id)) {
              studentSet.add(s.id);
              studentList.push({ ...s, class_name: cls.name });
            }
          });
        }
        setStudents(studentList);
      } catch (err) { console.error(err.message); }
    };
    fetchStudents();
  }, [user]);

  const toggleAll = () => {
    if (selectAll) { setSelected([]); setSelectAll(false); }
    else { setSelected(students.map(s => s.id)); setSelectAll(true); }
  };

  const toggleStudent = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSend = async () => {
    if (!title)              { toast.error('Nhập tiêu đề!');                   return; }
    if (!message)            { toast.error('Nhập nội dung thông báo!');         return; }
    if (selected.length === 0) { toast.error('Chọn ít nhất 1 học viên!');       return; }
    setSending(true);
    try {
      await api.post('/notifications', {
        title,
        message,
        recipient:    'specific',
        specific_ids: selected,
      });
      toast.success(`✅ Đã gửi thông báo cho ${selected.length} học viên!`);
      setTitle('');
      setMessage('');
      setSelected([]);
      setSelectAll(false);
    } catch (err) { toast.error(err.message); }
    finally { setSending(false); }
  };

  return (
    <MainLayout title="Gửi thông báo học viên">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Chọn học viên */}
        <Card title="Chọn học viên" subtitle={`${selected.length}/${students.length} người`}
          action={
            <button onClick={toggleAll}
              className="text-sm text-primary-600 hover:underline font-medium">
              {selectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          }>
          <div className="flex flex-col gap-2 mt-3">
            {students.length === 0 ? (
              <p className="text-center text-gray-400 py-5">Không có học viên</p>
            ) : students.map(s => (
              <label key={s.id}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all
                  ${selected.includes(s.id) ? 'border-primary-300 bg-primary-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                <input type="checkbox" checked={selected.includes(s.id)}
                  onChange={() => toggleStudent(s.id)}
                  className="w-4 h-4 accent-orange-500" />
                <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                  {s.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.class_name} · {s.phone}</p>
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
                <button key={i} onClick={() => { setTitle(t.title); setMessage(t.message); }}
                  className="text-left p-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-sm transition-all">
                  {t.label}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Nội dung">
            <div className="flex flex-col gap-3 mt-2">
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="input-field" placeholder="Tiêu đề thông báo..." />
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                rows={5} className="input-field resize-none"
                placeholder="Nhập nội dung..." />
              <p className="text-xs text-gray-400 text-right">{message.length} ký tự</p>
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-700">
                  📨 Thông báo gửi vào app cho <strong>{selected.length} học viên</strong>
                </p>
              </div>
              <Button fullWidth loading={sending} icon="📨" onClick={handleSend}>
                Gửi thông báo ({selected.length})
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default SendNotification;