import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const DAYS    = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];
const HOURS   = ['07:00','08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
const ROOMS   = ['Phòng 1','Phòng 2','Phòng 3','Phòng 4'];
const DURATION = ['30 phút','45 phút','60 phút','90 phút'];

const EMPTY = {
  className: '', teacher: '', room: 'Phòng 1',
  day: 'Thứ 2', timeStart: '08:00', duration: '60 phút',
  type: '1v1', repeatWeekly: true, startDate: '', endDate: '', note: '',
};

const ScheduleForm = () => {
  const navigate = useNavigate();
  const [form, setForm]     = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.className || !form.teacher) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 700));
      toast.success('Thêm lịch học thành công!');
      navigate('/admin/schedule');
    } catch {
      toast.error('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Thêm lịch học">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <Card title="Thông tin buổi học">
            <div className="flex flex-col gap-4">
              <Input label="Tên lớp học" name="className" value={form.className}
                onChange={handleChange} required placeholder="VD: Piano cơ bản 01" />
              <Input label="Giáo viên" name="teacher" value={form.teacher}
                onChange={handleChange} required placeholder="Tên giáo viên" />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Hình thức</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: '1v1',   label: '🎹 1 kèm 1' },
                    { value: 'group', label: '👥 Nhóm' },
                  ].map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setForm({ ...form, type: t.value })}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all
                        ${form.type === t.value
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-600 border-gray-200'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Phòng học</label>
                <select name="room" value={form.room} onChange={handleChange} className="input-field">
                  {ROOMS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea name="note" value={form.note} onChange={handleChange}
                  rows={2} className="input-field resize-none" placeholder="Ghi chú thêm..." />
              </div>
            </div>
          </Card>

          <Card title="Lịch học">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Ngày trong tuần</label>
                <div className="grid grid-cols-4 gap-1">
                  {DAYS.map(d => (
                    <button key={d} type="button"
                      onClick={() => setForm({ ...form, day: d })}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-all border
                        ${form.day === d
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      {d.replace('Thứ ', 'T').replace('Chủ nhật', 'CN')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Giờ bắt đầu</label>
                  <select name="timeStart" value={form.timeStart} onChange={handleChange} className="input-field">
                    {HOURS.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Thời lượng</label>
                  <select name="duration" value={form.duration} onChange={handleChange} className="input-field">
                    {DURATION.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Lặp lại hàng tuần</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: true,  label: '🔁 Có, lặp hàng tuần' },
                    { value: false, label: '📅 Không, 1 buổi duy nhất' },
                  ].map(opt => (
                    <button key={String(opt.value)} type="button"
                      onClick={() => setForm({ ...form, repeatWeekly: opt.value })}
                      className={`py-2 rounded-xl text-xs font-medium border transition-all
                        ${form.repeatWeekly === opt.value
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-600 border-gray-200'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Input label="Ngày bắt đầu" name="startDate" type="date"
                value={form.startDate} onChange={handleChange} />

              {form.repeatWeekly && (
                <Input label="Ngày kết thúc" name="endDate" type="date"
                  value={form.endDate} onChange={handleChange} />
              )}

              {/* Preview */}
              <div className="p-3 bg-primary-50 rounded-xl border border-primary-100">
                <p className="text-xs font-medium text-primary-600 mb-1">📋 Xem trước lịch</p>
                <p className="text-sm text-gray-700">
                  {form.day} · {form.timeStart} · {form.duration}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {form.room} · {form.type === '1v1' ? '1 kèm 1' : 'Nhóm'}
                  {form.repeatWeekly ? ' · Lặp hàng tuần' : ' · 1 buổi'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <Button variant="secondary" type="button" onClick={() => navigate('/admin/schedule')}>Hủy</Button>
          <Button type="submit" loading={loading} icon="💾">Lưu lịch học</Button>
        </div>
      </form>
    </MainLayout>
  );
};

export default ScheduleForm;