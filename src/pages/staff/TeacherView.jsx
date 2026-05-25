import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/shared/SearchBar';
import api from '../../services/api';

const INSTRUMENT_COLOR = { Piano: 'blue', Guitar: 'green', Violin: 'purple', 'Thanh nhạc': 'orange' };

const TeacherView = () => {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/teachers')
      .then(data => setTeachers(data.rows || data || []))
      .catch(err => console.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = teachers.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.instrument?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout title="Danh sách giáo viên">
      <div className="mb-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên, nhạc cụ..." />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Không tìm thấy giáo viên</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(t => (
            <Card key={t.id}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                  {t.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-gray-800">{t.name}</p>
                    <Badge
                      label={t.instrument}
                      variant={INSTRUMENT_COLOR[t.instrument] || 'gray'}
                    />
                  </div>
                  <p className="text-sm text-gray-500">📱 {t.phone}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Kinh nghiệm: {t.experience || t.experience_years || '—'}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge
                      label={t.status === 'active' ? 'Đang dạy' : 'Nghỉ'}
                      variant={t.status === 'active' ? 'green' : 'gray'}
                      dot
                    />
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

export default TeacherView;