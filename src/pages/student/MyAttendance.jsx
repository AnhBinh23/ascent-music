import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const STATUS_VARIANT = { 'Có mặt': 'green', 'Vắng mặt': 'red', 'Đi trễ': 'orange', 'Có phép': 'blue' };
const STATUS_ICON    = { 'Có mặt': '✅', 'Vắng mặt': '❌', 'Đi trễ': '⏰', 'Có phép': '📋' };

const SAMPLE = [
  { date: '2025-05-19', class: 'Piano cơ bản 01', status: 'Có mặt',  note: '' },
  { date: '2025-05-17', class: 'Piano cơ bản 01', status: 'Có mặt',  note: '' },
  { date: '2025-05-14', class: 'Piano cơ bản 01', status: 'Đi trễ',  note: 'Đến muộn 10 phút' },
  { date: '2025-05-12', class: 'Piano cơ bản 01', status: 'Có mặt',  note: '' },
  { date: '2025-05-10', class: 'Piano cơ bản 01', status: 'Có phép', note: 'Bận việc gia đình' },
  { date: '2025-05-07', class: 'Piano cơ bản 01', status: 'Vắng mặt',note: '' },
];

const MyAttendance = () => {
  const present  = SAMPLE.filter(s => s.status === 'Có mặt').length;
  const absent   = SAMPLE.filter(s => s.status === 'Vắng mặt').length;
  const rate     = Math.round((present / SAMPLE.length) * 100);

  return (
    <MainLayout title="Điểm danh của tôi">
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{present}</p>
          <p className="text-xs text-gray-500 mt-1">Có mặt</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-500">{absent}</p>
          <p className="text-xs text-gray-500 mt-1">Vắng mặt</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{rate}%</p>
          <p className="text-xs text-gray-500 mt-1">Chuyên cần</p>
        </div>
      </div>

      {/* Thanh chuyên cần */}
      <Card className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Tỷ lệ chuyên cần</span>
          <span className={`font-bold ${rate >= 80 ? 'text-green-600' : 'text-red-500'}`}>{rate}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${rate >= 80 ? 'bg-green-500' : 'bg-red-400'}`}
            style={{ width: `${rate}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">Yêu cầu tối thiểu: 80%</p>
      </Card>

      <div className="flex flex-col gap-3">
        {SAMPLE.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-800">{item.class}</p>
              <p className="text-xs text-gray-400">{item.date}</p>
              {item.note && <p className="text-xs text-gray-500 mt-0.5 italic">"{item.note}"</p>}
            </div>
            <Badge label={`${STATUS_ICON[item.status]} ${item.status}`} variant={STATUS_VARIANT[item.status]} />
          </div>
        ))}
      </div>
    </MainLayout>
  );
};

export default MyAttendance;