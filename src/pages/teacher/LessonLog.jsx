import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const RATINGS = [
  { value: 1, label: '⭐',         desc: 'Yếu'      },
  { value: 2, label: '⭐⭐',       desc: 'TB'        },
  { value: 3, label: '⭐⭐⭐',     desc: 'Khá'       },
  { value: 4, label: '⭐⭐⭐⭐',   desc: 'Tốt'       },
  { value: 5, label: '⭐⭐⭐⭐⭐', desc: 'Xuất sắc'  },
];

const EMPTY = {
  class_id: '', date: new Date().toISOString().split('T')[0],
  content: '', skill: '', weakness: '', progress: '', homework: '', rating: 3,
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN');
};

const LessonLog = () => {
  const { user }      = useAuth();
  const [logs, setLogs]           = useState([]);
  const [classes, setClasses]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [filterClass, setFilterClass] = useState('all');
  const [teacherId, setTeacherId] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const teacherByUser = await api.get(`/teachers/by-user/${user?.id}`);
        const tid = teacherByUser.row?.id || user?.id;
        setTeacherId(tid);

        const [classData, logData] = await Promise.all([
          api.get('/classes'),
          api.get(`/lesson-logs/teacher/${tid}`),
        ]);
        setClasses(classData.rows || []);
        setLogs(logData.rows || []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const reloadLogs = async () => {
    const logData = await api.get(`/lesson-logs/teacher/${teacherId}`);
    setLogs(logData.rows || []);
  };

  const handleSave = async () => {
    if (!form.class_id || !form.content) {
      toast.error('Chọn lớp và nhập nội dung!'); return;
    }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/lesson-logs/${editId}`, form);
        toast.success('Cập nhật nhật ký thành công!');
      } else {
        await api.post('/lesson-logs', { ...form, teacher_id: teacherId });
        toast.success('Lưu nhật ký thành công!');
      }
      await reloadLogs();
      setShowModal(false);
      setForm(EMPTY);
      setEditId(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa nhật ký này?')) return;
    try {
      await api.delete(`/lesson-logs/${id}`);
      setLogs(prev => prev.filter(l => l.id !== id));
      toast.success('Đã xóa!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = (log) => {
    setForm({
      class_id: log.class_id,
      date:     log.date?.split('T')[0] || log.date,
      content:  log.content  || '',
      skill:    log.skill    || '',
      weakness: log.weakness || '',
      progress: log.progress || '',
      homework: log.homework || '',
      rating:   log.rating   || 3,
    });
    setEditId(log.id);
    setShowModal(true);
  };

  const filtered = filterClass === 'all'
    ? logs
    : logs.filter(l => l.class_id === filterClass);

  if (loading) return (
    <MainLayout title="Nhật ký học tập">
      <p className="text-center text-gray-400 py-20">Đang tải...</p>
    </MainLayout>
  );

  return (
    <MainLayout title="Nhật ký học tập">

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          className="input-field flex-1">
          <option value="all">Tất cả lớp ({logs.length})</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({logs.filter(l => l.class_id === c.id).length})
            </option>
          ))}
        </select>
        <Button icon="➕" onClick={() => { setForm(EMPTY); setEditId(null); setShowModal(true); }}>
          Thêm nhật ký
        </Button>
      </div>

      {/* Danh sách */}
      {filtered.length === 0 ? (
        <Card>
          <p className="text-center text-gray-400 py-10">Chưa có nhật ký nào</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(log => (
            <Card key={log.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-800">{log.class_name}</p>
                    <Badge label={`📅 ${formatDate(log.date)}`} variant="gray" />
                    <Badge label={RATINGS.find(r => r.value === Number(log.rating))?.label || '⭐⭐⭐'} variant="orange" />
                  </div>

                  {/* Tên học viên */}
                  {log.student_names && (
                    <p className="text-xs text-gray-500 mb-3">
                      👤 Học viên: <span className="font-medium text-gray-700">{log.student_names}</span>
                    </p>
                  )}

                  {/* Nội dung */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {log.content && (
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <p className="text-xs text-blue-600 font-medium mb-1">📚 Nội dung bài học</p>
                        <p className="text-gray-700">{log.content}</p>
                      </div>
                    )}
                    {log.skill && (
                      <div className="p-3 bg-green-50 rounded-xl">
                        <p className="text-xs text-green-600 font-medium mb-1">✅ Kỹ năng đạt được</p>
                        <p className="text-gray-700">{log.skill}</p>
                      </div>
                    )}
                    {log.weakness && (
                      <div className="p-3 bg-red-50 rounded-xl">
                        <p className="text-xs text-red-600 font-medium mb-1">⚠️ Điểm cần cải thiện</p>
                        <p className="text-gray-700">{log.weakness}</p>
                      </div>
                    )}
                    {log.progress && (
                      <div className="p-3 bg-purple-50 rounded-xl">
                        <p className="text-xs text-purple-600 font-medium mb-1">📈 Tiến độ</p>
                        <p className="text-gray-700">{log.progress}</p>
                      </div>
                    )}
                    {log.homework && (
                      <div className="p-3 bg-orange-50 rounded-xl sm:col-span-2">
                        <p className="text-xs text-orange-600 font-medium mb-1">📝 Bài tập về nhà</p>
                        <p className="text-gray-700">{log.homework}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(log)}>✏️</Button>
                  <Button size="sm" variant="ghost"     onClick={() => handleDelete(log.id)}>🗑️</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal thêm/sửa */}
      <Modal isOpen={showModal}
        onClose={() => { setShowModal(false); setForm(EMPTY); setEditId(null); }}
        title={editId ? 'Chỉnh sửa nhật ký' : 'Thêm nhật ký học'} size="lg"
        footer={<>
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(EMPTY); setEditId(null); }}>Hủy</Button>
          <Button loading={saving} icon="💾" onClick={handleSave}>Lưu nhật ký</Button>
        </>}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Lớp học <span className="text-red-500">*</span></label>
              <select value={form.class_id}
                onChange={e => setForm({ ...form, class_id: e.target.value })}
                className="input-field">
                <option value="">-- Chọn lớp --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Ngày học" name="date" type="date"
              value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>

          {/* Đánh giá */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Đánh giá buổi học</label>
            <div className="flex gap-2">
              {RATINGS.map(r => (
                <button key={r.value} type="button"
                  onClick={() => setForm({ ...form, rating: r.value })}
                  className={`flex-1 py-2 rounded-xl text-sm border transition-all
                    ${form.rating === r.value
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <p>{r.label}</p>
                  <p className="text-xs opacity-70">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {[
            { name: 'content',  label: '📚 Nội dung bài học', placeholder: 'Hôm nay học bài...',   required: true  },
            { name: 'skill',    label: '✅ Kỹ năng đạt được',  placeholder: 'Học viên đã biết...',  required: false },
            { name: 'weakness', label: '⚠️ Cần cải thiện',     placeholder: 'Cần luyện thêm...',   required: false },
            { name: 'progress', label: '📈 Tiến độ',           placeholder: 'Đã hoàn thành...',    required: false },
            { name: 'homework', label: '📝 Bài tập về nhà',     placeholder: 'Về nhà luyện...',    required: false },
          ].map(field => (
            <div key={field.name} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <textarea value={form[field.name]}
                onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                rows={2} className="input-field resize-none"
                placeholder={field.placeholder} />
            </div>
          ))}
        </div>
      </Modal>
    </MainLayout>
  );
};

export default LessonLog;