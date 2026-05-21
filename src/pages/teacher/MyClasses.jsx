import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const SAMPLE = [
  { id: 'LH001', name: 'Piano cơ bản 01', type: '1v1',   room: 'Phòng 1', schedule: 'T2, T4 - 08:00', students: [{ name: 'Nguyễn Văn An', attendance: 95 }] },
  { id: 'LH002', name: 'Piano nâng cao',   type: '1v1',   room: 'Phòng 1', schedule: 'T2 - 10:00',     students: [{ name: 'Hoàng Văn Em', attendance: 80 }] },
  { id: 'LH003', name: 'Piano nhóm',       type: 'group', room: 'Phòng 2', schedule: 'T6 - 14:00',     students: [{ name: 'HV A', attendance: 90 }, { name: 'HV B', attendance: 85 }, { name: 'HV C', attendance: 75 }] },
];

const MyClasses = () => {
  const navigate = useNavigate();

  return (
    <MainLayout title="Lớp học của tôi">
      <div className="flex flex-col gap-4">
        {SAMPLE.map(cls => (
          <Card key={cls.id} title={cls.name}
            subtitle={`${cls.schedule} · ${cls.room}`}
            action={<Badge label={cls.type === '1v1' ? '1 kèm 1' : 'Nhóm'} variant={cls.type === '1v1' ? 'blue' : 'green'} />}>
            <div className="flex flex-col gap-2 mt-3">
              {cls.students.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-bold">
                      {s.name.charAt(0)}
                    </div>
                    <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.attendance >= 80 ? 'bg-green-500' : 'bg-red-400'}`}
                        style={{ width: `${s.attendance}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{s.attendance}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="secondary" icon="✅" onClick={() => navigate('/teacher/attendance')}>Điểm danh</Button>
              <Button size="sm" variant="secondary" icon="📝" onClick={() => navigate('/teacher/lesson-log')}>Nhật ký</Button>
            </div>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
};

export default MyClasses;