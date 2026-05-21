import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { toast } from 'react-toastify';


const SAMPLE_CLASSES = [
  {
    id: 'LH001', name: 'Piano cơ bản 01', time: '08:00 - 09:00', room: 'Phòng 1', type: '1v1',
    students: [{ id: 'HV001', name: 'Nguyễn Văn An' }],
  },
  {
    id: 'LH002', name: 'Guitar nhóm 01', time: '10:00 - 11:00', room: 'Phòng 2', type: 'group',
    students: [
      { id: 'HV002', name: 'Trần Thị Bình' },
      { id: 'HV003', name: 'Lê Minh Châu' },
      { id: 'HV004', name: 'Hoàng Văn Em' },
    ],
  },
];

const STATUS_OPTIONS = [
  { value: 'present', label: 'Có mặt',  color: 'bg-green-100 text-green-700',  icon: '✅' },
  { value: 'absent',  label: 'Vắng mặt', color: 'bg-red-100 text-red-700',    icon: '❌' },
  { value: 'late',    label: 'Đi trễ',   color: 'bg-yellow-100 text-yellow-700', icon: '⏰' },
  { value: 'excused', label: 'Có phép',  color: 'bg-blue-100 text-blue-700',   icon: '📋' },
];

const Attendance = () => {
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (SAMPLE_CLASSES.length > 0) setSelectedClass(SAMPLE_CLASSES[0]);
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    const initial = {};
    const initNotes = {};
    selectedClass.students.forEach(s => {
      initial[s.id] = 'present';
      initNotes[s.id] = '';
    });
    setAttendance(initial);
    setNotes(initNotes);
    setSaved(false);
  }, [selectedClass, selectedDate]);

  const handleStatus = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      toast.success('Lưu điểm danh thành công!');
      setSaved(true);
    } catch {
      toast.error('Lỗi lưu điểm danh!');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount  = Object.values(attendance).filter(s => s === 'absent').length;

  return (
    <MainLayout title="Điểm danh">
      {/* Chọn ngày */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input type="date" value={selectedDate}
          onChange={e => { setSelectedDate(e.target.value); setSaved(false); }}
          className="input-field w-auto" />
        {saved && <Badge label="✅ Đã lưu điểm danh" variant="green" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Danh sách lớp */}
        <Card title="Lớp học hôm nay">
          <div className="flex flex-col gap-2">
            {SAMPLE_CLASSES.map(cls => (
              <button key={cls.id} onClick={() => setSelectedClass(cls)}
                className={`text-left p-3 rounded-xl border transition-all
                  ${selectedClass?.id === cls.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-100 hover:bg-gray-50'}`}>
                <p className="text-sm font-medium text-gray-800">{cls.name}</p>
                <p className="text-xs text-gray-500">{cls.time} · {cls.room}</p>
                <div className="flex gap-1 mt-1">
                  <Badge label={cls.type === '1v1' ? '1 kèm 1' : 'Nhóm'} variant={cls.type === '1v1' ? 'blue' : 'green'} />
                  <Badge label={`${cls.students.length} HV`} variant="gray" />
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Điểm danh */}
        <div className="lg:col-span-2">
          {selectedClass ? (
            <Card title={selectedClass.name}
              subtitle={`${selectedClass.time} · ${selectedClass.room}`}
              action={
                <div className="flex gap-2 text-xs">
                  <span className="badge-green">✅ {presentCount}</span>
                  <span className="badge-red">❌ {absentCount}</span>
                </div>
              }>
              <div className="flex flex-col gap-3">
                {selectedClass.students.map(student => {
                  const status = attendance[student.id] || 'present';
                  const statusInfo = STATUS_OPTIONS.find(s => s.value === status);
                  return (
                    <div key={student.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                            {student.name.charAt(0)}
                          </div>
                          <p className="font-medium text-gray-800">{student.name}</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo?.color}`}>
                          {statusInfo?.icon} {statusInfo?.label}
                        </span>
                      </div>
                      {/* Status buttons */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {STATUS_OPTIONS.map(opt => (
                          <button key={opt.value}
                            onClick={() => handleStatus(student.id, opt.value)}
                            className={`py-1.5 rounded-lg text-xs font-medium transition-all border
                              ${status === opt.value
                                ? `${opt.color} border-transparent`
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>
                      {/* Ghi chú */}
                      <input
                        type="text"
                        placeholder="Ghi chú (không bắt buộc)..."
                        value={notes[student.id] || ''}
                        onChange={e => setNotes(prev => ({ ...prev, [student.id]: e.target.value }))}
                        className="input-field text-xs"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-4">
                <Button fullWidth loading={saving} icon="💾" onClick={handleSave}>
                  Lưu điểm danh
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-center text-gray-400 py-10">Chọn lớp để điểm danh</p>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Attendance;