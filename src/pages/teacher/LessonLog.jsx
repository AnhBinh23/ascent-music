import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { toast } from 'react-toastify';

const SAMPLE_CLASSES = [
  { id: 'LH001', name: 'Piano cơ bản 01', students: ['Nguyễn Văn An'] },
  { id: 'LH002', name: 'Guitar nhóm 01',  students: ['Trần Thị Bình', 'Lê Minh Châu', 'Hoàng Văn Em'] },
];

const SAMPLE_LOGS = [
  { id: 1, classId: 'LH001', date: '2025-05-19', content: 'Luyện gam Đô trưởng, bài số 5', skill: 'Ngón tay linh hoạt hơn', weakness: 'Còn yếu tay trái', progress: 'Tiến bộ tốt', rating: '⭐⭐⭐⭐' },
  { id: 2, classId: 'LH002', date: '2025-05-18', content: 'Hợp âm cơ bản C, G, Am', skill: 'Chuyển hợp âm nhanh', weakness: 'Tiếng đàn chưa đều', progress: 'Ổn định', rating: '⭐⭐⭐' },
];

const EMPTY_FORM = { date: new Date().toISOString().split('T')[0], content: '', skill: '', weakness: '', progress: '', rating: '⭐⭐⭐', homework: '' };

const LessonLog = () => {
  const [selectedClass, setSelectedClass] = useState(SAMPLE_CLASSES[0]);
  const [logs, setLogs] = useState(SAMPLE_LOGS);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const classLogs = logs.filter(l => l.classId === selectedClass?.id);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.content) { toast.error('Vui lòng nhập nội dung buổi học!'); return; }
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      setLogs(prev => [{ id: Date.now(), classId: selectedClass.id, ...form }, ...prev]);
      toast.success('Lưu nhật ký thành công!');
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch { toast.error('Có lỗi xảy ra!'); }
    finally { setSaving(false); }
  };

  return (
    <MainLayout title="Nhật ký học tập">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chọn lớp */}
        <Card title="Lớp học">
          <div className="flex flex-col gap-2">
            {SAMPLE_CLASSES.map(cls => (
              <button key={cls.id} onClick={() => setSelectedClass(cls)}
                className={`text-left p-3 rounded-xl border transition-all
                  ${selectedClass?.id === cls.id ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                <p className="text-sm font-medium text-gray-800">{cls.name}</p>
                <p className="text-xs text-gray-500">{cls.students.join(', ')}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Nhật ký */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{classLogs.length} nhật ký</p>
            <Button icon="➕" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Đóng' : 'Thêm nhật ký'}
            </Button>
          </div>

          {/* Form thêm */}
          {showForm && (
            <Card title="Nhật ký buổi học mới">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Ngày học</label>
                    <input type="date" name="date" value={form.date}
                      onChange={handleChange} className="input-field" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Đánh giá</label>
                    <select name="rating" value={form.rating} onChange={handleChange} className="input-field">
                      {['⭐','⭐⭐','⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Nội dung đã học <span className="text-red-500">*</span></label>
                  <textarea name="content" value={form.content} onChange={handleChange}
                    rows={2} className="input-field resize-none" placeholder="Hôm nay học gì..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Kỹ năng đạt được</label>
                    <textarea name="skill" value={form.skill} onChange={handleChange}
                      rows={2} className="input-field resize-none" placeholder="Điểm tốt..." />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Điểm yếu cần luyện</label>
                    <textarea name="weakness" value={form.weakness} onChange={handleChange}
                      rows={2} className="input-field resize-none" placeholder="Cần cải thiện..." />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Nhận xét tiến bộ</label>
                  <textarea name="progress" value={form.progress} onChange={handleChange}
                    rows={2} className="input-field resize-none" placeholder="Nhận xét chung..." />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Bài tập về nhà</label>
                  <textarea name="homework" value={form.homework} onChange={handleChange}
                    rows={2} className="input-field resize-none" placeholder="Bài tập giao về nhà..." />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Hủy</Button>
                  <Button type="submit" loading={saving} icon="💾">Lưu nhật ký</Button>
                </div>
              </form>
            </Card>
          )}

          {/* Danh sách nhật ký */}
          {classLogs.length === 0 ? (
            <Card><p className="text-center text-gray-400 py-8">Chưa có nhật ký nào</p></Card>
          ) : (
            classLogs.map(log => (
              <Card key={log.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">📅 {log.date}</span>
                    <Badge label={log.rating} variant="orange" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs font-medium text-blue-600 mb-1">📖 Nội dung học</p>
                    <p className="text-gray-700">{log.content}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <p className="text-xs font-medium text-green-600 mb-1">✅ Kỹ năng đạt được</p>
                    <p className="text-gray-700">{log.skill || '—'}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl">
                    <p className="text-xs font-medium text-red-600 mb-1">⚠️ Cần cải thiện</p>
                    <p className="text-gray-700">{log.weakness || '—'}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <p className="text-xs font-medium text-purple-600 mb-1">📝 Bài tập về nhà</p>
                    <p className="text-gray-700">{log.homework || '—'}</p>
                  </div>
                </div>
                {log.progress && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-500 mb-1">💬 Nhận xét tiến bộ</p>
                    <p className="text-sm text-gray-700">{log.progress}</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default LessonLog;