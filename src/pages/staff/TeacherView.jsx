import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/shared/SearchBar';

const SAMPLE = [
  { id: 'GV001', name: 'Nguyễn Thị Mai',  phone: '0901111111', instrument: 'Piano',      experience: '5 năm', sessions: 22, status: 'active' },
  { id: 'GV002', name: 'Trần Văn Hùng',   phone: '0902222222', instrument: 'Guitar',     experience: '3 năm', sessions: 18, status: 'active' },
  { id: 'GV003', name: 'Lê Thị Hoa',      phone: '0903333333', instrument: 'Violin',     experience: '7 năm', sessions: 20, status: 'active' },
  { id: 'GV004', name: 'Phạm Minh Tuấn',  phone: '0904444444', instrument: 'Thanh nhạc', experience: '4 năm', sessions: 16, status: 'active' },
];

const INSTRUMENT_COLOR = { Piano: 'blue', Guitar: 'green', Violin: 'purple', 'Thanh nhạc': 'orange' };

const TeacherView = () => {
  const [search, setSearch] = useState('');
  const filtered = SAMPLE.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.instrument.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout title="Danh sách giáo viên">
      <div className="mb-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên, nhạc cụ..." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map(t => (
          <Card key={t.id}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                {t.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-800">{t.name}</p>
                  <Badge label={t.instrument} variant={INSTRUMENT_COLOR[t.instrument] || 'gray'} />
                </div>
                <p className="text-sm text-gray-500">📱 {t.phone}</p>
                <p className="text-xs text-gray-400 mt-0.5">Kinh nghiệm: {t.experience}</p>
                <div className="flex gap-3 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary-600">{t.sessions}</p>
                    <p className="text-xs text-gray-400">Buổi/tháng</p>
                  </div>
                  <Badge label={t.status === 'active' ? 'Đang dạy' : 'Nghỉ'} variant={t.status === 'active' ? 'green' : 'gray'} dot />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
};

export default TeacherView;