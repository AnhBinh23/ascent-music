import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const DAYS = ['T2','T3','T4','T5','T6','T7','CN'];

const SAMPLE = [
  { id: 1, day: 1, time: '08:00 - 09:00', className: 'Piano cơ bản 01', teacher: 'Nguyễn Thị Mai', room: 'Phòng 1', instrument: 'Piano' },
  { id: 2, day: 3, time: '10:00 - 11:00', className: 'Piano cơ bản 01', teacher: 'Nguyễn Thị Mai', room: 'Phòng 1', instrument: 'Piano' },
];

const MySchedule = () => {
  
  const [view, setView] = useState('week');

  return (
    <MainLayout title="Lịch học của tôi">
      <div className="flex gap-2 mb-5">
        {['week','list'].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${view === v ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {v === 'week' ? '📅 Tuần' : '📋 Danh sách'}
          </button>
        ))}
      </div>

      {view === 'week' ? (
        <Card title="Lịch học tuần này">
          <div className="grid grid-cols-7 gap-2 mt-3">
            {DAYS.map((day, i) => {
              const dayClasses = SAMPLE.filter(s => s.day === i + 1);
              return (
                <div key={i} className="flex flex-col gap-2">
                  <p className={`text-xs font-medium text-center py-1 rounded-lg
                    ${i === new Date().getDay() - 1 ? 'bg-primary-600 text-white' : 'text-gray-500'}`}>{day}</p>
                  {dayClasses.map(cls => (
                    <div key={cls.id} className="p-2 bg-primary-50 rounded-xl">
                      <p className="text-xs font-medium text-primary-700 truncate">{cls.className}</p>
                      <p className="text-xs text-gray-500">{cls.time.split(' - ')[0]}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {SAMPLE.map(cls => (
            <Card key={cls.id}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-2xl">🎹</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{cls.className}</p>
                  <p className="text-sm text-gray-500">{cls.teacher} · {cls.room}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge label={DAYS[cls.day - 1]} variant="blue" />
                    <Badge label={cls.time} variant="gray" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default MySchedule;