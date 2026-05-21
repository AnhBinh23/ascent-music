import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import attendanceService from '../../services/attendanceService';
import api from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_LIST = [
  { value: 'present', label: '✅ Có mặt',  variant: 'green'  },
  { value: 'absent',  label: '❌ Vắng mặt', variant: 'red'    },
  { value: 'late',    label: '⏰ Đi muộn',  variant: 'orange' },
  { value: 'excused', label: '📝 Phép',     variant: 'blue'   },
];

const Attendance = () => {
  const [classes, setClasses]     = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents]   = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    api.get('/classes').then(d => setClasses(d.rows || [])).catch(() => {});
  }, []);

  useEffect(() => {
  if (!selectedClass) return;
  setLoading(true);
  Promise.all([
    api.get(`/classes/${selectedClass}/students`),
    attendanceService.getByClass(selectedClass),
  ]).then(([classData, attData]) => {
    setStudents(classData.rows || []);
    const map = {};
    attData.filter(a => a.date === date).forEach(a => {
      map[a.student_id] = a.status;
    });
    setAttendance(map);
  }).catch(err => toast.error(err.message))
  .finally(() => setLoading(false));
}, [selectedClass, date]);

  const handleSave = async () => {
    if (!selectedClass) { toast.error('Chọn lớp học!'); return; }
    setSaving(true);
    try {
      const list = students.map(s => ({
        class_id:   selectedClass,
        student_id: s.id,
        date,
        status:     attendance[s.id] || 'present',
        note:       '',
      }));
      await attendanceService.save(list);
      toast.success('Lưu điểm danh thành công!');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <MainLayout title="Điểm danh">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input-field w-full">
            <option value="">-- Chọn lớp học --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="input-field w-auto" />
      </div>

      {selectedClass && (
        <Card title={`Điểm danh ngày ${new Date(date).toLocaleDateString('vi-VN')}`}>
          {loading ? (
            <p className="text-center text-gray-400 py-8">Đang tải...</p>
          ) : students.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Lớp này chưa có học viên</p>
          ) : (
            <div className="flex flex-col gap-3 mt-3">
              {students.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
                      {i + 1}
                    </div>
                    <p className="font-medium text-gray-800">{s.name}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {STATUS_LIST.map(st => (
                      <button key={st.value}
                        onClick={() => setAttendance({ ...attendance, [s.id]: st.value })}
                        className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all
                          ${attendance[s.id] === st.value
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-3 mt-3 justify-end">
                <Button loading={saving} icon="💾" onClick={handleSave}>Lưu điểm danh</Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </MainLayout>
  );
};

export default Attendance;