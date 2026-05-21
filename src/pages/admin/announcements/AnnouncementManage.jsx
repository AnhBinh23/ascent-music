import React, { useState, useEffect } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { toast } from 'react-toastify';

const TYPES = [
  { value: 'holiday', label: '🎉 Ngày lễ',       variant: 'red'    },
  { value: 'dayoff',  label: '📅 Nghỉ học',       variant: 'orange' },
  { value: 'info',    label: '📢 Thông báo chung', variant: 'blue'   },
  { value: 'warning', label: '⚠️ Cảnh báo',        variant: 'yellow' },
  { value: 'success', label: '✅ Tin vui',          variant: 'green'  },
];

const QUICK_TEMPLATES = [
  {
    title: '🎉 Nghỉ lễ 30/4 - 1/5',
    message: 'Trung tâm xin thông báo nghỉ lễ Giải phóng miền Nam 30/4 và Quốc tế Lao động 1/5. Lịch học sẽ tiếp tục bình thường từ ngày 2/5.',
    type: 'holiday',
  },
  {
    title: '📅 Nghỉ Tết Nguyên Đán',
    message: 'Trung tâm nghỉ Tết Nguyên Đán. Chúc toàn thể học viên, phụ huynh và giáo viên năm mới an khang thịnh vượng!',
    type: 'holiday',
  },
  {
    title: '⚠️ Thay đổi lịch học',
    message: 'Do điều kiện cơ sở vật chất, lịch học tuần này có thay đổi. Vui lòng kiểm tra lịch học cá nhân.',
    type: 'warning',
  },
  {
    title: '📢 Khai giảng khóa mới',
    message: 'Trung tâm thông báo khai giảng khóa học mới. Đăng ký ngay để nhận ưu đãi học phí tháng đầu!',
    type: 'success',
  },
  {
    title: '🎉 Trung tâm nghỉ lễ Quốc Khánh 2/9',
    message: 'Nhân dịp Quốc khánh 2/9, trung tâm nghỉ học. Chúc mừng ngày Quốc khánh Việt Nam!',
    type: 'holiday',
  },
];

const EMPTY = {
  title: '', message: '', type: 'info',
  startDate: new Date().toISOString().split('T')[0],
  endDate:   new Date().toISOString().split('T')[0],
  showDate: true, dismissible: true, active: true,
};

const AnnouncementManage = () => {
  const [list, setList]         = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [editId, setEditId]     = useState(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('announcements') || '[]');
    if (data.length === 0) {
      // Mẫu sẵn
      const sample = [{
        id: 'sample1', title: '📢 Chào mừng đến Ascent Music!',
        message: 'Hệ thống quản lý Ascent Music đã sẵn sàng phục vụ. Chúc các bạn học tập vui vẻ!',
        type: 'success', startDate: '2025-01-01', endDate: '2099-12-31',
        showDate: false, dismissible: true, active: true,
        createdAt: new Date().toISOString(),
      }];
      localStorage.setItem('announcements', JSON.stringify(sample));
      setList(sample);
    } else {
      setList(data);
    }
  }, []);

 

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const applyTemplate = (tpl) => {
    const today = new Date().toISOString().split('T')[0];
    setForm(prev => ({ ...prev, ...tpl, startDate: today, endDate: today }));
  };

  const handleSave = async () => {
    if (!form.title)   { toast.error('Nhập tiêu đề!'); return; }
    if (!form.message) { toast.error('Nhập nội dung!'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));

    if (editId) {
      const updated = list.map(a => a.id === editId ? { ...form, id: editId } : a);
      setList(updated);
      localStorage.setItem('announcements', JSON.stringify(updated));
      toast.success('Cập nhật thông báo!');
    } else {
      const newItem = { ...form, id: `ANN_${Date.now()}`, createdAt: new Date().toISOString() };
      const updated = [newItem, ...list];
      setList(updated);
      localStorage.setItem('announcements', JSON.stringify(updated));
      toast.success('Đã đăng thông báo lên app!');
    }
    setShowModal(false);
    setForm(EMPTY);
    setEditId(null);
    setSaving(false);
  };

  const toggleActive = (id) => {
    const updated = list.map(a => a.id === id ? { ...a, active: !a.active } : a);
    setList(updated);
    localStorage.setItem('announcements', JSON.stringify(updated));
    const ann = updated.find(a => a.id === id);
    toast.success(ann.active ? '✅ Đã hiện thông báo!' : '⏸️ Đã ẩn thông báo!');
  };

  const handleEdit = (ann) => {
    setForm({ ...ann });
    setEditId(ann.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Xóa thông báo này?')) return;
    const updated = list.filter(a => a.id !== id);
    setList(updated);
    localStorage.setItem('announcements', JSON.stringify(updated));
    toast.success('Đã xóa!');
  };

  const now = new Date();
  const activeCount = list.filter(a => a.active && new Date(a.startDate) <= now && new Date(a.endDate) >= now).length;

  return (
    <MainLayout title="Quản lý thông báo App">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-xs text-gray-500 mt-1">Đang hiển thị</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{list.length}</p>
          <p className="text-xs text-gray-500 mt-1">Tổng thông báo</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-400">{list.filter(a => !a.active).length}</p>
          <p className="text-xs text-gray-500 mt-1">Đã ẩn</p>
        </div>
      </div>

      <div className="flex justify-end mb-5">
        <Button icon="➕" onClick={() => { setForm(EMPTY); setEditId(null); setShowModal(true); }}>
          Tạo thông báo mới
        </Button>
      </div>

      {/* Danh sách */}
      <div className="flex flex-col gap-3">
        {list.map(ann => {
          const type    = TYPES.find(t => t.value === ann.type) || TYPES[2];
          const isLive  = ann.active && new Date(ann.startDate) <= now && new Date(ann.endDate) >= now;
          return (
            <Card key={ann.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-2xl">{type.label.split(' ')[0]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-800">{ann.title}</p>
                      <Badge label={type.label.slice(3)} variant={type.variant} />
                      {isLive && <Badge label="🟢 Đang hiển thị" variant="green" />}
                      {!ann.active && <Badge label="⏸️ Đã ẩn" variant="gray" />}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{ann.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      📅 {new Date(ann.startDate).toLocaleDateString('vi-VN')}
                      {ann.startDate !== ann.endDate && ` — ${new Date(ann.endDate).toLocaleDateString('vi-VN')}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant={ann.active ? 'secondary' : 'success'}
                    onClick={() => toggleActive(ann.id)}>
                    {ann.active ? '⏸️ Ẩn' : '▶️ Hiện'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(ann)}>✏️</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(ann.id)}>🗑️</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal tạo/sửa */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(EMPTY); setEditId(null); }}
        title={editId ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'} size="lg"
        footer={<>
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(EMPTY); setEditId(null); }}>Hủy</Button>
          <Button loading={saving} icon="📢" onClick={handleSave}>
            {editId ? 'Cập nhật' : 'Đăng lên app'}
          </Button>
        </>}>
        <div className="flex flex-col gap-4">

          {/* Template nhanh */}
          {!editId && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">⚡ Mẫu thông báo nhanh</label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {QUICK_TEMPLATES.map((tpl, i) => (
                  <button key={i} onClick={() => applyTemplate(tpl)}
                    className="text-left p-3 bg-gray-50 hover:bg-primary-50 rounded-xl text-sm border border-gray-100 hover:border-primary-200 transition-all">
                    <p className="font-medium text-gray-800">{tpl.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tpl.message}</p>
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-2" />
            </div>
          )}

          {/* Loại thông báo */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Loại thông báo</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setForm(prev => ({ ...prev, type: t.value }))}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all
                    ${form.type === t.value ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Input label="Tiêu đề" name="title" value={form.title}
            onChange={handleChange} required placeholder="VD: Nghỉ lễ 30/4 - 1/5" />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nội dung <span className="text-red-500">*</span></label>
            <textarea name="message" value={form.message} onChange={handleChange}
              rows={4} className="input-field resize-none" placeholder="Nội dung thông báo..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Ngày bắt đầu hiển thị" name="startDate" type="date"
              value={form.startDate} onChange={handleChange} />
            <Input label="Ngày kết thúc hiển thị" name="endDate" type="date"
              value={form.endDate} onChange={handleChange} />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.showDate}
                onChange={e => setForm({ ...form, showDate: e.target.checked })}
                className="w-4 h-4 accent-orange-500" />
              <span className="text-sm text-gray-700">Hiện ngày tháng</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.dismissible}
                onChange={e => setForm({ ...form, dismissible: e.target.checked })}
                className="w-4 h-4 accent-orange-500" />
              <span className="text-sm text-gray-700">Cho phép đóng</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active}
                onChange={e => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4 accent-orange-500" />
              <span className="text-sm text-gray-700">Hiện ngay</span>
            </label>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default AnnouncementManage;