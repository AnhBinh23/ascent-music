import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';


const DAYS = ['T2','T3','T4','T5','T6','T7','CN'];

const SAMPLE = [
  { id: 1, day: 1, time: '08:00 - 09:00', className: 'Piano cơ bản 01', room: 'Phòng 1', type: '1v1',   students: ['Nguyễn Văn An'] },
  { id: 2, day: 1, time: '10:00 - 11:00', className: 'Piano nâng cao',   room: 'Phòng 1', type: '1v1',   students: ['Hoàng Văn Em'] },
  { id: 3, day: 3, time: '08:00 - 09:00', className: 'Piano cơ bản 01', room: 'Phòng 1', type: '1v1',   students: ['Nguyễn Văn An'] },
  { id: 4, day: 5, time: '14:00 - 15:00', className: 'Piano nhóm',       room: 'Phòng 2', type: 'group', students: ['HV A','HV B','HV C'] },
];

const MySchedule = () => {
  
  const totalSessions = SAMPLE.length;
  const totalStudents = new Set(SAMPLE.flatMap(s => s.students)).size;

  return (
    <MainLayout title="Lịch dạy của tôi">
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{totalSessions}</p>
          <p className="text-sm text-gray-500 mt-1">Buổi/tuần</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">{totalStudents}</p>
          <p className="text-sm text-gray-500 mt-1">Học viên</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {DAYS.map((day, i) => {
          const dayClasses = SAMPLE.filter(s => s.day === i + 1);
          if (!dayClasses.length) return null;
          return (
            <Card key={i} title={`${day} — ${dayClasses.length} buổi`}>
              <div className="flex flex-col gap-2 mt-2">
                {dayClasses.map(cls => (
                  <div key={cls.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div className="text-center min-w-[52px]">
                      <p className="text-sm font-bold text-primary-600">{cls.time.split(' - ')[0]}</p>
                      <p className="text-xs text-gray-400">{cls.time.split(' - ')[1]}</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{cls.className}</p>
                      <p className="text-xs text-gray-500">{cls.room} · {cls.students.join(', ')}</p>
                    </div>
                    <Badge label={cls.type === '1v1' ? '1 kèm 1' : 'Nhóm'} variant={cls.type === '1v1' ? 'blue' : 'green'} />
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </MainLayout>
  );
};

export default MySchedule;