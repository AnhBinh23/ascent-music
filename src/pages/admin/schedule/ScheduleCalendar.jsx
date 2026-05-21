import React, { useState } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { toast } from 'react-toastify';

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const HOURS = ['07:00','08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
const COLORS = { Piano: 'bg-blue-100 text-blue-700', Guitar: 'bg-green-100 text-green-700', Violin: 'bg-purple-100 text-purple-700', 'Thanh nhạc': 'bg-orange-100 text-orange-700' };

const SAMPLE_SCHEDULE = [
  { id: 1, className: 'Piano cơ bản', teacher: 'Nguyễn Thị Mai', room: 'Phòng 1', day: 1, hour: '08:00', instrument: 'Piano',    type: '1v1' },
  { id: 2, className: 'Guitar nhóm',  teacher: 'Trần Văn Hùng',  room: 'Phòng 2', day: 1, hour: '09:00', instrument: 'Guitar',   type: 'group' },
  { id: 3, className: 'Violin cb',    teacher: 'Lê Thị Hoa',     room: 'Phòng 3', day: 3, hour: '08:00', instrument: 'Violin',   type: '1v1' },
  { id: 4, className: 'Thanh nhạc',   teacher: 'Phạm Minh Tuấn', room: 'Phòng 2', day: 2, hour: '14:00', instrument: 'Thanh nhạc', type: 'group' },
  { id: 5, className: 'Piano nc',     teacher: 'Nguyễn Thị Mai', room: 'Phòng 1', day: 4, hour: '10:00', instrument: 'Piano',    type: '1v1' },
  { id: 6, className: 'Guitar cb',    teacher: 'Trần Văn Hùng',  room: 'Phòng 2', day: 5, hour: '08:00', instrument: 'Guitar',   type: '1v1' },
];

const EMPTY_FORM = { className: '', teacher: '', room: 'Phòng 1', day: 1, hour: '08:00', instrument: 'Piano', type: '1v1' };

const ScheduleCalendar = () => {
  const [schedule, setSchedule] = useState(SAMPLE_SCHEDULE);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  
  const getCell = (day, hour) => schedule.find(s => s.day === day && s.hour === hour);
  const [selectedCell, setSelectedCell] = useState(null);
  const handleCellClick = (day, hour) => {
    const existing = getCell(day, hour);
    if (existing) return;
    setForm({ ...EMPTY_FORM, day, hour });
    setSelectedCell({ day, hour });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.className || !form.teacher) { toast.error('Vui lòng điền đủ thông tin!'); return; }
    const conflict = schedule.find(s =>
      s.day === form.day && s.hour === form.hour &&
      (s.teacher === form.teacher || s.room === form.room)
    );
    if (conflict) { toast.error('⚠️ Trùng lịch giáo viên hoặc phòng học!'); return; }
    
    toast.success('Thêm lịch thành công!');
    setShowModal(false);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setSchedule(prev => prev.filter(s => s.id !== id));
    toast.success('Đã xóa lịch!');
  };

  return (
    <MainLayout title="Lịch học">
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-gray-500">Nhấn vào ô trống để thêm lịch học</p>
        <Button icon="➕" onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}>
          Thêm lịch
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="w-16 p-2 text-gray-400 font-medium text-left">Giờ</th>
                {DAYS.map((d, i) => (
                  <th key={i} className="p-2 text-center text-gray-600 font-medium min-w-[110px]">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour} className="border-t border-gray-50">
                  <td className="p-2 text-xs text-gray-400 whitespace-nowrap">{hour}</td>
                  {DAYS.map((_, dayIdx) => {
                    const cell = getCell(dayIdx + 1, hour);
                    return (
                      <td key={dayIdx} className="p-1 align-top">
                        {cell ? (
                          <div className={`p-2 rounded-xl text-xs cursor-pointer relative group ${COLORS[cell.instrument] || 'bg-gray-100 text-gray-700'}`}>
                            <p className="font-medium truncate">{cell.className}</p>
                            <p className="opacity-70 truncate">{cell.teacher}</p>
                            <p className="opacity-70">{cell.room}</p>
                            <Badge label={cell.type === '1v1' ? '1:1' : 'Nhóm'} variant={cell.type === '1v1' ? 'blue' : 'green'} />
                            <button
                              onClick={(e) => handleDelete(cell.id, e)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity text-xs"
                            >✕</button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleCellClick(dayIdx + 1, hour)}
                            className="h-12 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-dashed border-transparent hover:border-gray-200"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Thêm lịch học"
        footer={<>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
          <Button onClick={handleSave}>Lưu lịch</Button>
        </>}>
        <div className="flex flex-col gap-4">
          <Input label="Tên lớp học" name="className" value={form.className}
            onChange={e => setForm({ ...form, className: e.target.value })} required placeholder="VD: Piano cơ bản 01" />
          <Input label="Giáo viên" name="teacher" value={form.teacher}
            onChange={e => setForm({ ...form, teacher: e.target.value })} required placeholder="Tên giáo viên" />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Thứ</label>
              <select value={form.day} onChange={e => setForm({ ...form, day: parseInt(e.target.value) })} className="input-field">
                {DAYS.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Giờ bắt đầu</label>
              <select value={form.hour} onChange={e => setForm({ ...form, hour: e.target.value })} className="input-field">
                {HOURS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Phòng học</label>
              <select value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} className="input-field">
                {['Phòng 1','Phòng 2','Phòng 3','Phòng 4'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Hình thức</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field">
                <option value="1v1">1 kèm 1</option>
                <option value="group">Nhóm</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default ScheduleCalendar;